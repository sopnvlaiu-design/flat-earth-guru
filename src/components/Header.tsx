import { Infinity, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-border">
              <Infinity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse-glow" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg glow-text">
              Infinito <span className="text-accent">IA</span>
            </h1>
            <p className="text-xs text-muted-foreground -mt-0.5">Expandindo horizontes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-muted-foreground">Modelo Gemini</span>
          </div>
        </div>
      </div>
    </header>
  );
}
