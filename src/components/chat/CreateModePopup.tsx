import { X, Code, Globe, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CreateMode = "programs" | "sites" | "pdf" | "images" | null;

interface CreateModePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (mode: CreateMode) => void;
}

const modes = [
  {
    id: "programs" as const,
    icon: Code,
    title: "Programas",
    description: "Python, JavaScript, Java, C++, e muito mais",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "sites" as const,
    icon: Globe,
    title: "Sites",
    description: "HTML, CSS, JS - Sites completos e responsivos",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "pdf" as const,
    icon: FileText,
    title: "PDF",
    description: "Documentos, relatórios, e-books formatados",
    color: "from-red-500 to-orange-600",
  },
  {
    id: "images" as const,
    icon: ImageIcon,
    title: "Imagens",
    description: "Gere imagens únicas com IA avançada",
    color: "from-purple-500 to-pink-600",
  },
];

export function CreateModePopup({ open, onOpenChange, onSelect }: CreateModePopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">O que deseja criar?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                onSelect(mode.id);
                onOpenChange(false);
              }}
              className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <mode.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">{mode.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {mode.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
