// Pergaminho que se desenrola (largura cresce a partir do centro) com uma referência bíblica.
import React from "react";
import { Easing, interpolate } from "remotion";
import { TINTA } from "../lib/paleta";
import { TITULO } from "../lib/fontes";

export const Pergaminho: React.FC<{ x: number; y: number; f: number; texto: string; largura?: number; altura?: number }> = ({ x, y, f, texto, largura = 620, altura = 260 }) => {
  if (f < 0) return null;
  const t = interpolate(f, [0, 12], [0.08, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const w = largura * t;
  return (
    <svg x={x - largura / 2 - 40} y={y - altura / 2 - 30} width={largura + 80} height={altura + 60} overflow="visible">
      <g transform={`translate(${largura / 2 + 40} ${altura / 2 + 30})`}>
        <rect x={-w / 2} y={-altura / 2} width={w} height={altura} fill="#F3E2B3" stroke={TINTA} strokeWidth={7} />
        <rect x={-w / 2} y={-altura / 2} width={w} height={22} fill="#E2C98A" />
        {t > 0.7 && (
          <text x={0} y={30} textAnchor="middle" fontFamily={TITULO} fontSize={110} fill="#5B3A1A" opacity={interpolate(t, [0.7, 1], [0, 1])}>
            {texto}
          </text>
        )}
        {[-1, 1].map((l) => (
          <g key={l} transform={`translate(${(l * w) / 2} 0)`}>
            <rect x={-26} y={-altura / 2 - 22} width={52} height={altura + 44} rx={26} fill="#D9B46A" stroke={TINTA} strokeWidth={7} />
            <ellipse cx={0} cy={-altura / 2 - 22} rx={26} ry={10} fill="#B48A3E" stroke={TINTA} strokeWidth={5} />
          </g>
        ))}
      </g>
    </svg>
  );
};
