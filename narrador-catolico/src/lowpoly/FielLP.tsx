// Fiéis em low-poly, mesmas proporções do Padre. Pés em (0,0), topo da cabeça ≈ -950.
import React from "react";
import { Faceta, elipse, tom, type P } from "./geo";

export type TipoFielLP = "homem" | "mulher" | "senhora" | "jovem";
type Visual = { pele: string; cabelo: string; camisa: string; calca: string; saia?: boolean };
const VIS: Record<TipoFielLP, Visual> = {
  homem: { pele: "#A8714C", cabelo: "#2A211C", camisa: "#4F7DA8", calca: "#3B3F4A" },
  mulher: { pele: "#E0B08A", cabelo: "#5A3B26", camisa: "#C9794F", calca: "#4A3B35", saia: true },
  senhora: { pele: "#E8C2A0", cabelo: "#D9D6D0", camisa: "#5E8C7A", calca: "#4B4F55", saia: true },
  jovem: { pele: "#C68B62", cabelo: "#1E1915", camisa: "#8B6FA8", calca: "#2F3542" },
};

export type BracosFielLP = "baixo" | "celebra" | "cochicho" | "maoNoPeito";
const BR: Record<BracosFielLP, { e: [number, number]; d: [number, number] }> = {
  baixo: { e: [6, -6], d: [6, -6] },
  celebra: { e: [150, 25], d: [150, 25] },
  cochicho: { e: [6, -6], d: [20, -140] },
  maoNoPeito: { e: [6, -6], d: [14, -112] },
};

const ROSTO = (cy: number): P[] => elipse(0, cy, 52, 64, 16).map(([x, y]) => [x * (y > cy ? 0.9 : 1), y]);

const Braco: React.FC<{ lado: -1 | 1; a: [number, number]; camisa: string; pele: string; s: string }> = ({ lado, a, camisa, pele, s }) => (
  <g transform={`translate(${lado * 108} -730) rotate(${-lado * a[0]})`}>
    <Faceta curva pontos={[[-24, -4], [24, -4], [21, 170], [-20, 170]]} cor={camisa} passo={24} semente={`${s}a`} forca={0.24} />
    <g transform={`translate(0 166) rotate(${-lado * a[1]})`}>
      <Faceta curva pontos={[[-18, 0], [18, 0], [15, 150], [-15, 150]]} cor={camisa} passo={20} semente={`${s}b`} forca={0.2} />
      <Faceta curva pontos={[[-15, 146], [15, 146], [19, 170], [10, 192], [-6, 196], [-17, 178]]} cor={pele} passo={12} semente={`${s}m`} />
    </g>
  </g>
);

export const FielLP: React.FC<{
  x: number;
  y: number;
  escala?: number;
  tipo?: TipoFielLP;
  camisa?: string;
  bracos?: BracosFielLP;
  boca?: "sorriso" | "aberta" | "O" | "reta";
  olhos?: "abertos" | "felizes" | "arregalados";
  sobrancelha?: "neutra" | "alta";
  espelhado?: boolean;
  semente?: string;
  noPeito?: React.ReactNode; // ex.: medalha
}> = ({ x, y, escala = 1, tipo = "homem", camisa, bracos = "baixo", boca = "sorriso", olhos = "abertos", sobrancelha = "neutra", espelhado, semente = "fiel", noPeito }) => {
  const v = VIS[tipo];
  const cam = camisa ?? v.camisa;
  const s = `${semente}${tipo}`;
  const cy = -870;
  const escuro = "#2B211C";
  const sob = sobrancelha === "alta" ? -9 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${escala * (espelhado ? -1 : 1)} ${escala})`}>
      <ellipse cx={0} cy={-4} rx={150} ry={18} fill="#000" opacity={0.2} />
      {v.saia ? (
        <Faceta curva pontos={[[-100, -420], [100, -420], [130, -120], [-130, -120]]} cor={tom(cam, -0.12)} passo={34} semente={`${s}sa`} forca={0.22} />
      ) : null}
      {[-1, 1].map((l) => (
        <g key={l}>
          <Faceta curva pontos={[[l * 12, -440], [l * 92, -440], [l * 82, -24], [l * 26, -24]]} cor={v.saia ? v.pele : v.calca} passo={30} semente={`${s}p${l}`} forca={0.2} />
          <Faceta curva pontos={[[l * 20, -26], [l * 92, -26], [l * 100, 0], [l * 16, 0]]} cor="#2C2420" passo={14} semente={`${s}sp${l}`} />
        </g>
      ))}
      {v.saia && <Faceta curva pontos={[[-100, -420], [100, -420], [128, -130], [-128, -130]]} cor={tom(cam, -0.12)} passo={34} semente={`${s}sa2`} forca={0.22} />}
      <Faceta curva pontos={[[-58, -790], [58, -790], [112, -760], [122, -640], [112, -430], [0, -412], [-112, -430], [-122, -640], [-112, -760]]} cor={cam} passo={36} semente={`${s}tr`} forca={0.26} />
      <Faceta curva pontos={[[-20, -820], [20, -820], [24, -786], [-24, -786]]} cor={tom(v.pele, -0.06)} passo={12} semente={`${s}pc`} />
      {noPeito}
      <Braco lado={-1} a={BR[bracos].e} camisa={cam} pele={v.pele} s={`${s}be`} />
      <Braco lado={1} a={BR[bracos].d} camisa={cam} pele={v.pele} s={`${s}bd`} />
      {/* cabeça */}
      {tipo === "mulher" && <Faceta curva pontos={[[-62, -900], [-66, -800], [-40, -760], [40, -760], [66, -800], [62, -900]]} cor={v.cabelo} passo={18} semente={`${s}cl`} />}
      <Faceta curva pontos={ROSTO(cy)} cor={v.pele} passo={18} semente={`${s}ro`} forca={0.24} />
      {tipo === "senhora" ? (
        <>
          <Faceta curva pontos={elipse(0, cy - 76, 28, 22, 10)} cor={v.cabelo} passo={10} semente={`${s}co`} />
          <Faceta curva pontos={[[-54, cy - 10], [-50, cy - 48], [-26, cy - 66], [26, cy - 66], [50, cy - 48], [54, cy - 10], [36, cy - 40], [-36, cy - 40]]} cor={v.cabelo} passo={14} semente={`${s}ca`} />
        </>
      ) : (
        <Faceta curva pontos={[[-54, cy - 4], [-52, cy - 46], [-30, cy - 66], [0, cy - 70], [30, cy - 66], [52, cy - 46], [54, cy - 4], [40, cy - 38], [-40, cy - 38]]} cor={v.cabelo} passo={14} semente={`${s}ca`} />
      )}
      {[-1, 1].map((l) => (
        <path key={`s${l}`} d={`M ${l * 10} ${cy - 22 + sob} L ${l * 34} ${cy - 26 + sob} L ${l * 32} ${cy - 20 + sob} Z`} fill={tom(v.cabelo, 0.05)} stroke={tom(v.cabelo, 0.05)} strokeWidth={3} />
      ))}
      {[-1, 1].map((l) =>
        olhos === "felizes" ? (
          <path key={`o${l}`} d={`M ${l * 12} ${cy - 6} Q ${l * 21} ${cy - 15} ${l * 30} ${cy - 6}`} fill="none" stroke={escuro} strokeWidth={3.5} strokeLinecap="round" />
        ) : olhos === "arregalados" ? (
          <g key={`o${l}`}>
            <ellipse cx={l * 21} cy={cy - 8} rx={8} ry={8} fill="#F4EFE6" />
            <circle cx={l * 21} cy={cy - 8} r={3.5} fill={escuro} />
          </g>
        ) : (
          <g key={`o${l}`}>
            <path d={`M ${l * 11} ${cy - 8} Q ${l * 21} ${cy - 15} ${l * 31} ${cy - 8} Q ${l * 21} ${cy - 3} ${l * 11} ${cy - 8} Z`} fill="#F2EEE8" />
            <circle cx={l * 21} cy={cy - 8.5} r={4} fill="#3E2A1F" />
            <circle cx={l * 21} cy={cy - 8.5} r={1.8} fill="#140E0B" />
            <path d={`M ${l * 10} ${cy - 8} Q ${l * 21} ${cy - 16} ${l * 32} ${cy - 8}`} fill="none" stroke={escuro} strokeWidth={2.3} strokeLinecap="round" />
          </g>
        ),
      )}
      <path d={`M 3 ${cy - 4} Q 9 ${cy + 12} 7 ${cy + 24} Q 2 ${cy + 28} -4 ${cy + 25}`} fill="none" stroke={tom(v.pele, -0.16)} strokeWidth={3} strokeLinecap="round" opacity={0.75} />
      {boca === "aberta" && <path d={`M -16 ${cy + 34} Q 0 ${cy + 56} 16 ${cy + 34} Z`} fill="#5A2A24" />}
      {boca === "O" && <ellipse cx={0} cy={cy + 40} rx={6} ry={8} fill="#5A2A24" />}
      {boca === "sorriso" && <path d={`M -14 ${cy + 34} Q 0 ${cy + 44} 14 ${cy + 34}`} fill="none" stroke="#6B3A30" strokeWidth={3.5} strokeLinecap="round" />}
      {boca === "reta" && <path d={`M -10 ${cy + 38} L 10 ${cy + 38}`} stroke="#6B3A30" strokeWidth={3.5} strokeLinecap="round" />}
    </g>
  );
};
