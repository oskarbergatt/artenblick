import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type RecognitionResult = {
  kind: string;
  common_name: string;
  scientific_name: string | null;
  confidence: number;
  summary: string;
  facts: string[];
  caution: string | null;
};

const SYSTEM_PROMPT = `Du bist ein erfahrener Biologe und Bestimmungsexperte für Pflanzen, Tiere und Pilze.
Analysiere das Foto und bestimme die Art so genau wie möglich.
Antworte AUSSCHLIESSLICH mit einem JSON-Objekt in diesem Format:
{"kind":"Pflanze|Tier|Pilz|Unbekannt","common_name":"deutscher Name","scientific_name":"lateinischer Name oder null","confidence":0-100,"summary":"2-3 Sätze Beschreibung auf Deutsch","facts":["4 kurze spannende Fakten auf Deutsch"],"caution":"Warnhinweis bei Giftigkeit/Verwechslungsgefahr, sonst null"}
Bei Pilzen IMMER einen Warnhinweis setzen, dass eine Bestimmung per Foto nie zum Verzehr ausreicht.
Wenn nichts Lebendiges erkennbar ist, setze kind auf "Unbekannt" und confidence niedrig.`;

export const recognizeImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { imageDataUrl: string; imagePath: string | null }) => {
    if (!data?.imageDataUrl?.startsWith("data:image/")) {
      throw new Error("Ungültiges Bild");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("KI ist derzeit nicht verfügbar.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Was ist auf diesem Bild zu sehen?" },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429) throw new Error("Zu viele Anfragen. Bitte kurz warten.");
      if (response.status === 402) throw new Error("Das KI-Guthaben ist aufgebraucht.");
      throw new Error(`Erkennung fehlgeschlagen (${response.status}): ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Die Erkennung hat keine verwertbare Antwort geliefert.");

    const parsed = JSON.parse(match[0]) as Partial<RecognitionResult>;
    const result: RecognitionResult = {
      kind: parsed.kind || "Unbekannt",
      common_name: parsed.common_name || "Nicht bestimmbar",
      scientific_name: parsed.scientific_name || null,
      confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0))),
      summary: parsed.summary || "",
      facts: Array.isArray(parsed.facts) ? parsed.facts.slice(0, 6).map(String) : [],
      caution: parsed.caution || null,
    };

    const { data: inserted, error } = await context.supabase
      .from("observations")
      .insert({
        user_id: context.userId,
        image_path: data.imagePath,
        kind: result.kind,
        common_name: result.common_name,
        scientific_name: result.scientific_name,
        confidence: result.confidence,
        summary: result.summary,
        facts: result.facts,
        caution: result.caution,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    return { ...result, id: inserted.id };
  });
