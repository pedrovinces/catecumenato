// Motor low-poly: transforma um polígono em mosaico de triângulos sombreados por luz direcional.
// Tudo é determinístico (sementes), então cada render sai igual.
import React from "react";
import Delaunator from "delaunator";

export type P = [number, number];

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const aleatorio = (semente: string) => {
  let h = hash(semente) || 1;
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
};

export const dentro = ([x, y]: P, poli: P[]) => {
  let d = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i];
    const [xj, yj] = poli[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
};

const triangular = (poli: P[], passo: number, semente: string): [P, P, P][] => {
  const r = aleatorio(semente);
  const pts: P[] = [];
  for (let i = 0; i < poli.length; i++) {
    const a = poli[i];
    const b = poli[(i + 1) % poli.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(L / passo));
    for (let k = 0; k < n; k++) pts.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  const xs = poli.map((p) => p[0]);
  const ys = poli.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  for (let x = x0 + passo / 2; x < x1; x += passo) {
    for (let y = y0 + passo / 2; y < y1; y += passo * 0.87) {
      const p: P = [x + (r() - 0.5) * passo * 0.85, y + (r() - 0.5) * passo * 0.85];
      if (dentro(p, poli)) pts.push(p);
    }
  }
  const d = Delaunator.from(pts);
  const tris: [P, P, P][] = [];
  for (let i = 0; i < d.triangles.length; i += 3) {
    const a = pts[d.triangles[i]];
    const b = pts[d.triangles[i + 1]];
    const c = pts[d.triangles[i + 2]];
    const cen: P = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
    if (dentro(cen, poli)) tris.push([a, b, c]);
  }
  return tris;
};

// ---- cor ----
const hexRgb = (h: string) => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbHsl = ([r, g, b]: number[]) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
};
const hslHex = (h: number, s: number, l: number) => {
  l = Math.min(1, Math.max(0, l));
  s = Math.min(1, Math.max(0, s));
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return "#" + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("");
};

export const tom = (cor: string, dl: number, ds = 0, dh = 0) => {
  const [h, s, l] = rgbHsl(hexRgb(cor));
  return hslHex((h + dh + 1) % 1, s + ds, l + dl);
};

export type OpcoesFaceta = {
  passo?: number; // tamanho médio das facetas (px)
  luz?: P; // direção de onde vem a luz (padrão: alto à esquerda)
  forca?: number; // contraste da luz (0..0,4)
  variacao?: number; // ruído de tom por faceta
  semente?: string;
};

const cache = new Map<string, { d: string; fill: string }[]>();

export const facetas = (poli: P[], cor: string, o: OpcoesFaceta = {}) => {
  const { passo = 40, luz = [-0.55, -0.85], forca = 0.16, variacao = 0.05, semente = "x" } = o;
  const chave = `${semente}|${cor}|${passo}|${luz}|${forca}|${variacao}|${poli.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(";")}`;
  const pronto = cache.get(chave);
  if (pronto) return pronto;
  const tris = triangular(poli, passo, semente);
  const r = aleatorio(semente + "c");
  const xs = poli.map((p) => p[0]);
  const ys = poli.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);
  const res = tris.map(([a, b, c]) => {
    const cx = ((a[0] + b[0] + c[0]) / 3 - x0) / w - 0.5;
    const cy = ((a[1] + b[1] + c[1]) / 3 - y0) / h - 0.5;
    const ilum = -(cx * luz[0] + cy * luz[1]);
    const fill = tom(cor, ilum * forca + (r() - 0.5) * variacao, 0, (r() - 0.5) * 0.008);
    return { d: `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}L${c[0].toFixed(1)},${c[1].toFixed(1)}Z`, fill };
  });
  cache.set(chave, res);
  return res;
};

/** Subdivide arestas longas para a curva não "inchar" a forma. */
const subdividir = (poli: P[], max = 60): P[] => {
  const out: P[] = [];
  for (let i = 0; i < poli.length; i++) {
    const a = poli[i];
    const b = poli[(i + 1) % poli.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / max));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
};

/** Curva fechada suave (Catmull-Rom → Bézier) passando pelos pontos. */
export const curvaFechada = (poli: P[], subdiv = 60) => {
  const p = subdividir(poli, subdiv);
  const n = p.length;
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n];
    const p1 = p[i];
    const p2 = p[(i + 1) % n];
    const p3 = p[(i + 2) % n];
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + "Z";
};

const caminhoReto = (poli: P[]) => "M" + poli.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("L") + "Z";

let contador = 0;

/**
 * Volume pintado: forma lisa com degradê de luz (claro do lado da luz, escuro do outro)
 * e, nas formas curvas, um brilho suave. Mantém o nome Faceta para não mudar os desenhos.
 */
export const Faceta: React.FC<{ pontos: P[]; cor: string; opacidade?: number; curva?: boolean } & OpcoesFaceta> = ({ pontos, cor, opacidade, curva = false, luz = [-0.55, -0.85], forca = 0.16 }) => {
  const id = React.useMemo(() => `v${(contador++).toString(36)}`, []);
  const xs = pontos.map((q) => q[0]);
  const ys = pontos.map((q) => q[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const norma = Math.hypot(luz[0], luz[1]) || 1;
  const [lx, ly] = [luz[0] / norma, luz[1] / norma];
  const meia = Math.hypot(x1 - x0, y1 - y0) / 2;
  const d = curva ? curvaFechada(pontos) : caminhoReto(pontos);
  const f = Math.min(0.3, forca * 1.15);
  return (
    <g opacity={opacidade}>
      <defs>
        <linearGradient id={`${id}l`} gradientUnits="userSpaceOnUse" x1={cx + lx * meia} y1={cy + ly * meia} x2={cx - lx * meia} y2={cy - ly * meia}>
          <stop offset="0" stopColor={tom(cor, f)} />
          <stop offset="0.5" stopColor={cor} />
          <stop offset="1" stopColor={tom(cor, -f * 1.2)} />
        </linearGradient>
        {curva && (
          <radialGradient id={`${id}r`} gradientUnits="userSpaceOnUse" cx={cx + lx * meia * 0.45} cy={cy + ly * meia * 0.45} r={meia * 0.9}>
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </radialGradient>
        )}
      </defs>
      <path d={d} fill={`url(#${id}l)`} />
      {curva && <path d={d} fill={`url(#${id}r)`} />}
    </g>
  );
};

/** Dobras de tecido: traços escuros e desfocados. */
export const Dobras: React.FC<{ id: string; caminhos: string[]; cor?: string; opacidade?: number; largura?: number }> = ({ id, caminhos, cor = "#000", opacidade = 0.18, largura = 10 }) => (
  <g opacity={opacidade}>
    <defs>
      <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={largura * 0.55} />
      </filter>
    </defs>
    <g filter={`url(#${id})`} fill="none" stroke={cor} strokeWidth={largura} strokeLinecap="round">
      {caminhos.map((c, i) => (
        <path key={i} d={c} />
      ))}
    </g>
  </g>
);

/** Granulação de pintura sobre a tela toda. */
export const Textura: React.FC<{ opacidade?: number }> = ({ opacidade = 0.09 }) => (
  <g style={{ mixBlendMode: "soft-light" }} opacity={opacidade}>
    <defs>
      <filter id="textura-pintura">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={3} seed={7} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </defs>
    <rect x={0} y={0} width={1080} height={1920} filter="url(#textura-pintura)" />
  </g>
);

/** Elipse como polígono (para rostos, vasos, auréolas de luz). */
export const elipse = (cx: number, cy: number, rx: number, ry: number, n = 18, giro = 0): P[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + giro;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });

export const ret = (x: number, y: number, w: number, h: number): P[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
