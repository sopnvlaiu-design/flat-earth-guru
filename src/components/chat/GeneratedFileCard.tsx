import { Download, FileCode, FileText, Globe, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeneratedFileCardProps {
  file: {
    name: string;
    content: string;
    type: "code" | "html" | "pdf" | "image";
    language?: string;
  };
}

export function GeneratedFileCard({ file }: GeneratedFileCardProps) {
  const handleDownload = () => {
    if (file.type === "image") {
      // For images, content is base64
      const link = document.createElement("a");
      link.href = file.content;
      link.download = file.name;
      link.click();
    } else {
      // For code/text files
      const blob = new Blob([file.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const getIcon = () => {
    switch (file.type) {
      case "html":
        return <Globe className="w-5 h-5 text-blue-500" />;
      case "image":
        return <ImageIcon className="w-5 h-5 text-purple-500" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      default:
        return <FileCode className="w-5 h-5 text-green-500" />;
    }
  };

  const getLanguageColor = () => {
    const lang = file.language?.toLowerCase() || file.name.split(".").pop();
    const colors: Record<string, string> = {
      py: "bg-yellow-500",
      python: "bg-yellow-500",
      js: "bg-yellow-400",
      javascript: "bg-yellow-400",
      ts: "bg-blue-500",
      typescript: "bg-blue-500",
      html: "bg-orange-500",
      css: "bg-blue-400",
      java: "bg-red-500",
      cpp: "bg-purple-500",
      c: "bg-gray-500",
    };
    return colors[lang || ""] || "bg-muted-foreground";
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group">
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">
            {file.name}
          </span>
          {file.language && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] text-white ${getLanguageColor()}`}>
              {file.language}
            </span>
          )}
        </div>
        {file.type !== "image" && (
          <p className="text-xs text-muted-foreground truncate">
            {file.content.slice(0, 50)}...
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDownload}
      >
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
}
