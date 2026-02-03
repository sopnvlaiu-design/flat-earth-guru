import { X, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: {
    name: string;
    type: string;
    dataUrl: string;
  };
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  return (
    <div className="relative inline-block">
      {isImage ? (
        <img
          src={file.dataUrl}
          alt={file.name}
          className="h-20 rounded-lg border border-border object-cover"
        />
      ) : (
        <div className="h-20 w-20 rounded-lg border border-border bg-muted flex flex-col items-center justify-center gap-1 p-2">
          {isPdf ? (
            <FileText className="w-6 h-6 text-red-500" />
          ) : (
            <File className="w-6 h-6 text-muted-foreground" />
          )}
          <span className="text-[10px] text-muted-foreground text-center truncate w-full">
            {file.name.length > 12 ? file.name.slice(0, 10) + "..." : file.name}
          </span>
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
        onClick={onRemove}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
