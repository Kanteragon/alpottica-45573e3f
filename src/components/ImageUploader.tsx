import { useRef, useState } from "react";
import { Upload, X, Loader2, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
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
  const [dragIdx, setDragIdx] = useState<number | null>(null);

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

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = value.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

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
        <span className="text-xs text-muted-foreground">{value.length} görsel · sürükleyip bırakarak sıralayın</span>
      </div>
      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {value.map((url, i) => (
            <div
              key={url + i}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null) move(dragIdx, i);
                setDragIdx(null);
              }}
              onDragEnd={() => setDragIdx(null)}
              className={`relative group aspect-square rounded-lg overflow-hidden bg-brand-sand/30 border cursor-move ${dragIdx === i ? "opacity-40" : ""}`}
            >
              <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
              <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                {i + 1}
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  title="Sil"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {multiple && (
                <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30"
                    title="Sola"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <GripVertical className="w-3.5 h-3.5 text-white/80" />
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === value.length - 1}
                    className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30"
                    title="Sağa"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
