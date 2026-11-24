// Prancha com as três propostas de logotipo e os avatares do perfil.
import React from "react";
import { AbsoluteFill } from "remotion";
import { AvatarNarrador, LogoNarrador, type VarianteLogo } from "./components/LogoNarrador";
import { CORES, TINTA } from "./lib/paleta";
import { carregarFontes, LEGENDA, TITULO } from "./lib/fontes";

carregarFontes();

const NOMES: [VarianteLogo, string, string][] = [
  ["aspas", "A · ESTOLA-ASPAS", "duas pontas de estola formam as aspas: a voz que narra"],
  ["microfone", "B · MICROFONE-SINO", "microfone de rádio antigo com silhueta de sino"],
  ["balao", "C · BALÃO-CRUZ", "balão de fala com cruz, cercado pelas cinco cores"],
];

export const PranchaLogos: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CORES.sepia, padding: 40, display: "flex", flexDirection: "column", gap: 24 }}>
    {NOMES.map(([v, titulo, desc]) => (
      <div key={v} style={{ flex: 1, display: "flex", alignItems: "center", gap: 30, borderBottom: `6px solid ${TINTA}`, paddingBottom: 14 }}>
        <div style={{ width: 470, display: "flex", justifyContent: "center", backgroundColor: CORES.roxo, borderRadius: 30, border: `7px solid ${TINTA}`, padding: 12 }}>
          <LogoNarrador largura={420} variante={v} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", gap: 18 }}>
            <AvatarNarrador tamanho={190} variante={v} />
            <div style={{ backgroundColor: "#FFFFFF", border: `6px solid ${TINTA}`, borderRadius: 20, padding: 6 }}>
              <LogoNarrador largura={170} variante={v} claro />
            </div>
          </div>
          <div style={{ fontFamily: TITULO, fontSize: 46, color: TINTA }}>{titulo}</div>
          <div style={{ fontFamily: LEGENDA, fontWeight: 800, fontSize: 24, color: TINTA, textAlign: "center" }}>{desc}</div>
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
