import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  id: string;
  url: string;
  index: number;
  count: number;
  multiple: boolean;
  disabled: boolean;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
};

export function SortableUploadImage({ id, url, index, count, multiple, disabled, onRemove, onMove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: disabled || !multiple,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group relative aspect-square rounded-lg border bg-muted ${isDragging ? "z-10 opacity-60" : ""}`}
    >
      <div
        {...(multiple ? attributes : {})}
        {...(multiple ? listeners : {})}
        aria-label={multiple ? `${index + 1}. görseli sırala` : undefined}
        className={`h-full w-full overflow-hidden rounded-lg ${multiple ? "touch-none cursor-grab active:cursor-grabbing" : ""}`}
      >
        <img src={url} alt={`${index + 1}. ürün görseli`} draggable={false} className="pointer-events-none h-full w-full select-none object-cover" />
      </div>
      <span className="pointer-events-none absolute left-1 top-1 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">{index + 1}</span>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`${index + 1}. görseli sil`}
        title="Fotoğrafı sil"
        className="absolute right-1 top-1 h-7 w-7 rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <X />
      </Button>
      {multiple && (
        <div className="pointer-events-none absolute inset-x-1 bottom-1 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <Button type="button" size="icon" onClick={() => onMove(-1)} disabled={disabled || index === 0} aria-label={`${index + 1}. görseli sola taşı`} title="Sola taşı" className="pointer-events-auto h-7 w-7 rounded-full"><ChevronLeft /></Button>
          <GripVertical className="h-4 w-4 text-primary-foreground" />
          <Button type="button" size="icon" onClick={() => onMove(1)} disabled={disabled || index === count - 1} aria-label={`${index + 1}. görseli sağa taşı`} title="Sağa taşı" className="pointer-events-auto h-7 w-7 rounded-full"><ChevronRight /></Button>
        </div>
      )}
    </div>
  );
}