// Braços em tubo (ombro → cotovelo → mão) com punho de alva e mãos em gestos simples.
import React from "react";
import { ALVA, TINTA, CONTORNO } from "../lib/paleta";

export type Gesto = "aberta" | "punho" | "joinha" | "segura" | "escondida";
export type Ponto = [number, number];
export type Braco = { cot: Ponto; mao: Ponto; gesto: Gesto };

export const misturarBraco = (a: Braco, b: Braco, t: number): Braco => ({
  cot: [a.cot[0] + (b.cot[0] - a.cot[0]) * t, a.cot[1] + (b.cot[1] - a.cot[1]) * t],
  mao: [a.mao[0] + (b.mao[0] - a.mao[0]) * t, a.mao[1] + (b.mao[1] - a.mao[1]) * t],
  gesto: t < 0.5 ? a.gesto : b.gesto,
});

export const Mao: React.FC<{ p: Ponto; ang: number; gesto: Gesto; pele: string; k?: number; lado: number }> = ({ p, ang, gesto, pele, k = 1, lado }) => {
  if (gesto === "escondida") return null;
  const sw = CONTORNO;
  const r = 36 * k;
  const graus = (ang * 180) / Math.PI;
  return (
    <g transform={`translate(${p[0]},${p[1]})`}>
      {gesto === "aberta" && (
        <g transform={`rotate(${graus - 90})`}>
          {[-21, -7, 7, 21].map((dx, i) => (
            <ellipse key={i} cx={dx * k} cy={(38 - Math.abs(dx) * 0.45) * k} rx={10.5 * k} ry={21 * k} fill={pele} stroke={TINTA} strokeWidth={sw - 1} />
          ))}
          <ellipse cx={-lado * 32 * k} cy={4 * k} rx={11 * k} ry={20 * k} transform={`rotate(${lado * 40} ${-lado * 32 * k} ${4 * k})`} fill={pele} stroke={TINTA} strokeWidth={sw - 1} />
          <ellipse cx={0} cy={2 * k} rx={r} ry={r * 0.9} fill={pele} stroke={TINTA} strokeWidth={sw} />
          <ellipse cx={0} cy={6 * k} rx={r - 6} ry={r * 0.9 - 6} fill={pele} />
        </g>
      )}
      {gesto === "segura" && <circle cx={0} cy={0} r={r} fill={pele} stroke={TINTA} strokeWidth={sw} />}
      {gesto === "punho" && (
        <g transform={`rotate(${graus - 90})`}>
          <circle cx={0} cy={0} r={r} fill={pele} stroke={TINTA} strokeWidth={sw} />
          <path d={`M ${-14 * k} ${10 * k} Q ${-4 * k} ${18 * k} ${6 * k} ${10 * k} M ${-2 * k} ${14 * k} Q ${8 * k} ${22 * k} ${16 * k} ${12 * k}`} fill="none" stroke={TINTA} strokeWidth={4 * k} strokeLinecap="round" />
        </g>
      )}
      {gesto === "joinha" && (
        <g>
          <rect x={-r} y={-r * 0.85} width={r * 2} height={r * 1.7} rx={r * 0.6} fill={pele} stroke={TINTA} strokeWidth={sw} />
          <rect x={-r * 0.38 - lado * 6} y={-r * 2} width={r * 0.76} height={r * 1.45} rx={r * 0.38} fill={pele} stroke={TINTA} strokeWidth={sw} />
          <rect x={-r + 4} y={-r * 0.85 + 4} width={r * 2 - 8} height={r * 0.5} fill={pele} />
          {[0, 1, 2].map((i) => (
            <line key={i} x1={-r * 0.7} x2={r * 0.5} y1={(-6 + i * 14) * k} y2={(-6 + i * 14) * k} stroke={TINTA} strokeWidth={3.5 * k} strokeLinecap="round" />
          ))}
        </g>
      )}
    </g>
  );
};

/** Desenha um braço. `manga` é a cor da parte de cima; o punho é sempre da alva (ou da roupa). */
export const BracoTubo: React.FC<{ ombro: Ponto; braco: Braco; manga: string; punho?: string; pele: string; k?: number; grossura?: number; lado: number }> = ({
  ombro,
  braco,
  manga,
  punho = ALVA,
  pele,
  k = 1,
  grossura = 62,
  lado,
}) => {
  const [sx, sy] = ombro;
  const [ex, ey] = braco.cot;
  const [hx, hy] = braco.mao;
  const g = grossura * k;
  const ang = Math.atan2(hy - ey, hx - ex);
  // o punho ocupa o último terço do antebraço
  const px = ex + (hx - ex) * 0.62;
  const py = ey + (hy - ey) * 0.62;
  const d = `M ${sx} ${sy} L ${ex} ${ey} L ${hx} ${hy}`;
  return (
    <g>
      <path d={d} fill="none" stroke={TINTA} strokeWidth={g + CONTORNO * 2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={manga} strokeWidth={g} strokeLinejoin="round" strokeLinecap="round" />
      {punho !== manga && (
        <>
          <path d={`M ${px} ${py} L ${hx} ${hy}`} fill="none" stroke={TINTA} strokeWidth={g + CONTORNO * 2 - 4} strokeLinecap="butt" />
          <path d={`M ${px} ${py} L ${hx} ${hy}`} fill="none" stroke={punho} strokeWidth={g - 4} strokeLinecap="butt" />
        </>
      )}
      <Mao p={[hx, hy]} ang={ang} gesto={braco.gesto} pele={pele} k={k} lado={lado} />
    </g>
  );
};
