// Textos na tela vindos do JSON (títulos, rodapés, carimbos, letreiro, assinatura final), sempre na área segura.
import React from "react";
import { Easing, interpolate } from "remotion";
import { fitText } from "@remotion/layout-utils";
import type { TextoQ } from "../../lib/linha-do-tempo";
import { CORES, TINTA, type NomeCor } from "../../lib/paleta";
import { LEGENDA, TITULO } from "../../lib/fontes";
import { pop, tremor } from "../../lib/anim";
import { AREA } from "./area";
import { LogoNarrador } from "../LogoNarrador";

const ORDEM: TextoQ["posicao"][] = ["titulo", "subtitulo", "carimbo"];

const escalaEntrada = (t: TextoQ, f: number) => {
  const d = f - t.inicio;
  switch (t.entrada) {
    case "pop":
      return { escala: pop(f, t.inicio, 9), opacidade: 1, dx: 0 };
    case "desliza":
      return { escala: 1, opacidade: interpolate(d, [0, 4], [0, 1], { extrapolateRight: "clamp" }), dx: interpolate(d, [0, 6], [-120, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) };
    case "carimbo":
      return { escala: interpolate(d, [0, 3, 5], [1.9, 0.94, 1], { extrapolateRight: "clamp" }), opacidade: d < 0 ? 0 : 1, dx: 0 };
    case "impacto":
      return { escala: interpolate(d, [0, 4, 7], [2.6, 0.92, 1], { extrapolateRight: "clamp" }), opacidade: 1, dx: 0 };
    default:
      return { escala: 1, opacidade: interpolate(d, [0, 10], [0, 1], { extrapolateRight: "clamp" }), dx: 0 };
  }
};

const Titulo: React.FC<{ texto: string; largura: number; max?: number }> = ({ texto, largura, max = 104 }) => {
  const linhas = texto.split("\n");
  const tamanho = Math.min(
    max,
    ...linhas.map((l) => fitText({ text: l, withinWidth: largura - 30, fontFamily: TITULO, fontWeight: "400" }).fontSize),
  );
  return (
    <div style={{ textAlign: "center" }}>
      {linhas.map((l, i) => (
        <div
          key={i}
          style={{
            fontFamily: TITULO,
            fontSize: tamanho,
            lineHeight: 1.05,
            color: "#FFFFFF",
            WebkitTextStroke: `16px ${TINTA}`,
            paintOrder: "stroke fill",
            textShadow: `7px 8px 0 ${TINTA}`,
            letterSpacing: 1,
            whiteSpace: "nowrap",
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
};

const Faixa: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <div
      style={{
        fontFamily: LEGENDA,
        fontWeight: 900,
        fontSize: 40,
        color: "#FFFFFF",
        backgroundColor: TINTA,
        padding: "10px 22px 12px",
        borderRadius: 14,
        letterSpacing: 1,
        whiteSpace: "pre-line",
        textAlign: "center",
        boxShadow: "6px 6px 0 rgba(0,0,0,0.25)",
      }}
    >
      {texto}
    </div>
  </div>
);

const Carimbo: React.FC<{ texto: string }> = ({ texto }) => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <div
      style={{
        fontFamily: TITULO,
        fontSize: 64,
        color: "#9E1B1B",
        border: "9px solid #9E1B1B",
        outline: "4px solid #9E1B1B",
        outlineOffset: 5,
        padding: "4px 26px 6px",
        borderRadius: 10,
        backgroundColor: "rgba(255,250,240,0.92)",
        transform: "rotate(-6deg)",
        letterSpacing: 2,
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  </div>
);

export const TextoTela: React.FC<{ textos: TextoQ[]; f: number; temSelo: boolean; cor: NomeCor; handle?: string }> = ({ textos, f, temSelo, cor, handle }) => {
  const ativos = textos.filter((t) => f >= t.inicio && f < t.fim);
  if (!ativos.length) return null;
  const esquerda = temSelo ? AREA.selo.x + AREA.selo.d + 18 : AREA.esquerda;
  const largura = AREA.direita - esquerda;
  const coluna = ativos.filter((t) => ORDEM.includes(t.posicao)).sort((a, b) => ORDEM.indexOf(a.posicao) - ORDEM.indexOf(b.posicao) || a.inicio - b.inicio);
  const letreiro = ativos.find((t) => t.posicao === "letreiro");
  const assinatura = ativos.find((t) => t.posicao === "assinatura");
  return (
    <>
      {coluna.length > 0 && (
        <div style={{ position: "absolute", left: esquerda, width: largura, top: AREA.topo + 18, display: "flex", flexDirection: "column", gap: 18 }}>
          {coluna.map((t, i) => {
            const e = escalaEntrada(t, f);
            return (
              <div key={i} style={{ transform: `translateX(${e.dx}px) scale(${e.escala})`, opacity: e.opacidade, transformOrigin: "50% 50%" }}>
                {t.posicao === "titulo" && <Titulo texto={t.conteudo} largura={largura} max={temSelo ? 84 : 112} />}
                {t.posicao === "subtitulo" && <Faixa texto={t.conteudo} />}
                {t.posicao === "carimbo" && <Carimbo texto={t.conteudo} />}
              </div>
            );
          })}
        </div>
      )}
      {letreiro && (
        <div
          style={{
            position: "absolute",
            left: AREA.esquerda,
            width: AREA.direita - AREA.esquerda,
            top: 560,
            height: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translate(${tremor(f, f - letreiro.inicio < 8 ? 14 : 0).x}px, ${tremor(f, f - letreiro.inicio < 8 ? 14 : 0, "l").y}px) scale(${escalaEntrada(letreiro, f).escala}) rotate(-5deg)`,
          }}
        >
          <div
            style={{
              fontFamily: TITULO,
              fontSize: Math.min(190, fitText({ text: letreiro.conteudo, withinWidth: AREA.direita - AREA.esquerda - 80, fontFamily: TITULO, fontWeight: "400" }).fontSize),
              color: "#FFFFFF",
              WebkitTextStroke: `22px ${TINTA}`,
              paintOrder: "stroke fill",
              textShadow: `12px 14px 0 ${TINTA}`,
              backgroundColor: cor === "rosa" ? "transparent" : undefined,
              whiteSpace: "nowrap",
            }}
          >
            {letreiro.conteudo}
          </div>
        </div>
      )}
      {assinatura && (
        <div
          style={{
            position: "absolute",
            left: AREA.esquerda,
            width: AREA.direita - AREA.esquerda,
            top: 560,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
            transform: `scale(${escalaEntrada(assinatura, f).escala})`,
          }}
        >
          <LogoNarrador largura={600} />
          <div
            style={{
              fontFamily: LEGENDA,
              fontWeight: 900,
              fontSize: 50,
              color: "#FFFFFF",
              backgroundColor: TINTA,
              padding: "12px 28px",
              borderRadius: 16,
            }}
          >
            {assinatura.conteudo.replace("@narradorcatolico", handle ?? "@narradorcatolico")}
          </div>
        </div>
      )}
    </>
  );
};

export const corFundo = (c: NomeCor) => CORES[c];
