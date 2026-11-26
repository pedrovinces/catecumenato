// Episódio no estilo filme de animação: clipes animados (ou imagens com câmera) cortados na fala,
// sobreposições em serifa, congelamento em sépia e legenda karaokê centralizada.
import React from "react";
import { AbsoluteFill, Audio, Freeze, Sequence, staticFile, useCurrentFrame } from "remotion";
import type { Janela, Linha } from "../lib/linha-do-tempo";
import { carregarFontes, LEGENDA } from "../lib/fontes";
import { AREA } from "../components/motor/area";
import { ProvedorCena } from "../components/motor/contexto";
import { Granulacao, Vinheta } from "../components/motor/Congela";
import sfxDisponiveis from "../sfx-disponiveis.json";
import { Plano } from "./Plano";
import { janelaEm, type PlanoQ } from "./planos";
import { Sobreposicoes } from "./Sobreposicoes";

carregarFontes();

export type PropsFilme = {
  codigo: string;
  linha?: Linha;
  planos?: PlanoQ[];
  audio?: boolean; // narração e efeitos na prévia (o mix final é feito no ffmpeg)
  legenda?: boolean;
};

/** [CONGELA]: a imagem para em sépia com granulação e vinheta; as sobreposições seguem em cor. */
const CongelaFilme: React.FC<{ janelas: Janela[]; children: React.ReactNode }> = ({ janelas, children }) => {
  const f = useCurrentFrame();
  const j = janelaEm(janelas, f);
  if (!j) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: "scale(1.05)", filter: "sepia(0.88) saturate(0.9) contrast(1.08) brightness(0.97)" }}>
        <Freeze frame={j.inicio}>{children}</Freeze>
      </AbsoluteFill>
      <Granulacao f={f} opacidade={0.22} />
      <Vinheta forca={0.55} />
    </AbsoluteFill>
  );
};

/** Legenda: dito em branco, palavra da vez em dourado, o que vem em cinza; centrada na faixa segura. */
const LegendaFilme: React.FC<{ linha: Linha }> = ({ linha }) => {
  const f = useCurrentFrame();
  const grupo = linha.legendas.find((g) => f >= g.inicio && f < g.fim);
  if (!grupo) return null;
  const norm = (s: string) => s.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase();
  const repetido = linha.cenas.some((c) =>
    c.textos.some((t) => t.posicao === "letreiro" && f >= c.inicio + t.inicio && f < c.inicio + t.fim && norm(t.conteudo) === norm(grupo.palavras.map((p) => p.texto).join(""))),
  );
  if (repetido) return null;
  let ativa = -1;
  grupo.palavras.forEach((p, i) => {
    if (f >= p.inicio) ativa = i;
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.32) 72%, rgba(0,0,0,0.32) 82%, rgba(0,0,0,0) 90%)" }} />
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
          columnGap: 18,
          rowGap: 2,
        }}
      >
        {grupo.palavras.map((p, i) => (
          <span
            key={i}
            style={{
              fontFamily: LEGENDA,
              fontWeight: 800,
              fontSize: 64,
              lineHeight: 1.15,
              color: i < ativa ? "#FFFFFF" : i === ativa ? "#F2C14E" : "#B9B5AE",
              WebkitTextStroke: "8px #141210",
              paintOrder: "stroke fill",
              textShadow: "0 4px 12px rgba(0,0,0,0.6)",
            }}
          >
            {p.texto}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const Filme: React.FC<PropsFilme> = ({ codigo, linha, planos, audio = true, legenda = true }) => {
  if (!linha || !planos) return null;
  const q = (s: number) => Math.round(s * linha.fps);
  const janelas: Janela[] = linha.cenas.flatMap((c) => c.congelas.map((j) => ({ inicio: c.inicio + j.inicio, fim: c.inicio + j.fim })));
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <CongelaFilme janelas={janelas}>
        {planos.map((p) => (
          <Sequence key={p.chave} from={p.inicio - p.fusao} durationInFrames={p.fim - p.inicio + p.fusao} name={p.chave}>
            <Plano p={p} codigo={codigo} />
          </Sequence>
        ))}
      </CongelaFilme>
      {linha.cenas.map((c) => (
        <Sequence key={c.id} from={c.inicio} durationInFrames={c.duracao} name={`sobreposições ${c.id}`}>
          <ProvedorCena cena={c} linha={linha}>
            <Sobreposicoes planos={planos} janelas={janelas} codigo={codigo} />
          </ProvedorCena>
        </Sequence>
      ))}
      {legenda && <LegendaFilme linha={linha} />}
      {audio &&
        linha.sfx
          .filter((s) => (sfxDisponiveis as string[]).includes(s.arquivo))
          .map((s, i) => (
            <Sequence key={`sfx-${i}`} from={s.quadro} durationInFrames={Math.max(1, Math.min(180, linha.duracao - s.quadro))} name={`sfx ${s.arquivo}`}>
              <Audio src={staticFile(`sfx/${s.arquivo}.wav`)} volume={0.5 * 10 ** (s.volume / 20)} />
            </Sequence>
          ))}
      {audio &&
        linha.narracao.segmentos.map((s, i) => (
          <Sequence key={`voz-${i}`} from={q(s.destino)} durationInFrames={q(s.origemFim - s.origemIni) + 1} name={`voz ${i}`}>
            <Audio src={staticFile(linha.narracao.arquivo)} trimBefore={q(s.origemIni)} trimAfter={q(s.origemFim)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
