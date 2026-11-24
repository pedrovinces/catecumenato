// Cena ainda não desenhada: fundo da cor, Padre com a casula da cena e o nome da cena (só na prévia).
import React from "react";
import { useCena } from "../components/motor/contexto";
import { Tela } from "../components/motor/Camera";
import { Padre } from "../components/Padre";
import { Ambiente } from "../components/cenario";
import { CASULA, CORES, TINTA } from "../lib/paleta";
import { TITULO } from "../lib/fontes";

export const Provisoria: React.FC = () => {
  const { cena, f } = useCena();
  const casula = CASULA[cena.cor] ?? CASULA.verde;
  return (
    <Tela>
      <Ambiente cor={CORES[cena.cor]} piso={1600} />
      <Padre x={540} y={1700} escala={0.95} casula={casula} pose={Math.floor(f / 45) % 2 ? "joinha" : "neutro"} />
      <text x={540} y={1800} textAnchor="middle" fontFamily={TITULO} fontSize={44} fill="#FFFFFF" stroke={TINTA} strokeWidth={8} paintOrder="stroke fill">
        {`CENA "${cena.id.toUpperCase()}" EM CONSTRUÇÃO`}
      </text>
    </Tela>
  );
};
