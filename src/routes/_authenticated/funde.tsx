import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2, AlertTriangle, Camera } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/funde")({
  head: () => ({
    meta: [
      { title: "Meine Funde — Artenblick" },
      {
        name: "description",
        content: "Alle deine bestimmten Pflanzen, Tiere und Pilze an einem Ort.",
      },
      { property: "og:title", content: "Meine Funde — Artenblick" },
      {
        property: "og:description",
        content: "Alle deine bestimmten Pflanzen, Tiere und Pilze an einem Ort.",
      },
    ],
  }),
  component: FundePage,
});

type Observation = {
  id: string;
  image_path: string | null;
  kind: string;
  common_name: string;
  scientific_name: string | null;
  confidence: number | null;
  summary: string | null;
  facts: unknown;
  caution: string | null;
  created_at: string;
  imageUrl?: string | null;
};

function FundePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["observations"],
    queryFn: async (): Promise<Observation[]> => {
      const { data: rows, error } = await supabase
        .from("observations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      return Promise.all(
        (rows ?? []).map(async (row) => {
          if (!row.image_path) return { ...row, imageUrl: null } as Observation;
          const { data: signed } = await supabase.storage
            .from("observations")
            .createSignedUrl(row.image_path, 3600);
          return { ...row, imageUrl: signed?.signedUrl ?? null } as Observation;
        }),
      );
    },
  });

  const remove = useMutation({
    mutationFn: async (item: Observation) => {
      if (item.image_path) {
        await supabase.storage.from("observations").remove([item.image_path]);
      }
      const { error } = await supabase.from("observations").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observations"] });
      toast.success("Fund gelöscht");
    },
    onError: () => toast.error("Löschen fehlgeschlagen"),
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Meine Funde</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {data?.length ? `${data.length} Bestimmungen gespeichert` : "Deine Sammlung"}
            </p>
          </div>
          <Button asChild>
            <Link to="/erkennen">
              <Camera className="size-4" />
              Neue Bestimmung
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.length ? (
          <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Noch keine Funde. Lade dein erstes Foto hoch.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => {
              const facts = Array.isArray(item.facts) ? (item.facts as string[]) : [];
              return (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.common_name}
                      loading="lazy"
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="surface-mint h-44 w-full" />
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                        {item.kind}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("de-DE")}
                      </span>
                    </div>

                    <h2 className="mt-2 text-lg font-bold leading-tight">{item.common_name}</h2>
                    {item.scientific_name && (
                      <p className="text-xs italic text-muted-foreground">{item.scientific_name}</p>
                    )}
                    {item.summary && (
                      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                        {item.summary}
                      </p>
                    )}

                    {facts.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {facts.slice(0, 2).map((fact) => (
                          <li key={fact} className="flex gap-2 text-xs text-muted-foreground">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" />
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.caution && (
                      <div className="mt-3 flex gap-2 rounded-md bg-accent/10 p-3 text-xs">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-accent" />
                        <span>{item.caution}</span>
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="text-xs text-muted-foreground">
                        Sicherheit {item.confidence ?? 0}%
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Fund löschen"
                        onClick={() => remove.mutate(item)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
