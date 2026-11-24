// Logotipo do Narrador Católico: três propostas no traço da série. A escolhida vai em LOGO_PADRAO.
import React from "react";
import { CORES, DOURADO, TINTA } from "../lib/paleta";
import { LEGENDA, TITULO } from "../lib/fontes";

export type VarianteLogo = "aspas" | "microfone" | "balao";
export const LOGO_PADRAO: VarianteLogo = "balao";

const LITURGICAS = [CORES.verde, CORES.roxo, "#FFFFFF", CORES.vermelho, CORES.rosa];

/** Opção A: duas pontas de estola que formam as aspas de abertura (a voz que narra + o sinal do sacerdote). */
export const SimboloAspas: React.FC = () => {
  const aspa = (dx: number, cor: string) => (
    <g transform={`translate(${dx} 0)`}>
      <path
        d="M 40 -150 C -40 -130 -96 -60 -96 30 C -96 92 -54 130 0 130 C 54 130 92 92 92 40 C 92 -8 58 -42 10 -42 C 6 -42 2 -42 -2 -41 C 6 -86 28 -114 62 -126 Z"
        fill={cor}
        stroke={TINTA}
        strokeWidth={12}
        strokeLinejoin="round"
      />
      <path d="M 0 22 L 0 98 M -26 48 L 26 48" stroke={DOURADO} strokeWidth={13} strokeLinecap="round" />
      {[-60, -42, -24].map((x, i) => (
        <line key={i} x1={x + 60} y1={-150 + i * 7} x2={x + 74} y2={-176 + i * 7} stroke={TINTA} strokeWidth={8} strokeLinecap="round" />
      ))}
    </g>
  );
  return (
    <g>
      {aspa(-110, CORES.roxo)}
      {aspa(110, CORES.verde)}
    </g>
  );
};

/** Opção B: microfone de rádio antigo com silhueta de sino e cruz no alto. */
export const SimboloMicrofone: React.FC = () => (
  <g>
    <path d="M -150 170 L 150 170" stroke={TINTA} strokeWidth={16} strokeLinecap="round" />
    <path d="M 0 120 L 0 170" stroke={TINTA} strokeWidth={22} />
    <path d="M -90 120 L 90 120" stroke={TINTA} strokeWidth={14} strokeLinecap="round" />
    {/* corpo em forma de sino */}
    <path
      d="M 0 -170 C -70 -170 -96 -110 -100 -40 C -102 10 -112 60 -150 96 L 150 96 C 112 60 102 10 100 -40 C 96 -110 70 -170 0 -170 Z"
      fill={DOURADO}
      stroke={TINTA}
      strokeWidth={12}
      strokeLinejoin="round"
    />
    {[-110, -76, -42, -8, 26, 60].map((y, i) => (
      <line key={i} x1={-88 + i * -3} x2={88 + i * 3} y1={y} y2={y} stroke="#8C6E12" strokeWidth={9} strokeLinecap="round" />
    ))}
    <path d="M -54 -150 Q -78 -100 -80 -40" fill="none" stroke="#F3DC8B" strokeWidth={12} strokeLinecap="round" />
    <ellipse cx={0} cy={110} rx={30} ry={16} fill={TINTA} />
    {/* cruz */}
    <path d="M 0 -270 L 0 -176 M -32 -236 L 32 -236" stroke={TINTA} strokeWidth={30} strokeLinecap="round" />
    <path d="M 0 -270 L 0 -176 M -32 -236 L 32 -236" stroke={DOURADO} strokeWidth={14} strokeLinecap="round" />
    {/* ondas sonoras */}
    {[1, -1].map((l) => (
      <g key={l} fill="none" stroke={TINTA} strokeWidth={12} strokeLinecap="round">
        <path d={`M ${l * 146} -96 Q ${l * 178} -40 ${l * 146} 16`} />
        <path d={`M ${l * 186} -130 Q ${l * 232} -40 ${l * 186} 50`} />
      </g>
    ))}
  </g>
);

/** Opção C: balão de fala com cruz vazada, cercado pelas cinco cores litúrgicas. */
export const SimboloBalao: React.FC = () => {
  const r = 230;
  const arco = (i: number) => {
    const a0 = (-90 + i * 72 + 4) * (Math.PI / 180);
    const a1 = (-90 + (i + 1) * 72 - 4) * (Math.PI / 180);
    return `M ${r * Math.cos(a0)} ${r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)}`;
  };
  return (
    <g>
      {LITURGICAS.map((c, i) => (
        <g key={i}>
          <path d={arco(i)} fill="none" stroke={TINTA} strokeWidth={46} strokeLinecap="round" />
          <path d={arco(i)} fill="none" stroke={c} strokeWidth={30} strokeLinecap="round" />
        </g>
      ))}
      <path
        d="M -150 -120 Q -150 -170 -100 -170 L 100 -170 Q 150 -170 150 -120 L 150 60 Q 150 110 100 110 L -20 110 L -96 168 L -80 110 L -100 110 Q -150 110 -150 60 Z"
        fill="#FFFFFF"
        stroke={TINTA}
        strokeWidth={14}
        strokeLinejoin="round"
      />
      <path d="M 0 -128 L 0 72 M -66 -60 L 66 -60" stroke={TINTA} strokeWidth={46} strokeLinecap="round" />
      <path d="M 0 -128 L 0 72 M -66 -60 L 66 -60" stroke={DOURADO} strokeWidth={24} strokeLinecap="round" />
    </g>
  );
};

const SIMBOLOS: Record<VarianteLogo, React.FC> = { aspas: SimboloAspas, microfone: SimboloMicrofone, balao: SimboloBalao };

/** Símbolo + nome. `claro` = texto escuro para fundo claro. */
export const LogoNarrador: React.FC<{ largura?: number; variante?: VarianteLogo; claro?: boolean }> = ({ largura = 600, variante = LOGO_PADRAO, claro = false }) => {
  const Simbolo = SIMBOLOS[variante];
  const corTexto = claro ? TINTA : "#FFFFFF";
  return (
    <svg width={largura} height={largura * 1.02} viewBox="-300 -300 600 612" style={{ overflow: "visible" }}>
      <g transform="translate(0 -70) scale(0.72)">
        <Simbolo />
      </g>
      <text
        x={0}
        y={222}
        textAnchor="middle"
        fontFamily={TITULO}
        fontSize={118}
        letterSpacing={4}
        fill={corTexto}
        stroke={claro ? "none" : TINTA}
        strokeWidth={claro ? 0 : 16}
        paintOrder="stroke fill"
      >
        NARRADOR
      </text>
      <g>
        <line x1={-250} x2={-150} y1={268} y2={268} stroke={claro ? TINTA : "#FFFFFF"} strokeWidth={6} />
        <line x1={150} x2={250} y1={268} y2={268} stroke={claro ? TINTA : "#FFFFFF"} strokeWidth={6} />
        <text
          x={0}
          y={284}
          textAnchor="middle"
          fontFamily={LEGENDA}
          fontWeight={900}
          fontSize={44}
          letterSpacing={9}
          fill={claro ? TINTA : "#FFFFFF"}
          stroke={claro ? "none" : TINTA}
          strokeWidth={claro ? 0 : 10}
          paintOrder="stroke fill"
        >
          CATÓLICO
        </text>
      </g>
    </svg>
  );
};

/** Avatar redondo para a foto do perfil (só o símbolo). */
export const AvatarNarrador: React.FC<{ tamanho?: number; variante?: VarianteLogo }> = ({ tamanho = 320, variante = LOGO_PADRAO }) => {
  const Simbolo = SIMBOLOS[variante];
  return (
    <svg width={tamanho} height={tamanho} viewBox="-300 -300 600 600">
      <circle cx={0} cy={0} r={292} fill={CORES.sepia} stroke={TINTA} strokeWidth={12} />
      <g transform={variante === "balao" ? "scale(1.05)" : "scale(0.86) translate(0 20)"}>
        <Simbolo />
      </g>
    </svg>
  );
};
