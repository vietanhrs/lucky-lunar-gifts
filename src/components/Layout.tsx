import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Cherry } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen gradient-peach-subtle">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Cherry className="h-5 w-5 text-primary" />
            <span className="text-gradient-peach">Lucky ADA</span>
          </Link>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
