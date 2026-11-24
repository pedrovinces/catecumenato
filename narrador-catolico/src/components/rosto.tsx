// Partes do rosto compartilhadas por Padre e Fiel: olhos, sobrancelhas e boca com expressões exageradas.
import React from "react";
import { TINTA } from "../lib/paleta";

export type Olhos = "normal" | "arregalado" | "sonolento" | "semicerrado" | "fechado" | "feliz";
export type Sobrancelhas = "neutra" | "alta" | "franzida" | "triste" | "uma";
export type Boca = "sorriso" | "sorrisao" | "sorrisinho" | "O" | "reta" | "bocejo" | "confiante" | "aberta" | "preocupada";

export type Expressao = {
  olhos: Olhos;
  sobrancelhas: Sobrancelhas;
  boca: Boca;
  olhar?: [number, number]; // deslocamento das pupilas
};

type Base = { cx: number; cy: number; dx: number; k?: number; pele: string };

/** Dois olhos centrados em (cx±dx, cy). k escala tudo. */
export const ParOlhos: React.FC<Base & { tipo: Olhos; olhar?: [number, number] }> = ({ cx, cy, dx, k = 1, tipo, olhar = [0, 0], pele }) => {
  const lados = [-1, 1];
  const sw = 5 * k;
  return (
    <g>
      {lados.map((l) => {
        const x = cx + l * dx;
        if (tipo === "fechado")
          return <path key={l} d={`M ${x - 22 * k} ${cy} Q ${x} ${cy + 16 * k} ${x + 22 * k} ${cy}`} fill="none" stroke={TINTA} strokeWidth={sw + 2} strokeLinecap="round" />;
        if (tipo === "feliz")
          return <path key={l} d={`M ${x - 22 * k} ${cy + 6 * k} Q ${x} ${cy - 20 * k} ${x + 22 * k} ${cy + 6 * k}`} fill="none" stroke={TINTA} strokeWidth={sw + 2} strokeLinecap="round" />;
        const rx = (tipo === "arregalado" ? 33 : 25) * k;
        const ry = (tipo === "arregalado" ? 40 : 30) * k;
        const rp = (tipo === "arregalado" ? 9 : 12) * k;
        const tampa = tipo === "sonolento" ? 0.58 : tipo === "semicerrado" ? 0.42 : 0;
        const clip = `olho-${Math.round(x)}-${Math.round(cy)}`;
        return (
          <g key={l}>
            <defs>
              <clipPath id={clip}>
                <ellipse cx={x} cy={cy} rx={rx} ry={ry} />
              </clipPath>
            </defs>
            <ellipse cx={x} cy={cy} rx={rx} ry={ry} fill="#FFFFFF" />
            <g clipPath={`url(#${clip})`}>
              <circle cx={x + olhar[0] * k} cy={cy + olhar[1] * k + (tampa ? ry * 0.25 : 0)} r={rp} fill={TINTA} />
              <circle cx={x + olhar[0] * k - rp * 0.35} cy={cy + olhar[1] * k - rp * 0.35 + (tampa ? ry * 0.25 : 0)} r={rp * 0.3} fill="#FFFFFF" />
              {tampa > 0 && <rect x={x - rx - 2} y={cy - ry - 2} width={rx * 2 + 4} height={ry * 2 * tampa + 2} fill={pele} />}
              {tampa > 0 && <line x1={x - rx} x2={x + rx} y1={cy - ry + ry * 2 * tampa} y2={cy - ry + ry * 2 * tampa} stroke={TINTA} strokeWidth={sw} />}
            </g>
            <ellipse cx={x} cy={cy} rx={rx} ry={ry} fill="none" stroke={TINTA} strokeWidth={sw} />
          </g>
        );
      })}
    </g>
  );
};

/** Sobrancelhas grossas: o motor da expressão. */
export const ParSobrancelhas: React.FC<Omit<Base, "pele"> & { tipo: Sobrancelhas; cor: string; espessura?: number }> = ({ cx, cy, dx, k = 1, tipo, cor, espessura = 17 }) => {
  // [y interno, y externo, arco] relativo a cy, por lado (-1 esquerda, +1 direita)
  const forma = (l: number): [number, number, number] => {
    switch (tipo) {
      case "alta":
        return [-24, -20, -14];
      case "franzida":
        return [10, -8, -2];
      case "triste":
        return [-16, 8, -6];
      case "uma":
        return l > 0 ? [-26, -34, -14] : [2, 2, -6];
      default:
        return [-2, 4, -8];
    }
  };
  return (
    <g>
      {[-1, 1].map((l) => {
        const [yi, ye, arco] = forma(l).map((v) => v * k);
        const xi = cx + l * (dx - 34 * k);
        const xe = cx + l * (dx + 36 * k);
        const xm = (xi + xe) / 2;
        return (
          <g key={l}>
            <path d={`M ${xi} ${cy + yi} Q ${xm} ${cy + Math.min(yi, ye) + arco} ${xe} ${cy + ye}`} fill="none" stroke={TINTA} strokeWidth={(espessura + 8) * k} strokeLinecap="round" />
            <path d={`M ${xi} ${cy + yi} Q ${xm} ${cy + Math.min(yi, ye) + arco} ${xe} ${cy + ye}`} fill="none" stroke={cor} strokeWidth={espessura * k} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

export const BocaDesenho: React.FC<{ cx: number; cy: number; k?: number; tipo: Boca }> = ({ cx, cy, k = 1, tipo }) => {
  const sw = 5.5 * k;
  const escuro = "#6B2323";
  const s = (v: number) => v * k;
  switch (tipo) {
    case "sorriso":
      return <path d={`M ${cx - s(48)} ${cy - s(6)} Q ${cx} ${cy + s(46)} ${cx + s(48)} ${cy - s(6)} Q ${cx} ${cy + s(14)} ${cx - s(48)} ${cy - s(6)} Z`} fill={escuro} stroke={TINTA} strokeWidth={sw} strokeLinejoin="round" />;
    case "sorrisao":
    case "aberta": {
      const h = tipo === "aberta" ? 70 : 56;
      return (
        <g>
          <path d={`M ${cx - s(60)} ${cy - s(10)} Q ${cx} ${cy + s(h)} ${cx + s(60)} ${cy - s(10)} Z`} fill={escuro} stroke={TINTA} strokeWidth={sw} strokeLinejoin="round" />
          <path d={`M ${cx - s(48)} ${cy - s(6)} L ${cx + s(48)} ${cy - s(6)} L ${cx + s(40)} ${cy + s(6)} L ${cx - s(40)} ${cy + s(6)} Z`} fill="#FFFFFF" />
          <ellipse cx={cx} cy={cy + s(h * 0.42)} rx={s(24)} ry={s(10)} fill="#E57373" />
          <path d={`M ${cx - s(60)} ${cy - s(10)} Q ${cx} ${cy + s(h)} ${cx + s(60)} ${cy - s(10)} Z`} fill="none" stroke={TINTA} strokeWidth={sw} strokeLinejoin="round" />
        </g>
      );
    }
    case "sorrisinho":
      return <path d={`M ${cx - s(36)} ${cy - s(4)} Q ${cx} ${cy + s(22)} ${cx + s(36)} ${cy - s(4)}`} fill="none" stroke={TINTA} strokeWidth={sw + 1} strokeLinecap="round" />;
    case "confiante":
      return <path d={`M ${cx - s(38)} ${cy + s(2)} Q ${cx + s(6)} ${cy + s(16)} ${cx + s(44)} ${cy - s(16)}`} fill="none" stroke={TINTA} strokeWidth={sw + 1} strokeLinecap="round" />;
    case "O":
      return <ellipse cx={cx} cy={cy + s(8)} rx={s(20)} ry={s(27)} fill={escuro} stroke={TINTA} strokeWidth={sw} />;
    case "bocejo":
      return <ellipse cx={cx} cy={cy + s(14)} rx={s(34)} ry={s(46)} fill={escuro} stroke={TINTA} strokeWidth={sw} />;
    case "preocupada":
      return <path d={`M ${cx - s(34)} ${cy + s(10)} Q ${cx - s(12)} ${cy - s(4)} ${cx} ${cy + s(6)} Q ${cx + s(14)} ${cy + s(16)} ${cx + s(34)} ${cy}`} fill="none" stroke={TINTA} strokeWidth={sw + 1} strokeLinecap="round" />;
    default:
      return <path d={`M ${cx - s(28)} ${cy + s(2)} L ${cx + s(28)} ${cy + s(2)}`} fill="none" stroke={TINTA} strokeWidth={sw + 1} strokeLinecap="round" />;
  }
};
