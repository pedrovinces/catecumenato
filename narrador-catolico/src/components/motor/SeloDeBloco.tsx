// Selo circular de cada cor: gira, para no canto superior esquerdo (dentro da área segura) e fica no bloco.
import React from "react";
import { Easing, interpolate } from "remotion";
import { CORES, DOURADO, TINTA, type NomeCor } from "../../lib/paleta";
import { TITULO } from "../../lib/fontes";
import { AREA } from "./area";

export const SeloDeBloco: React.FC<{ f: number; cor: NomeCor; nome: string; tempo: string; entrada?: number }> = ({ f, cor, nome, tempo, entrada = 6 }) => {
  const t = interpolate(f, [entrada, entrada + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });
  if (f < entrada) return null;
  const giro = (1 - t) * -540;
  const esc = interpolate(f, [entrada, entrada + 6], [0.2, 1], { extrapolateRight: "clamp" });
  const { x, y, d } = AREA.selo;
  const r = d / 2;
  const fundo = cor === "branco" ? DOURADO : CORES[cor];
  const anel = `selo-anel-${cor}`;
  const rt = r - 30; // raio do texto
  const circ = 2 * Math.PI * rt;
  const textoAnel = `${tempo} • `;
  const repeticoes = Math.max(1, Math.floor(circ / (textoAnel.length * 13)));
  const anelTexto = textoAnel.repeat(repeticoes);
  return (
    <svg
      width={d + 20}
      height={d + 20}
      viewBox={`${-r - 10} ${-r - 10} ${d + 20} ${d + 20}`}
      style={{ position: "absolute", left: x - 10, top: y - 10, transform: `rotate(${giro}deg) scale(${esc})`, overflow: "visible" }}
    >
      <defs>
        <path id={anel} d={`M 0 ${rt} A ${rt} ${rt} 0 1 1 0 ${-rt} A ${rt} ${rt} 0 1 1 0 ${rt}`} />
      </defs>
      <circle cx={6} cy={8} r={r} fill={TINTA} />
      <circle cx={0} cy={0} r={r} fill="#FFFFFF" stroke={TINTA} strokeWidth={7} />
      <circle cx={0} cy={0} r={r - 12} fill={fundo} stroke={TINTA} strokeWidth={5} />
      <circle cx={0} cy={0} r={r - 48} fill="none" stroke="#FFFFFF" strokeWidth={4} strokeDasharray="6 8" />
      <text fontFamily={TITULO} fontSize={21} fill="#FFFFFF" letterSpacing={1} stroke={TINTA} strokeWidth={5} paintOrder="stroke fill">
        <textPath href={`#${anel}`} textLength={circ - 6} lengthAdjust="spacingAndGlyphs">
          {anelTexto}
        </textPath>
      </text>
      <text
        x={0}
        y={13}
        textAnchor="middle"
        fontFamily={TITULO}
        fontSize={nome.length > 6 ? 30 : 38}
        fill="#FFFFFF"
        stroke={TINTA}
        strokeWidth={8}
        paintOrder="stroke fill"
        textLength={nome.length > 6 ? 104 : undefined}
        lengthAdjust="spacingAndGlyphs"
      >
        {nome}
      </text>
    </svg>
  );
};
