import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Cherry } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: "/create", label: "Create" },
  { to: "/my-gifts", label: "My Gifts" },
];

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen gradient-peach-subtle">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Cherry className="h-5 w-5 text-primary" />
            <span className="text-gradient-peach">Lucky ADA</span>
          </Link>
          <nav className="flex items-center gap-1 ml-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                activeClassName="bg-secondary text-foreground"
              >
                {item.label}
              </NavLink>
            ))}
            <ThemeSwitcher />
          </nav>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
