import React from "react";
import { AbsoluteFill } from "remotion";
import { Padre, type NomePose } from "../components/Padre";
import { CASULA, CORES } from "../lib/paleta";

const poses: [NomePose, string | null, string | null][] = [
  ["neutro", CASULA.verde, null], ["sonolento", CASULA.verde, null], ["surpreso", CASULA.roxo, null],
  ["solene", CASULA.branco, null], ["confiante", CASULA.rosa, null], ["acenando", CASULA.vermelho, null],
  ["joinha", CASULA.branco, null], ["cabide", CASULA.verde, null], ["torcedor", null, null],
];
export const TestePadre: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: CORES.sepia }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {poses.map(([p, c], i) => (
        <Padre key={i} x={180 + (i % 3) * 360} y={600 + Math.floor(i / 3) * 630} escala={0.55} pose={p} casula={c}
          adereco={p === "sonolento" ? "caneca" : p === "cabide" ? "cabide" : p === "torcedor" ? "corneta" : null}
          corAdereco={CASULA.roxo} cachecol={p === "torcedor" ? CASULA.roxo : null} />
      ))}
    </svg>
  </AbsoluteFill>
);
