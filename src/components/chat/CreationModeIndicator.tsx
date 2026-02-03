import { X, Code, Globe, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateMode } from "./CreateModePopup";

interface CreationModeIndicatorProps {
  mode: CreateMode;
  onClear: () => void;
}

const modeInfo = {
  programs: {
    icon: Code,
    label: "Modo Programador",
    color: "bg-green-500/10 text-green-600 border-green-500/30",
  },
  sites: {
    icon: Globe,
    label: "Modo Web Developer",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  pdf: {
    icon: FileText,
    label: "Modo Documentos",
    color: "bg-red-500/10 text-red-600 border-red-500/30",
  },
  images: {
    icon: ImageIcon,
    label: "Modo Artista",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  },
};

export function CreationModeIndicator({ mode, onClear }: CreationModeIndicatorProps) {
  if (!mode) return null;

  const info = modeInfo[mode];
  const Icon = info.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${info.color} text-sm font-medium`}>
      <Icon className="w-4 h-4" />
      <span>{info.label}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 hover:bg-transparent"
        onClick={onClear}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
