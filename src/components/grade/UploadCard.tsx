"use client";

/* ============================================================
   UploadCard — drag-and-drop image uploader for the answer sheet.
   Converts to base64 (small) and invokes onImageReady.
   ============================================================ */

import { useCallback, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function UploadCard({
  onImageReady,
  isProcessing,
}: {
  onImageReady: (data: { base64: string; mimeType: string; fileName: string }) => void;
  isProcessing?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // data URL: data:<mime>;base64,<base64>
        const [meta, b64] = dataUrl.split(",");
        const mimeMatch = /data:(.*?);base64/.exec(meta);
        const mimeType = mimeMatch?.[1] ?? "image/jpeg";
        setPreview(dataUrl);
        onImageReady({ base64: b64, mimeType, fileName: file.name });
      };
      reader.readAsDataURL(file);
    },
    [onImageReady]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Card className="card-soft p-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {!preview ? (
        <button
          type="button"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-lg border-2 border-dashed transition-all",
            dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-muted/40"
          )}
        >
          <span className="brand-gradient-bg w-12 h-12 rounded-xl flex items-center justify-center shadow-soft-sm">
            <Upload className="text-white" size={22} />
          </span>
          <span className="text-base font-medium">Drop answer sheet here</span>
          <span className="text-sm text-muted-foreground">
            or click to browse · PNG, JPG, WEBP · max ~5&nbsp;MB
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-lg overflow-hidden bg-muted/50 border border-border">
            <img src={preview} alt="Answer sheet preview" className="w-full h-64 object-contain bg-white" />
            <button
              onClick={() => {
                setPreview(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background shadow-soft-sm"
              aria-label="Remove image"
              disabled={isProcessing}
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon size={14} /> Image ready
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={isProcessing}
            >
              Replace
            </Button>
          </div>
        </div>
      )}
      {isProcessing && (
        <div className="absolute inset-0 rounded-lg bg-background/40 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      )}
    </Card>
  );
}
