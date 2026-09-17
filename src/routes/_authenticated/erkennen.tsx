import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { recognizeImage, type RecognitionResult } from "@/lib/recognition.functions";

export const Route = createFileRoute("/_authenticated/erkennen")({
  head: () => ({
    meta: [
      { title: "Erkennen — Artenblick" },
      {
        name: "description",
        content: "Lade ein Foto hoch und bestimme Pflanzen, Tiere und Pilze in Sekunden.",
      },
      { property: "og:title", content: "Erkennen — Artenblick" },
      {
        property: "og:description",
        content: "Lade ein Foto hoch und bestimme Pflanzen, Tiere und Pilze in Sekunden.",
      },
    ],
  }),
  component: RecognizePage,
});

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Bild konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

function RecognizePage() {
  const recognize = useServerFn(recognizeImage);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setResult(null);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      let imagePath: string | null = null;

      if (userId) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("observations").upload(path, file, {
          contentType: file.type || "image/jpeg",
        });
        if (!error) imagePath = path;
      }

      const recognition = await recognize({ data: { imageDataUrl: dataUrl, imagePath } });
      setResult(recognition);
      queryClient.invalidateQueries({ queryKey: ["observations"] });
      toast.success("Bestimmung fertig");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Das hat leider nicht geklappt.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPreview(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-bold">Neue Bestimmung</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Am besten funktioniert ein scharfes, nahes Foto bei Tageslicht.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          {preview ? (
            <img src={preview} alt="Dein hochgeladenes Foto" className="max-h-96 w-full object-cover" />
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="surface-mint flex w-full flex-col items-center gap-3 px-6 py-20 text-center transition-opacity hover:opacity-90"
            >
              <Camera className="size-8 text-primary" />
              <span className="text-base font-semibold">Foto auswählen oder aufnehmen</span>
              <span className="text-xs text-muted-foreground">JPG oder PNG, bis 10 MB</span>
            </button>
          )}

          <div className="flex flex-wrap gap-3 border-t border-border p-5">
            <Button onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {busy ? "Wird bestimmt…" : preview ? "Anderes Foto" : "Foto wählen"}
            </Button>
            {preview && (
              <Button variant="outline" onClick={reset} disabled={busy}>
                <RotateCcw className="size-4" />
                Zurücksetzen
              </Button>
            )}
          </div>
        </div>

        {result && (
          <article className="mt-8 rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                {result.kind}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Sicherheit {result.confidence}%
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-bold">{result.common_name}</h2>
            {result.scientific_name && (
              <p className="mt-1 text-sm italic text-muted-foreground">{result.scientific_name}</p>
            )}
            {result.summary && <p className="mt-4 text-sm leading-relaxed">{result.summary}</p>}

            {result.facts.length > 0 && (
              <ul className="mt-5 space-y-2">
                {result.facts.map((fact) => (
                  <li key={fact} className="flex gap-3 text-sm">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            )}

            {result.caution && (
              <div className="mt-6 flex gap-3 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent" />
                <p>{result.caution}</p>
              </div>
            )}

            <p className="mt-6 text-xs text-muted-foreground">
              Gespeichert in{" "}
              <Link to="/funde" className="font-semibold text-accent hover:underline">
                Meine Funde
              </Link>
              .
            </p>
          </article>
        )}
      </main>
    </div>
  );
}
