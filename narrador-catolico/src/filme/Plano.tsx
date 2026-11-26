// Um plano: o clipe animado (quando existe) ou a imagem parada com movimento de câmera.
import React from "react";
import { AbsoluteFill, Freeze, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { cameraNoQuadro, type PlanoQ } from "./planos";

const COBRIR: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

const Clipe: React.FC<{ p: PlanoQ; codigo: string; quadros: number }> = ({ p, codigo, quadros }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const disponivel = Math.floor((p.video!.duracao * fps) - p.trecho) - 1;
  // clipe um pouco curto para o plano: desacelera até 68%; mais curto que isso, segura o último quadro
  const taxa = disponivel >= quadros ? 1 : disponivel / quadros >= 0.68 ? disponivel / quadros : 1;
  const video = <OffthreadVideo src={staticFile(`video/${codigo}/${p.id}.mp4`)} trimBefore={p.trecho} playbackRate={taxa} muted style={COBRIR} />;
  if (taxa === 1 && f >= disponivel) return <Freeze frame={disponivel - 1}>{video}</Freeze>;
  return video;
};

export const Plano: React.FC<{ p: PlanoQ; codigo: string }> = ({ p, codigo }) => {
  const f = useCurrentFrame();
  const quadros = p.fim - p.inicio + p.fusao;
  const fAbs = p.inicio - p.fusao + f;
  const opacidade = p.fusao ? interpolate(f, [0, p.fusao], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ opacity: opacidade, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: cameraNoQuadro(p, fAbs), transformOrigin: "50% 50%" }}>
        {p.video ? <Clipe p={p} codigo={codigo} quadros={quadros} /> : <Img src={staticFile(`img/${codigo}/${p.id}.png`)} style={COBRIR} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
