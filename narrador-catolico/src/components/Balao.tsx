// Balão de fala ou de pensamento, com rabicho apontando para quem fala.
import React from "react";
import { TINTA } from "../lib/paleta";
import { LEGENDA } from "../lib/fontes";

export const Balao: React.FC<{
  x: number; // centro
  y: number;
  largura: number;
  altura: number;
  texto?: string;
  ponta: [number, number]; // para onde o rabicho aponta (coordenadas absolutas)
  pensamento?: boolean;
  escala?: number;
  tamanhoFonte?: number;
  children?: React.ReactNode;
}> = ({ x, y, largura, altura, texto, ponta, pensamento, escala = 1, tamanhoFonte = 40, children }) => {
  const [px, py] = ponta;
  const bx = x + (px > x ? largura * 0.12 : -largura * 0.12);
  const by = y + altura / 2 - 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${escala}) translate(${-x} ${-y})`}>
      {pensamento ? (
        [0.25, 0.55, 0.8].map((k, i) => (
          <circle key={i} cx={bx + (px - bx) * k} cy={by + (py - by) * k} r={20 - i * 5} fill="#FFFFFF" stroke={TINTA} strokeWidth={6} />
        ))
      ) : (
        <path d={`M ${bx - 26} ${by - 6} L ${px} ${py} L ${bx + 26} ${by - 6} Z`} fill="#FFFFFF" stroke={TINTA} strokeWidth={7} strokeLinejoin="round" />
      )}
      {pensamento ? (
        <path
          d={`M ${x - largura / 2} ${y} ${Array.from({ length: 10 }, (_, i) => {
            const a = Math.PI + ((i + 1) / 10) * 2 * Math.PI;
            return `Q ${x + Math.cos(a - 0.3) * largura * 0.62} ${y + Math.sin(a - 0.3) * altura * 0.66} ${x + Math.cos(a) * largura * 0.5} ${y + Math.sin(a) * altura * 0.5}`;
          }).join(" ")} Z`}
          fill="#FFFFFF"
          stroke={TINTA}
          strokeWidth={7}
          strokeLinejoin="round"
        />
      ) : (
        <>
          <rect x={x - largura / 2} y={y - altura / 2} width={largura} height={altura} rx={Math.min(46, altura / 2)} fill="#FFFFFF" stroke={TINTA} strokeWidth={7} />
          <path d={`M ${bx - 22} ${by - 10} L ${bx + 22} ${by - 10}`} stroke="#FFFFFF" strokeWidth={14} />
        </>
      )}
      {texto && (
        <text x={x} y={y + tamanhoFonte * 0.36} textAnchor="middle" fontFamily={LEGENDA} fontWeight={900} fontSize={tamanhoFonte} fill={TINTA}>
          {texto}
        </text>
      )}
      {children}
    </g>
  );
};
