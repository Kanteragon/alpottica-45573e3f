/*
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";

type Shape = {
  id: string;
  label: string;
  hint: string;
  /** left lens path drawn in a 100x40 viewBox coordinate space */
  lens: (x: number) => React.ReactNode;
};

const LENS_W = 30;
const LENS_H = 20;

const SHAPES: Shape[] = [
  {
    id: "yuvarlak",
    label: "Yuvarlak",
    hint: "Köşeli yüz hatlarını yumuşatır",
    lens: (x) => <ellipse cx={x + LENS_W / 2} cy={20} rx={LENS_W / 2} ry={LENS_H / 2} />,
  },
  {
    id: "koseli",
    label: "Köşeli",
    hint: "Yuvarlak yüzlere karakter katar",
    lens: (x) => <rect x={x} y={10} width={LENS_W} height={LENS_H} rx={3} />,
  },
  {
    id: "dikdortgen",
    label: "Dikdörtgen",
    hint: "Klasik, her yüze uyumlu",
    lens: (x) => <rect x={x} y={12} width={LENS_W} height={LENS_H - 4} rx={2} />,
  },
  {
    id: "pilot",
    label: "Pilot",
    hint: "Damla form, ikonik duruş",
    lens: (x) => (
      <path
        d={`M${x} 12 h${LENS_W} v6 q0 12 -${LENS_W / 2} 12 q-${LENS_W / 2} 0 -${LENS_W / 2} -12 z`}
      />
    ),
  },
  {
    id: "kelebek",
    label: "Kelebek",
    hint: "Yukarı kalkık uçlarla zarif",
    lens: (x) => (
      <path
        d={`M${x} 16 q2 -8 ${LENS_W} -6 q1 14 -6 16 q-14 3 -${LENS_W - 6} -10 z`}
      />
    ),
  },
];

const FRAME_COLORS = [
  { label: "Siyah", value: "Siyah", hex: "#1c1c1c" },
  { label: "Mavi", value: "Mavi", hex: "#2b4f9e" },
  { label: "Kahverengi", value: "Kahverengi", hex: "#6b4426" },
  { label: "Gümüş", value: "Gümüş Rengi", hex: "#b9bcc2" },
  { label: "Şeffaf", value: "Şeffaf", hex: "#d9d4cc" },
];

const LENS_TYPES = [
  { label: "Mat", value: "Mat", opacity: 0.85 },
  { label: "Degrade", value: "Degrade", opacity: 0.55 },
  { label: "Aynalı", value: "Aynalı", opacity: 0.35 },
];

const SIZES = [
  { label: "Dar", value: "dar", values: ["48", "49", "50", "51", "52", "53"], scale: 0.9 },
  { label: "Orta", value: "orta", values: ["54", "55", "56", "57", "58"], scale: 1 },
  { label: "Geniş", value: "genis", values: ["59", "60", "61", "62", "63", "64"], scale: 1.12 },
];

const FACES = [
  { id: "kadin", label: "Kadın" },
  { id: "erkek", label: "Erkek" },
] as const;

export function TryOnGame() {
  const navigate = useNavigate();
  const [face, setFace] = useState<(typeof FACES)[number]["id"]>("kadin");
  const [shapeId, setShapeId] = useState(SHAPES[2].id);
  const [color, setColor] = useState(FRAME_COLORS[0]);
  const [lensType, setLensType] = useState(LENS_TYPES[0]);
  const [size, setSize] = useState(SIZES[1]);

  const shape = useMemo(() => SHAPES.find((s) => s.id === shapeId) ?? SHAPES[0], [shapeId]);

  const goToResults = () => {
    const ozellik = [
      `renk:${color.value}`,
      `cam_tipi:${lensType.value}`,
      `ekartman:${size.values.join("~")}`,
    ].join("|");
    navigate({ to: "/urunler", search: { ozellik } });
  };

  return (
    <section className="bg-brand-ink text-white py-12 sm:py-16">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] tracking-[0.4em] text-white/60 mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> SANAL DENEME
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl">Yüzünde Dene, Modelini Bul</h2>
          <p className="text-sm text-white/70 mt-2 max-w-xl">
            Çerçeve formunu, rengini ve ekartmanını seç; beğendiğin kombinasyona uygun modelleri anında listeleyelim.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
          {/* Face preview */}
          <div className="rounded-3xl bg-white/5 border border-white/10 p-4 sm:p-6">
            <div className="flex gap-2 mb-4">
              {FACES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFace(f.id)}
                  className={`px-4 py-2 rounded-full text-xs tracking-widest border transition ${
                    face === f.id ? "bg-white text-brand-ink border-white" : "border-white/25 text-white/80"
                  }`}
                >
                  {f.label.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="mx-auto max-w-[340px]">
              <svg viewBox="0 0 100 120" className="w-full h-auto" role="img" aria-label="Gözlük deneme önizlemesi">
                {/* hair */}
                {face === "kadin" ? (
                  <path d="M18 52 Q14 8 50 8 Q86 8 82 52 Q84 92 74 100 Q80 55 68 30 Q50 42 30 30 Q18 56 26 100 Q16 92 18 52 Z" fill="#3a2b23" />
                ) : (
                  <path d="M20 46 Q22 12 50 12 Q78 12 80 46 Q72 30 50 30 Q28 30 20 46 Z" fill="#2a201a" />
                )}
                {/* face */}
                <ellipse cx="50" cy="58" rx="28" ry="36" fill="#f0d3ba" />
                {/* ears */}
                <ellipse cx="21" cy="58" rx="4" ry="7" fill="#e8c6ab" />
                <ellipse cx="79" cy="58" rx="4" ry="7" fill="#e8c6ab" />
                {/* brows */}
                <path d="M31 46 q7 -4 14 0" stroke="#4a382c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <path d="M55 46 q7 -4 14 0" stroke="#4a382c" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                {/* eyes */}
                <ellipse cx="38" cy="55" rx="3.2" ry="2.2" fill="#3b3b3b" />
                <ellipse cx="62" cy="55" rx="3.2" ry="2.2" fill="#3b3b3b" />
                {/* nose + mouth */}
                <path d="M50 58 q-2 8 2 10" stroke="#d9b295" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                <path d="M43 78 q7 6 14 0" stroke="#c47a70" strokeWidth="2" fill="none" strokeLinecap="round" />

                {/* glasses */}
                <g transform={`translate(50 55) scale(${size.scale}) translate(-50 -55)`}>
                  <g transform="translate(0 35)">
                    <g fill={color.hex} fillOpacity={lensType.opacity} stroke={color.hex} strokeWidth="2.4">
                      {shape.lens(20)}
                      {shape.lens(50)}
                    </g>
                    {/* bridge */}
                    <path d="M46 16 q4 -4 8 0" fill="none" stroke={color.hex} strokeWidth="2.4" strokeLinecap="round" />
                    {/* temples */}
                    <line x1="20" y1="17" x2="10" y2="20" stroke={color.hex} strokeWidth="2.4" strokeLinecap="round" />
                    <line x1="80" y1="17" x2="90" y2="20" stroke={color.hex} strokeWidth="2.4" strokeLinecap="round" />
                  </g>
                </g>
              </svg>
            </div>

            <p className="text-center text-xs text-white/60 mt-3">{shape.hint}</p>
          </div>

          {/* Controls */}
          <div className="space-y-5">
            <Group label="Çerçeve Formu">
              <div className="flex flex-wrap gap-2">
                {SHAPES.map((s) => (
                  <Chip key={s.id} active={s.id === shapeId} onClick={() => setShapeId(s.id)}>
                    {s.label}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group label="Çerçeve Rengi">
              <div className="flex flex-wrap gap-2">
                {FRAME_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c)}
                    aria-label={c.label}
                    className={`w-10 h-10 rounded-full border-2 transition ${
                      color.value === c.value ? "border-white scale-110" : "border-white/25"
                    }`}
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            </Group>

            <Group label="Cam Tipi">
              <div className="flex flex-wrap gap-2">
                {LENS_TYPES.map((l) => (
                  <Chip key={l.value} active={l.value === lensType.value} onClick={() => setLensType(l)}>
                    {l.label}
                  </Chip>
                ))}
              </div>
            </Group>

            <Group label="Ekartman">
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <Chip key={s.value} active={s.value === size.value} onClick={() => setSize(s)}>
                    {s.label} ({s.values[0]}-{s.values[s.values.length - 1]})
                  </Chip>
                ))}
              </div>
            </Group>

            <button
              onClick={goToResults}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-white text-brand-ink text-sm tracking-widest font-medium hover:bg-white/90 transition"
            >
              BU KOMBİNASYONA UYAN MODELLER <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-white/50 text-center">
              Seçimlerin ürün filtrelerine dönüştürülür: {color.label} · {lensType.label} · {size.label} ekartman
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.25em] text-white/50 mb-2">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs tracking-widest border transition ${
        active ? "bg-white text-brand-ink border-white" : "border-white/25 text-white/80 hover:border-white/60"
      }`}
    >
      {children}
    </button>
  );
}
*/