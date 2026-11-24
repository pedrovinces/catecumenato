// Legenda: 2 a 4 palavras, caixa alta, branco com contorno preto de 8 px.
// A palavra falada no instante cresce para 110% e ganha a cor da cena (no branco, dourado).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import type { Linha } from "../../lib/linha-do-tempo";
import { DESTAQUE, TINTA } from "../../lib/paleta";
import { LEGENDA } from "../../lib/fontes";
import { AREA } from "./area";

export const Legenda: React.FC<{ linha: Linha; destaque?: "exata" | "clara" }> = ({ linha, destaque }) => {
  const f = useCurrentFrame();
  const grupo = linha.legendas.find((g) => f >= g.inicio && f < g.fim);
  if (!grupo) return null;
  // se um letreiro com o mesmo texto está na tela, a legenda sai para não repetir
  const norm = (s: string) => s.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase();
  const repetido = linha.cenas.some((c) =>
    c.textos.some((t) => t.posicao === "letreiro" && f >= c.inicio + t.inicio && f < c.inicio + t.fim && norm(t.conteudo) === norm(grupo.palavras.map((p) => p.texto).join(""))),
  );
  if (repetido) return null;
  const cor = DESTAQUE[destaque ?? linha.destaque][grupo.cor];
  let ativa = -1;
  grupo.palavras.forEach((p, i) => {
    if (f >= p.inicio) ativa = i;
  });
  const entrada = f - grupo.inicio < 2 ? 0.92 : 1;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: AREA.esquerda,
          width: AREA.direita - AREA.esquerda,
          top: AREA.legendaTopo,
          height: AREA.legendaBase - AREA.legendaTopo,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          columnGap: 50,
          rowGap: 4,
          transform: `scale(${entrada})`,
        }}
      >
        {grupo.palavras.map((p, i) => (
          <span
            key={i}
            style={{
              fontFamily: LEGENDA,
              fontWeight: 800,
              fontSize: 80,
              lineHeight: 1.12,
              letterSpacing: 0.5,
              color: i === ativa ? cor : "#FFFFFF",
              WebkitTextStroke: `16px ${TINTA}`,
              paintOrder: "stroke fill",
              display: "inline-block",
              transform: `scale(${i === ativa ? 1.1 : 1})`,
              transformOrigin: "50% 60%",
              textShadow: `0 6px 0 ${TINTA}`,
            }}
          >
            {p.texto}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
