import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Anmelden — Artenblick" },
      {
        name: "description",
        content: "Melde dich mit E-Mail oder Google an und sammle deine Naturfunde.",
      },
      { property: "og:title", content: "Anmelden — Artenblick" },
      {
        property: "og:description",
        content: "Melde dich mit E-Mail oder Google an und sammle deine Naturfunde.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/erkennen", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/erkennen", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        setSent(true);
        toast.success("Fast geschafft — bitte bestätige die E-Mail in deinem Postfach.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google-Anmeldung fehlgeschlagen.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/erkennen", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="surface-deep hidden flex-col justify-between p-12 lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Leaf className="size-4" />
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.18em]">Artenblick</span>
        </Link>
        <div className="max-w-sm">
          <h2 className="text-3xl font-bold leading-tight">
            Ein Foto genügt — der Rest ist Bestimmungsarbeit.
          </h2>
          <p className="mt-4 text-sm leading-relaxed opacity-80">
            Pflanzen, Tiere und Pilze erkennen, Steckbriefe lesen und jeden Fund in deiner
            persönlichen Sammlung behalten.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] opacity-60">Natur beobachten &amp; verstehen</p>
      </div>

      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">
            {mode === "signin" ? "Willkommen zurück" : "Konto erstellen"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Melde dich an, um weiter zu bestimmen."
              : "Starte deine eigene Fundsammlung."}
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-7 w-full"
            onClick={handleGoogle}
            disabled={loading}
          >
            Mit Google fortfahren
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            oder
            <span className="h-px flex-1 bg-border" />
          </div>

          {sent ? (
            <div className="rounded-lg border border-border bg-secondary/50 p-4 text-sm">
              Wir haben dir eine Bestätigungs-Mail an <strong>{email}</strong> geschickt. Öffne den
              Link darin, um loszulegen.
            </div>
          ) : (
            <form onSubmit={handleEmail} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Wie sollen wir dich nennen?"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="du@beispiel.de"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {mode === "signin" ? "Anmelden" : "Registrieren"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Noch kein Konto?" : "Schon registriert?"}{" "}
            <button
              type="button"
              className="font-semibold text-accent underline-offset-4 hover:underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setSent(false);
              }}
            >
              {mode === "signin" ? "Registrieren" : "Anmelden"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
