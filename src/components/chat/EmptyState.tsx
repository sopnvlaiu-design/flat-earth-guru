import { Infinity } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
        <Infinity className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2 text-center">
        Olá! Como posso ajudar?
      </h1>
      <p className="text-muted-foreground text-center max-w-md text-[15px]">
        Sou o Infinito IA, seu assistente inteligente. Pergunte qualquer coisa!
      </p>
    </div>
  );
}
