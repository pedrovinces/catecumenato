// Fiéis genéricos no mesmo traço do Padre. Também serve para o influencer e figurantes.
import React from "react";
import { TINTA, CONTORNO, escurecer } from "../lib/paleta";
import { BracoTubo, type Braco } from "./bracos";
import { BocaDesenho, ParOlhos, ParSobrancelhas, type Expressao } from "./rosto";

export type TipoFiel = "idoso" | "senhora" | "homem" | "moca" | "jovem" | "crianca" | "influencer";
export type BracosFiel = "baixo" | "cruzados" | "cochicho" | "relogio" | "palma" | "selfie" | "celebra" | "palmas";

type Visual = { pele: string; cabelo: string; roupa: string; calca: string; saia?: boolean; escala?: number };

export const VISUAIS: Record<TipoFiel, Visual> = {
  idoso: { pele: "#E3B48E", cabelo: "#F2F2F2", roupa: "#8D6E63", calca: "#616161" },
  senhora: { pele: "#F1C7A1", cabelo: "#D6D6D6", roupa: "#26A69A", calca: "#455A64", saia: true },
  homem: { pele: "#B97D55", cabelo: "#2B2B2B", roupa: "#42A5F5", calca: "#3949AB" },
  moca: { pele: "#7E4E33", cabelo: "#1F1A17", roupa: "#FFB300", calca: "#5D4037", saia: true },
  jovem: { pele: "#F3D0B0", cabelo: "#6D4C41", roupa: "#90A4AE", calca: "#37474F" },
  crianca: { pele: "#E8B48A", cabelo: "#8D6E63", roupa: "#66BB6A", calca: "#1E88E5", escala: 0.68 },
  influencer: { pele: "#EEC09A", cabelo: "#F4D35E", roupa: "#FF7043", calca: "#263238" },
};

const OMBRO = 92;
const BAIXO_E: Braco = { cot: [-122, -392], mao: [-128, -292], gesto: "aberta" };
const BAIXO_D: Braco = { cot: [122, -392], mao: [128, -292], gesto: "aberta" };

const BRACOS: Record<BracosFiel, { e: Braco; d: Braco; frente?: boolean }> = {
  baixo: { e: BAIXO_E, d: BAIXO_D },
  cruzados: { e: { cot: [-126, -400], mao: [70, -436], gesto: "escondida" }, d: { cot: [126, -400], mao: [-70, -416], gesto: "escondida" } },
  cochicho: { e: BAIXO_E, d: { cot: [126, -440], mao: [70, -588], gesto: "aberta" }, frente: true },
  relogio: { e: { cot: [-130, -410], mao: [-6, -470], gesto: "punho" }, d: BAIXO_D },
  palma: { e: BAIXO_E, d: { cot: [130, -450], mao: [146, -590], gesto: "segura" } },
  selfie: { e: BAIXO_E, d: { cot: [172, -540], mao: [214, -690], gesto: "segura" } },
  celebra: { e: { cot: [-170, -560], mao: [-190, -700], gesto: "aberta" }, d: { cot: [170, -560], mao: [190, -700], gesto: "aberta" } },
  palmas: { e: { cot: [-140, -420], mao: [-20, -470], gesto: "aberta" }, d: { cot: [140, -420], mao: [20, -470], gesto: "aberta" } },
};

export type FielProps = {
  x: number;
  y: number;
  escala?: number;
  tipo?: TipoFiel;
  roupa?: string;
  cabelo?: string;
  bracos?: BracosFiel;
  expressao?: Partial<Expressao>;
  espelhado?: boolean;
  inclina?: number;
  vestesBrancas?: boolean; // multidão do Apocalipse
  silhueta?: string; // desenha tudo numa cor só (contraluz)
  children?: React.ReactNode;
};

export const Fiel: React.FC<FielProps> = ({
  x,
  y,
  escala = 1,
  tipo = "homem",
  roupa,
  cabelo,
  bracos = "baixo",
  expressao,
  espelhado,
  inclina = 0,
  vestesBrancas,
  silhueta,
  children,
}) => {
  const v = VISUAIS[tipo];
  const s = escala * (v.escala ?? 1);
  const cor = silhueta ?? (vestesBrancas ? "#FFFDF5" : roupa ?? v.roupa);
  const pele = silhueta ?? v.pele;
  const cab = silhueta ?? cabelo ?? v.cabelo;
  const calca = silhueta ?? (vestesBrancas ? "#FFFDF5" : v.calca);
  const traco = silhueta ? silhueta : TINTA;
  const b = BRACOS[bracos];
  const expr: Expressao = { olhos: "normal", sobrancelhas: "neutra", boca: "sorrisinho", ...expressao };
  const cx = 0;
  const cy = -640;
  const longo = vestesBrancas;

  const braco = (lado: -1 | 1) => (
    <BracoTubo ombro={[lado * OMBRO, -500]} braco={lado < 0 ? b.e : b.d} manga={cor} punho={cor} pele={pele} grossura={50} lado={lado} />
  );

  return (
    <g transform={`translate(${x},${y}) scale(${s * (espelhado ? -1 : 1)},${s})`}>
      {!silhueta && <ellipse cx={0} cy={-6} rx={140} ry={20} fill="#000000" opacity={0.15} />}
      {/* pernas e sapatos */}
      {!longo &&
        [-1, 1].map((l) => (
          <g key={l}>
            <rect x={l * 40 - 30} y={-330} width={60} height={300} rx={14} fill={v.saia ? pele : calca} stroke={traco} strokeWidth={CONTORNO} />
            <ellipse cx={l * 46} cy={-24} rx={44} ry={22} fill={silhueta ?? "#3E2723"} stroke={traco} strokeWidth={CONTORNO} />
          </g>
        ))}
      {longo && (
        <path d="M -100 -500 L -130 -30 Q 0 -10 130 -30 L 100 -500 Z" fill={cor} stroke={traco} strokeWidth={CONTORNO} strokeLinejoin="round" />
      )}
      {/* tronco */}
      <path
        d="M -92 -512 Q -118 -500 -112 -440 L -104 -300 Q 0 -280 104 -300 L 112 -440 Q 118 -500 92 -512 Q 0 -530 -92 -512 Z"
        fill={cor}
        stroke={traco}
        strokeWidth={CONTORNO}
        strokeLinejoin="round"
      />
      {!silhueta && <path d="M 40 -514 Q 100 -506 110 -440 L 104 -302 Q 70 -294 50 -292 Z" fill={escurecer(cor, 0.15)} />}
      {v.saia && !longo && (
        <path d="M -108 -310 L -140 -150 Q 0 -128 140 -150 L 108 -310 Z" fill={silhueta ?? escurecer(cor, 0.25)} stroke={traco} strokeWidth={CONTORNO} strokeLinejoin="round" />
      )}
      {!b.frente && braco(-1)}
      {!b.frente && bracos !== "cruzados" && braco(1)}
      {bracos === "cruzados" && (
        <>
          {braco(1)}
          {braco(-1)}
        </>
      )}
      {b.frente && braco(-1)}
      {bracos === "relogio" && !silhueta && <rect x={-40} y={-490} width={30} height={40} rx={6} fill="#ECEFF1" stroke={TINTA} strokeWidth={5} />}
      {bracos === "palma" && (
        <g transform={`translate(${b.d.mao[0]},${b.d.mao[1]})`}>
          <path d="M 0 0 L 6 -200" stroke={silhueta ?? "#558B2F"} strokeWidth={10} strokeLinecap="round" />
          {Array.from({ length: 7 }, (_, i) => (
            <g key={i}>
              <path d={`M ${3 + i * 0.4} ${-40 - i * 24} q -50 -6 -78 26`} fill="none" stroke={silhueta ?? "#7CB342"} strokeWidth={12} strokeLinecap="round" />
              <path d={`M ${3 + i * 0.4} ${-40 - i * 24} q 50 -6 78 26`} fill="none" stroke={silhueta ?? "#7CB342"} strokeWidth={12} strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}
      {bracos === "selfie" && (
        <g transform={`translate(${b.d.mao[0]},${b.d.mao[1] - 40}) rotate(-12)`}>
          <rect x={-34} y={-60} width={68} height={120} rx={12} fill="#263238" stroke={TINTA} strokeWidth={CONTORNO} />
          <circle cx={0} cy={-42} r={6} fill="#90A4AE" />
        </g>
      )}
      {/* cabeça */}
      <g transform={`rotate(${inclina} 0 -520)`}>
        {tipo === "moca" && <path d="M -130 -700 Q -150 -520 -100 -470 L 100 -470 Q 150 -520 130 -700 Z" fill={cab} stroke={traco} strokeWidth={CONTORNO} />}
        {[-1, 1].map((l) => (
          <ellipse key={l} cx={cx + l * 118} cy={cy + 8} rx={20} ry={30} fill={pele} stroke={traco} strokeWidth={CONTORNO} />
        ))}
        <ellipse cx={cx} cy={cy} rx={120} ry={118} fill={pele} stroke={traco} strokeWidth={CONTORNO} />
        {!silhueta && (
          <>
            <Cabelo tipo={tipo} cor={cab} />
            <ParOlhos cx={cx} cy={cy - 6} dx={44} k={0.82} tipo={expr.olhos} olhar={expr.olhar} pele={pele} />
            <ParSobrancelhas cx={cx} cy={cy - 52} dx={44} k={0.8} tipo={expr.sobrancelhas} cor={tipo === "idoso" || tipo === "senhora" ? "#BDBDBD" : escurecer(cab, 0.2)} espessura={15} />
            <ellipse cx={cx} cy={cy + 26} rx={18} ry={14} fill={escurecer(pele, 0.12)} stroke={TINTA} strokeWidth={5} />
            <BocaDesenho cx={cx} cy={cy + 64} k={0.8} tipo={expr.boca} />
            {tipo === "idoso" && (
              <g>
                <path d={`M ${cx - 46} ${cy + 46} Q ${cx} ${cy + 30} ${cx + 46} ${cy + 46} Q ${cx} ${cy + 58} ${cx - 46} ${cy + 46} Z`} fill="#F5F5F5" stroke={TINTA} strokeWidth={4} />
                {[-1, 1].map((l) => (
                  <circle key={l} cx={cx + l * 44} cy={cy - 6} r={34} fill="none" stroke={TINTA} strokeWidth={6} />
                ))}
                <line x1={cx - 10} x2={cx + 10} y1={cy - 8} y2={cy - 8} stroke={TINTA} strokeWidth={6} />
              </g>
            )}
            {tipo === "crianca" &&
              [-1, 1].map((l) => [0, 1, 2].map((i) => <circle key={`${l}${i}`} cx={cx + l * (64 + i * 9)} cy={cy + 24 + (i % 2) * 8} r={4} fill="#C1784A" />))}
          </>
        )}
        {silhueta && tipo !== "moca" && <Cabelo tipo={tipo} cor={cab} />}
      </g>
      {b.frente && braco(1)}
      {children}
    </g>
  );
};

const Cabelo: React.FC<{ tipo: TipoFiel; cor: string }> = ({ tipo, cor }) => {
  const cy = -640;
  switch (tipo) {
    case "idoso":
      return (
        <g fill={cor} stroke={TINTA} strokeWidth={5}>
          {[-1, 1].map((l) => (
            <path key={l} d={`M ${l * 92} ${cy - 70} Q ${l * 134} ${cy - 40} ${l * 120} ${cy + 4} Q ${l * 108} ${cy - 20} ${l * 96} ${cy - 22} Z`} />
          ))}
        </g>
      );
    case "senhora":
      return (
        <g fill={cor} stroke={TINTA} strokeWidth={CONTORNO}>
          <circle cx={0} cy={cy - 140} r={46} />
          <path d={`M -120 ${cy - 10} Q -126 ${cy - 128} 0 ${cy - 124} Q 126 ${cy - 128} 120 ${cy - 10} Q 90 ${cy - 80} 0 ${cy - 84} Q -90 ${cy - 80} -120 ${cy - 10} Z`} />
        </g>
      );
    case "homem":
    case "crianca":
      return <path d={`M -120 ${cy - 20} Q -120 ${cy - 130} 0 ${cy - 126} Q 120 ${cy - 130} 120 ${cy - 20} Q 100 ${cy - 70} 40 ${cy - 78} Q -60 ${cy - 90} -120 ${cy - 20} Z`} fill={cor} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />;
    case "moca":
      return <path d={`M -126 ${cy} Q -130 ${cy - 140} 0 ${cy - 130} Q 130 ${cy - 140} 126 ${cy} Q 110 ${cy - 90} 0 ${cy - 92} Q -110 ${cy - 90} -126 ${cy} Z`} fill={cor} stroke={TINTA} strokeWidth={CONTORNO} />;
    case "jovem":
      return (
        <g fill={cor} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round">
          <path d={`M -122 ${cy - 10} L -110 ${cy - 110} L -70 ${cy - 90} L -40 ${cy - 140} L 0 ${cy - 100} L 40 ${cy - 146} L 70 ${cy - 96} L 112 ${cy - 118} L 122 ${cy - 10} Q 80 ${cy - 70} 0 ${cy - 74} Q -80 ${cy - 70} -122 ${cy - 10} Z`} />
        </g>
      );
    case "influencer":
      return (
        <g>
          <path d={`M -118 ${cy - 30} Q -120 ${cy - 120} -20 ${cy - 170} Q 90 ${cy - 200} 130 ${cy - 120} Q 100 ${cy - 130} 60 ${cy - 100} Q 120 ${cy - 80} 118 ${cy - 30} Q 60 ${cy - 80} -118 ${cy - 30} Z`} fill={cor} stroke={TINTA} strokeWidth={CONTORNO} strokeLinejoin="round" />
          {/* óculos escuros na cabeça */}
          <g transform={`translate(0 ${cy - 108}) rotate(-4)`}>
            {[-1, 1].map((l) => (
              <rect key={l} x={l * 44 - 34} y={-22} width={68} height={44} rx={18} fill="#212121" stroke={TINTA} strokeWidth={5} />
            ))}
            <line x1={-12} x2={12} y1={-6} y2={-6} stroke={TINTA} strokeWidth={6} />
          </g>
        </g>
      );
    default:
      return null;
  }
};
