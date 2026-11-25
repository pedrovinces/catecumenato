// Capa do Reel (1080x1920), modelo da série: marca no topo, imagem do episódio, número do episódio,
// título grande e (opcional) faixa de cores. Tudo essencial fica no miolo 1080x1350 (y 285 a 1635),
// que é o que aparece no recorte da grade do perfil (4:5 e 3:4).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { carregarFontes, LEGENDA, SERIFA } from "../lib/fontes";
import { CREME, NOITE, OURO, OURO_CLARO, Simbolo, CONCEITO_OFICIAL } from "../marca/Marca";

carregarFontes();

export type PropsCapa = {
  codigo: string;
  imagem: string;
  episodio: string; // "01"
  titulo: string; // "CORES LITÚRGICAS"
  cores?: string[]; // faixa opcional (ex.: as cinco cores litúrgicas)
  enquadre?: { escala: number; x: number; y: number }; // posição da imagem (px)
};

export const Capa: React.FC<PropsCapa> = ({ codigo, imagem, episodio, titulo, cores, enquadre = { escala: 1, x: 0, y: 0 } }) => {
  const largura = 920;
  const palavras = titulo.toUpperCase().split(/\s+/);
  // título em até duas linhas equilibradas
  let corte = palavras.length;
  if (palavras.length > 1) {
    corte = 1;
    for (let i = 1; i < palavras.length; i++) {
      const maior = (k: number) => Math.max(palavras.slice(0, k).join(" ").length, palavras.slice(k).join(" ").length);
      if (maior(i) < maior(corte)) corte = i;
    }
  }
  const linhas = [palavras.slice(0, corte).join(" "), palavras.slice(corte).join(" ")].filter(Boolean);
  const tamanho = Math.min(150, ...linhas.map((l) => fitText({ text: l, withinWidth: largura, fontFamily: SERIFA, fontWeight: "700", letterSpacing: "0.04em" }).fontSize));
  return (
    <AbsoluteFill style={{ backgroundColor: NOITE }}>
      <AbsoluteFill style={{ transform: `translate(${enquadre.x}px, ${enquadre.y}px) scale(${enquadre.escala})`, transformOrigin: "50% 50%" }}>
        <Img src={staticFile(`img/${codigo}/${imagem}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {/* véus: topo para a marca, base para o título */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(12,10,18,0.92) 0%, rgba(12,10,18,0.55) 19%, rgba(12,10,18,0) 30%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(12,10,18,0) 48%, rgba(12,10,18,0.62) 62%, rgba(12,10,18,0.9) 76%, rgba(12,10,18,0.96) 100%)" }} />

      {/* marca */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
        <Simbolo conceito={CONCEITO_OFICIAL} tamanho={96} id="capa-marca" brilho />
        <div style={{ fontFamily: SERIFA, fontWeight: 700, fontSize: 40, letterSpacing: "0.16em", lineHeight: 1.02, color: CREME }}>
          NARRADOR
          <br />
          <span style={{ color: OURO }}>CATÓLICO</span>
        </div>
      </div>

      {/* episódio e título */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1215, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
          <div style={{ width: 70, height: 2, backgroundColor: OURO }} />
          <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 38, letterSpacing: "0.32em", color: OURO_CLARO, paddingLeft: "0.32em" }}>EPISÓDIO {episodio}</div>
          <div style={{ width: 70, height: 2, backgroundColor: OURO }} />
        </div>
        {linhas.map((l, i) => (
          <div
            key={i}
            style={{
              fontFamily: SERIFA,
              fontWeight: 700,
              fontSize: tamanho,
              letterSpacing: "0.04em",
              lineHeight: 1.02,
              color: i === linhas.length - 1 ? OURO : CREME,
              textShadow: "0 6px 26px rgba(0,0,0,0.75), 0 2px 3px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            {l}
          </div>
        ))}
        {cores && (
          <div style={{ display: "flex", gap: 14, marginTop: 26 }}>
            {cores.map((c, i) => (
              <div key={i} style={{ width: 92, height: 16, borderRadius: 8, backgroundColor: c, border: "2px solid rgba(233,185,73,0.85)", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }} />
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
