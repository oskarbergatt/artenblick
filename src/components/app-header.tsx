import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Leaf, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5">
        <Link to="/erkennen" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Leaf className="size-4" />
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.18em]">Artenblick</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/erkennen"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-foreground" }}
          >
            Erkennen
          </Link>
          <Link
            to="/funde"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-sm font-semibold text-foreground" }}
          >
            Meine Funde
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Abmelden">
            <LogOut className="size-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}
