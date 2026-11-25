import React from "react";
import { AbsoluteFill } from "remotion";
import { PadreLP } from "../lowpoly/PadreLP";
export const TestePadreLP: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(#F1E6D2, #CDB797)" }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      <PadreLP x={260} y={900} escala={0.78} casula="#2E7D32" pose="neutro" semente="a" />
      <PadreLP x={800} y={900} escala={0.78} casula="#5E2B7E" pose="solene" semente="b" />
      <PadreLP x={260} y={1820} escala={0.78} casula="#E78FB3" pose="bracosCruzados" semente="c" />
      <PadreLP x={800} y={1820} escala={0.78} casula="#FFFDF3" pose="segurandoCabide" semente="d" />
    </svg>
  </AbsoluteFill>
);
