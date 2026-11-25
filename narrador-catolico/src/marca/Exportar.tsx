// Arquivos da marca (conceito D · Traço). PNG com fundo transparente, exceto o avatar.
// Renderize com: npx tsx scripts/marca.ts  (grava em marca/)
import React from "react";
import { AbsoluteFill } from "remotion";
import { carregarFontes } from "../lib/fontes";
import { LogoEmpilhado, LogoHorizontal, NOITE, Simbolo, CONCEITO_OFICIAL, OURO } from "./Marca";

carregarFontes();

const Centro: React.FC<{ children: React.ReactNode; fundo?: string }> = ({ children, fundo }) => (
  <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", background: fundo }}>{children}</AbsoluteFill>
);

/** Avatar do perfil: 1080 x 1080, pensado para o recorte redondo do Instagram. */
export const MarcaAvatar: React.FC = () => (
  <Centro fundo={`radial-gradient(circle at 50% 42%, #231E30 0%, ${NOITE} 62%, #0B0910 100%)`}>
    <div style={{ marginTop: 20 }}>
      <Simbolo conceito={CONCEITO_OFICIAL} tamanho={800} id="avatar" brilho />
    </div>
  </Centro>
);

export const MarcaHorizontal: React.FC<{ claro?: boolean }> = ({ claro }) => (
  <Centro>
    <LogoHorizontal conceito={CONCEITO_OFICIAL} altura={640} id="horizontal" claro={claro} />
  </Centro>
);

export const MarcaEmpilhada: React.FC<{ claro?: boolean }> = ({ claro }) => (
  <Centro>
    <LogoEmpilhado largura={1400} id="empilhada" claro={claro} />
  </Centro>
);

export const MarcaSimbolo: React.FC<{ cor?: string }> = ({ cor = OURO }) => (
  <Centro>
    <Simbolo conceito={CONCEITO_OFICIAL} tamanho={1000} id="simbolo" corTraco={cor} />
  </Centro>
);
