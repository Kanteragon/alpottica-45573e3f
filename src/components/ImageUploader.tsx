import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { SortableUploadImage } from "@/components/SortableUploadImage";
import { Button } from "@/components/ui/button";
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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = value.map((url, index) => `${index}:${url}`);

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
    if (item === undefined) return;
    next.splice(to, 0, item);
    onChange(next);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || busy) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) move(from, to);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="rounded-full"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Yükleniyor..." : label}
        </Button>
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {value.map((url, i) => (
                <SortableUploadImage key={ids[i]} id={ids[i]} url={url} index={i} count={value.length} multiple={multiple} disabled={busy} onRemove={() => remove(i)} onMove={(direction) => move(i, i + direction)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
