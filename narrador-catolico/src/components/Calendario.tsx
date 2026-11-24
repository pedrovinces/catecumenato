// Calendário de parede com mês, grade de dias e datas circuladas à mão (o círculo se desenha).
import React from "react";
import { interpolate } from "remotion";
import { CORES, TINTA } from "../lib/paleta";
import { LEGENDA, TITULO } from "../lib/fontes";

const MESES = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

export const Calendario: React.FC<{
  x: number;
  y: number;
  largura?: number;
  ano: number;
  mes: number; // 1..12
  circulados?: { dia: number; f: number; cor?: string }[]; // f = quadros desde que começou a circular
  corTopo?: string;
  coresDias?: (dia: number) => string | undefined; // pinta o fundo de cada dia (ex.: semanas verdes)
}> = ({ x, y, largura = 640, ano, mes, circulados = [], corTopo = CORES.vermelho, coresDias }) => {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay(); // 0 = domingo
  const dias = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const cel = (largura - 40) / 7;
  const topo = 150;
  const linhas = Math.ceil((primeiro + dias) / 7);
  const altura = topo + 60 + linhas * cel + 24;
  const pos = (d: number) => {
    const i = primeiro + d - 1;
    return { cx: 20 + (i % 7) * cel + cel / 2, cy: topo + 60 + Math.floor(i / 7) * cel + cel / 2 };
  };
  return (
    <svg x={x} y={y} width={largura + 20} height={altura + 20} viewBox={`-10 -10 ${largura + 20} ${altura + 20}`} overflow="visible">
      <rect x={8} y={10} width={largura} height={altura} rx={22} fill={TINTA} />
      <rect x={0} y={0} width={largura} height={altura} rx={22} fill="#FFFDF7" stroke={TINTA} strokeWidth={7} />
      <path d={`M 0 22 Q 0 0 22 0 L ${largura - 22} 0 Q ${largura} 0 ${largura} 22 L ${largura} ${topo} L 0 ${topo} Z`} fill={corTopo} stroke={TINTA} strokeWidth={7} />
      {[0.25, 0.75].map((p) => (
        <rect key={p} x={largura * p - 10} y={-26} width={20} height={52} rx={8} fill="#B0BEC5" stroke={TINTA} strokeWidth={5} />
      ))}
      <text x={largura / 2} y={88} textAnchor="middle" fontFamily={TITULO} fontSize={64} fill="#FFFFFF" stroke={TINTA} strokeWidth={8} paintOrder="stroke fill">
        {MESES[mes - 1]}
      </text>
      <text x={largura / 2} y={132} textAnchor="middle" fontFamily={LEGENDA} fontWeight={900} fontSize={30} fill="#FFFFFF">
        {ano}
      </text>
      {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
        <text key={i} x={20 + i * cel + cel / 2} y={topo + 42} textAnchor="middle" fontFamily={LEGENDA} fontWeight={900} fontSize={26} fill={i === 0 ? CORES.vermelho : TINTA}>
          {d}
        </text>
      ))}
      {Array.from({ length: dias }, (_, k) => {
        const d = k + 1;
        const { cx, cy } = pos(d);
        const fundo = coresDias?.(d);
        return (
          <g key={d}>
            {fundo && <rect x={cx - cel / 2 + 3} y={cy - cel / 2 + 3} width={cel - 6} height={cel - 6} rx={8} fill={fundo} />}
            <text x={cx} y={cy + 11} textAnchor="middle" fontFamily={LEGENDA} fontWeight={800} fontSize={30} fill={(primeiro + d - 1) % 7 === 0 ? CORES.vermelho : TINTA}>
              {d}
            </text>
          </g>
        );
      })}
      {circulados.map(({ dia, f, cor = "#C62828" }) => {
        const { cx, cy } = pos(dia);
        const t = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (t <= 0) return null;
        const r = cel * 0.62;
        const comp = 2 * Math.PI * r * 1.15;
        return (
          <path
            key={dia}
            d={`M ${cx + r} ${cy - 4} C ${cx + r} ${cy - r * 1.1} ${cx - r * 1.2} ${cy - r} ${cx - r} ${cy + 2} C ${cx - r * 0.9} ${cy + r * 1.1} ${cx + r * 1.1} ${cy + r} ${cx + r * 1.05} ${cy - 10} L ${cx + r * 0.8} ${cy - r * 0.9}`}
            fill="none"
            stroke={cor}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={comp}
            strokeDashoffset={comp * (1 - t)}
          />
        );
      })}
    </svg>
  );
};
