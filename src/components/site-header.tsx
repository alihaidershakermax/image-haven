import { Link } from "@tanstack/react-router";
import { Moon, Sun, Home, LogIn, Shield } from "lucide-react";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { isAdmin as isAdminFn } from "@/server/images.functions";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const adminQuery = useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: () => isAdminFn(),
    enabled: !!user,
    retry: false,
  });
  const showAdmin = !!user && adminQuery.data?.isAdmin;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl tracking-tight">Unposed</span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            <Link to="/" activeOptions={{ exact: true }}
              activeProps={{ className: "bg-muted text-foreground" }}
              className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground">
              Explore
            </Link>
            {showAdmin && (
              <Link to="/admin" activeProps={{ className: "bg-muted text-foreground" }}
                className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground">
                <Shield className="mr-1 inline h-3.5 w-3.5" /> Dashboard
              </Link>
            )}
            {!user && (
              <Link to="/login"
                className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground">
                <LogIn className="mr-1 inline h-3.5 w-3.5" /> Sign in
              </Link>
            )}
            <button onClick={toggle} aria-label="Toggle theme"
              className="ml-2 rounded-full border border-border p-2 hover:bg-muted">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </nav>
          {/* Mobile theme toggle */}
          <button onClick={toggle} aria-label="Toggle theme"
            className="rounded-full border border-border p-2 hover:bg-muted md:hidden">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-3 py-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <MobileTab to="/" label="Explore" icon={<Home className="h-5 w-5" />} exact />
          {showAdmin ? (
            <MobileTab to="/admin" label="Dashboard" icon={<Shield className="h-5 w-5" />} />
          ) : (
            <MobileTab to="/login" label="Sign in" icon={<LogIn className="h-5 w-5" />} />
          )}
        </div>
      </nav>
    </>
  );
}

function MobileTab({ to, label, icon, exact }: { to: string; label: string; icon: React.ReactNode; exact?: boolean }) {
  return (
    <Link
      to={to}
      activeOptions={exact ? { exact: true } : undefined}
      activeProps={{ className: "text-accent" }}
      className="flex flex-col items-center gap-0.5 rounded-lg px-4 py-1.5 text-[11px] text-muted-foreground transition-colors"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
