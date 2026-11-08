import { useSeriesImage, type ShowcaseCategory } from "@/lib/homepage";
import { focalPosition, imagePosition } from "@/lib/image-framing";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function ShowcaseImagePosition({ card, onChange }: { card: ShowcaseCategory; onChange: (patch: Partial<ShowcaseCategory>) => void }) {
  const { data } = useSeriesImage(card);
  const x = focalPosition(card.image_position_x);
  const y = focalPosition(card.image_position_y);
  if (!data?.image) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 items-center">
      <div className="aspect-[4/3] overflow-hidden bg-muted rounded-md">
        <img src={data.image} alt={card.title || "Vitrin önizlemesi"} className="h-full w-full object-cover" style={{ objectPosition: imagePosition(x, y) }} />
      </div>
      <div className="space-y-5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Fotoğraf Konumu</span>
          <Button type="button" variant="ghost" size="icon" aria-label="Fotoğrafı ortala" title="Fotoğrafı ortala" onClick={() => onChange({ image_position_x: 50, image_position_y: 50 })}><RotateCcw className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground"><span>Sol — Sağ</span><span>{x}%</span></div>
          <Slider aria-label={`${card.title} yatay fotoğraf konumu`} min={0} max={100} step={1} value={[x]} onValueChange={([value]) => onChange({ image_position_x: value ?? 50 })} />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground"><span>Üst — Alt</span><span>{y}%</span></div>
          <Slider aria-label={`${card.title} dikey fotoğraf konumu`} min={0} max={100} step={1} value={[y]} onValueChange={([value]) => onChange({ image_position_y: value ?? 50 })} />
        </div>
      </div>
    </div>
  );
}