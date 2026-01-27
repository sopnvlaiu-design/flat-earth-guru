import { Infinity } from "lucide-react";

export function Header() {
  return (
    <header className="hidden md:flex border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Infinity className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Infinito IA</span>
        </div>
      </div>
    </header>
  );
}
