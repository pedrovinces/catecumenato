// Capa do Reel (1080x1920): imagem do episódio com o título grande na metade de baixo,
// dentro do recorte 4:5 da grade do perfil (y 285 a 1635) e fora do rosto do personagem.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { carregarFontes, SERIFA } from "../lib/fontes";

carregarFontes();

export type PropsCapa = { codigo: string; imagem: string; linhas: string[]; destaque?: number };

export const Capa: React.FC<PropsCapa> = ({ codigo, imagem, linhas, destaque = linhas.length - 1 }) => {
  const largura = 900;
  const tamanho = Math.min(118, ...linhas.map((l) => fitText({ text: l, withinWidth: largura, fontFamily: SERIFA, fontWeight: "700", letterSpacing: "0.04em" }).fontSize));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Img src={staticFile(`img/${codigo}/${imagem}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,0.55) 66%, rgba(0,0,0,0.72) 84%, rgba(0,0,0,0.4) 100%)" }} />
      <div style={{ position: "absolute", left: 90, width: largura, top: 1180, textAlign: "center" }}>
        {linhas.map((l, i) => (
          <div
            key={i}
            style={{
              fontFamily: SERIFA,
              fontWeight: 700,
              fontSize: tamanho,
              letterSpacing: "0.04em",
              lineHeight: 1.08,
              color: i === destaque ? "#F2C14E" : "#F6EBD3",
              textShadow: "0 6px 24px rgba(0,0,0,0.7), 0 2px 3px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            {l}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
