import { createFileRoute, Link } from "@tanstack/react-router";
import { Leaf, Bird, Sprout, Camera, BookOpen, History } from "lucide-react";
import heroImage from "@/assets/hero-nature.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Artenblick — Pflanzen, Tiere und Pilze per Foto erkennen" },
      {
        name: "description",
        content:
          "Fotografiere Pflanzen, Tiere oder Pilze und erhalte sofort Name, Steckbrief und Wissenswertes. Jeder Fund landet in deiner Sammlung.",
      },
      { property: "og:title", content: "Artenblick — Natur per Foto erkennen" },
      {
        property: "og:description",
        content:
          "Pflanzen, Tiere und Pilze bestimmen, Steckbriefe lesen und eigene Funde sammeln.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Camera,
    title: "Foto hochladen",
    text: "Kamera oder Galerie — ein Bild reicht für die Bestimmung.",
  },
  {
    icon: BookOpen,
    title: "Steckbrief lesen",
    text: "Name, wissenschaftliche Bezeichnung, Fakten und Warnhinweise.",
  },
  {
    icon: History,
    title: "Funde sammeln",
    text: "Jede Erkennung bleibt mit Foto und Notiz in deiner Sammlung.",
  },
];

const kinds = [
  { icon: Sprout, label: "Pflanzen", text: "Blumen, Bäume, Gräser und Kräuter" },
  { icon: Bird, label: "Tiere", text: "Vögel, Insekten, Säugetiere" },
  { icon: Leaf, label: "Pilze", text: "Immer mit Sicherheitshinweis" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Leaf className="size-4" />
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.18em]">Artenblick</span>
        </div>
        <Button asChild variant="ghost">
          <Link to="/auth">Anmelden</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-6 lg:grid-cols-[1.05fr_1fr] lg:pt-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Bestimmen · Verstehen · Sammeln
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              Was wächst und krabbelt da eigentlich?
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Fotografiere eine Pflanze, ein Tier oder einen Pilz — Artenblick liefert dir
              Sekunden später Namen, Steckbrief und spannende Details. Alles bleibt in deiner
              persönlichen Fundsammlung.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Kostenlos starten</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Ich habe schon ein Konto</Link>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl shadow-lift">
            <img
              src={heroImage}
              alt="Farnwedel mit Tautropfen und ein kleiner Vogel als Bestimmungstafel"
              width={1536}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="surface-deep">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:grid-cols-3">
            {kinds.map((k) => (
              <div key={k.label}>
                <k.icon className="size-6 text-accent" />
                <h2 className="mt-4 text-lg font-bold">{k.label}</h2>
                <p className="mt-2 text-sm opacity-75">{k.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold">In drei Schritten zum Fund</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                  0{i + 1}
                </span>
                <f.icon className="mt-4 size-6 text-primary" />
                <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground">
          <span>Artenblick — Natur beobachten und verstehen</span>
          <span>Bestimmungen sind Hinweise, kein Ersatz für Fachwissen.</span>
        </div>
      </footer>
    </div>
  );
}
