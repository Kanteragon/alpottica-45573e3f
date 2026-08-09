import { useCallback, useEffect, useRef, useState } from "react";
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  alt = "",
}: {
  images: string[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  alt?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

  const reset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => { reset(); }, [index, reset]);

  const zoomAt = useCallback((next: number, px: number, py: number) => {
    const { zoom: z, offset: o } = stateRef.current;
    const nz = clamp(next, MIN_ZOOM, MAX_ZOOM);
    const k = nz / z;
    if (nz === 1) { setZoom(1); setOffset({ x: 0, y: 0 }); return; }
    setZoom(nz);
    setOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
  }, []);

  // wheel / trackpad pinch (non-passive)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      zoomAt(
        stateRef.current.zoom * Math.exp(-dy * 0.0018),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) onIndexChange((index + 1) % images.length);
      if (e.key === "ArrowLeft" && images.length > 1) onIndexChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onIndexChange, index, images.length]);

  // lock body scroll
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // pointer drag + two-pointer pinch
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number; cx: number; cy: number } | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const rect = containerRef.current!.getBoundingClientRect();
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        zoom: stateRef.current.zoom,
        cx: (a.x + b.x) / 2 - rect.left,
        cy: (a.y + b.y) / 2 - rect.top,
      };
      drag.current = null;
    } else {
      drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, moved: false };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(pinch.current.zoom * (dist / pinch.current.dist), pinch.current.cx, pinch.current.cy);
      return;
    }
    if (drag.current && stateRef.current.zoom > 1) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.current.moved = true;
      setOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy });
    } else if (drag.current) {
      const dx = e.clientX - drag.current.x;
      if (Math.abs(dx) > 5) drag.current.moved = true;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = drag.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    // swipe to change image when not zoomed
    if (start && stateRef.current.zoom === 1 && images.length > 1) {
      const dx = e.clientX - start.x;
      if (Math.abs(dx) > 60) onIndexChange((index + (dx > 0 ? -1 : 1) + images.length) % images.length);
    }
    drag.current = null;
  };

  const src = images[index];

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col select-none">
      <div className="flex items-center justify-between px-4 py-3 text-white/90">
        <span className="text-xs tracking-widest">
          {images.length > 1 ? `${index + 1} / ${images.length}` : ""}
        </span>
        <div className="flex items-center gap-1">
          <button
            aria-label="Uzaklaştır"
            onClick={() => {
              const r = containerRef.current!.getBoundingClientRect();
              zoomAt(stateRef.current.zoom / 1.5, r.width / 2, r.height / 2);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            aria-label="Yakınlaştır"
            onClick={() => {
              const r = containerRef.current!.getBoundingClientRect();
              zoomAt(stateRef.current.zoom * 1.5, r.width / 2, r.height / 2);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button aria-label="Kapat" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden touch-none"
        style={{ cursor: zoom > 1 ? "grab" : "zoom-in" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          const rect = containerRef.current!.getBoundingClientRect();
          zoomAt(zoom > 1 ? 1 : 2.5, e.clientX - rect.left, e.clientY - rect.top);
        }}
      >
        {src && (
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain p-4"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              transition: pinch.current || drag.current ? "none" : "transform 120ms ease-out",
            }}
          />
        )}

        {images.length > 1 && (
          <>
            <button
              aria-label="Önceki"
              onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              aria-label="Sonraki"
              onClick={() => onIndexChange((index + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      <p className="text-center text-[11px] text-white/50 pb-3">
        Yakınlaştırmak için çift dokunun veya parmaklarınızı ayırın
      </p>
    </div>
  );
}
