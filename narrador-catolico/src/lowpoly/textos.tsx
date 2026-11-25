// Textos do estilo cinema: título serifado espaçado, rótulo de bloco e legenda que acende palavra por palavra.
import React from "react";
import { LEGENDA, SERIFA } from "../lib/fontes";
import { AREA } from "../components/motor/area";

export const DOURADO_LEGENDA = "#F2C14E";

export const TituloCinema: React.FC<{ linhas: { texto: string; tamanho: number; cor?: string; espaco?: number }[]; y: number; opacidade?: number }> = ({ linhas, y, opacidade = 1 }) => (
  <div style={{ position: "absolute", left: AREA.esquerda, width: AREA.direita - AREA.esquerda, top: y, textAlign: "center", opacity: opacidade }}>
    {linhas.map((l, i) => (
      <div
        key={i}
        style={{
          fontFamily: SERIFA,
          fontWeight: 700,
          fontSize: l.tamanho,
          letterSpacing: `${l.espaco ?? 0.1}em`,
          color: l.cor ?? "#F6EBD3",
          lineHeight: 1.12,
          textShadow: "0 4px 22px rgba(0,0,0,0.55), 0 2px 2px rgba(0,0,0,0.45)",
          whiteSpace: "nowrap",
        }}
      >
        {l.texto}
      </div>
    ))}
  </div>
);

/** Rótulo de bloco (substitui o selo): caixa escura com filete dourado e serifa espaçada. */
export const Rotulo: React.FC<{ texto: string; y?: number; opacidade?: number }> = ({ texto, y = AREA.topo + 10, opacidade = 1 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: opacidade }}>
    <div
      style={{
        fontFamily: SERIFA,
        fontWeight: 600,
        fontSize: 30,
        letterSpacing: "0.28em",
        color: "#EBCB86",
        backgroundColor: "rgba(20,14,12,0.78)",
        border: "2px solid #A8832E",
        padding: "8px 22px 8px 30px",
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  </div>
);

/** Legenda: o que já foi dito em branco, a palavra da vez em dourado, o que vem depois em cinza. */
export const LegendaKaraoke: React.FC<{ palavras: string[]; ativa: number; y: number }> = ({ palavras, ativa, y }) => (
  <div
    style={{
      position: "absolute",
      left: AREA.esquerda,
      width: AREA.direita - AREA.esquerda,
      top: y,
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      columnGap: 16,
      rowGap: 2,
    }}
  >
    {palavras.map((p, i) => (
      <span
        key={i}
        style={{
          fontFamily: LEGENDA,
          fontWeight: 800,
          fontSize: 60,
          lineHeight: 1.15,
          color: i < ativa ? "#FFFFFF" : i === ativa ? DOURADO_LEGENDA : "#B9B5AE",
          WebkitTextStroke: "7px #141210",
          paintOrder: "stroke fill",
          textShadow: "0 4px 10px rgba(0,0,0,0.55)",
        }}
      >
        {p}
      </span>
    ))}
  </div>
);
