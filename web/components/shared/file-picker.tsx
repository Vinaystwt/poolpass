"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A theme-safe file picker: a styled button that triggers a hidden native input. */
export function FilePicker({
  onFile,
  accept,
  label = "Choose file",
}: {
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="secondary" size="sm" onClick={() => ref.current?.click()}>
        <Upload className="h-4 w-4" /> {label}
      </Button>
    </>
  );
}
