import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadImages, type UploadBucket } from "@/lib/upload";
import { toast } from "sonner";

type Props = {
  bucket: UploadBucket;
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  label?: string;
};

export function ImageUploader({ bucket, value, onChange, multiple = true, label = "Görsel Yükle" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const urls = await uploadImages(bucket, files);
      onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Yükleme hatası");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-ink text-sm hover:bg-brand-ink hover:text-white transition disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Yükleniyor..." : label}
        </button>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handle(e.target.files)}
        />
        <span className="text-xs text-muted-foreground">{value.length} görsel</span>
      </div>
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div key={url + i} className="relative group aspect-square rounded-lg overflow-hidden bg-brand-sand/30 border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
