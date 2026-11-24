// Cena 1: o Padre troca de casula diante do espelho; tela dividida com o influencer; congela; zoom no rosto.
import React from "react";
import { interpolate, Easing } from "remotion";
import { useCena } from "../components/motor/contexto";
import { Camera, Tela } from "../components/motor/Camera";
import { Padre } from "../components/Padre";
import { Fiel } from "../components/Fiel";
import { Ambiente, CabideVoando, Espelho, Mala } from "../components/cenario";
import { CASULA, CORES, TINTA, escurecer } from "../lib/paleta";

const CICLO = [CASULA.verde, CASULA.roxo, CASULA.branco, CASULA.vermelho, CASULA.rosa];
const LOOKS = ["#FF7043", "#29B6F6", "#FFEE58", "#AB47BC", "#66BB6A"];
const QUADROS_POR_TROCA = 4;

export const Abertura: React.FC = () => {
  const { f, ev, passou } = useCena();
  const congela = ev("congela") ?? Infinity;
  const troca = Math.floor(f / QUADROS_POR_TROCA);
  const cor = CICLO[troca % CICLO.length];
  const corAnterior = CICLO[(troca + CICLO.length - 1) % CICLO.length];
  const braçosAcima = troca % 2 === 1;
  const ultimas = [0, 1, 2].map((k) => troca - k).filter((k) => k > 0);

  // plano 3 e 4: close no Padre com o cabide (congelado) e zoom rápido no rosto
  if (f >= congela) {
    const z = passou("zoomRosto")
      ? interpolate(f - (ev("zoomRosto") ?? 0), [0, 5], [1, 1.75], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) })
      : 1;
    const rosto: [number, number] = [540, 1010];
    return (
      <Camera zoom={z} foco={rosto}>
        <Tela>
          <Ambiente cor={CORES.sepia} piso={1880} />
          <Padre
            x={540}
            y={1960}
            escala={1.24}
            casula={CASULA.roxo}
            pose={passou("zoomRosto") ? "desconfiado" : "cabide"}
            adereco={passou("zoomRosto") ? null : "cabide"}
            corAdereco={CASULA.rosa}
          />
        </Tela>
      </Camera>
    );
  }

  // plano 2: tela dividida com o influencer
  if (passou("split")) {
    return (
      <Tela>
        <defs>
          <clipPath id="esq">
            <rect x={0} y={0} width={540} height={1920} />
          </clipPath>
          <clipPath id="dir">
            <rect x={540} y={0} width={540} height={1920} />
          </clipPath>
        </defs>
        <g clipPath="url(#esq)">
          <Ambiente cor={CORES.sepia} piso={1600} />
          <Padre x={275} y={1650} escala={0.82} casula={cor} pose={braçosAcima ? "trocando" : "neutro"} expressao={{ olhos: "feliz" }} />
          {ultimas.map((k) => (
            <CabideVoando key={k} x={300} y={980} t={f - k * QUADROS_POR_TROCA} cor={CICLO[(k + 4) % 5]} dir={-1} semente={`p${k}`} />
          ))}
        </g>
        <g clipPath="url(#dir)">
          <Ambiente cor={escurecer(CORES.sepia, 0.06)} piso={1600} listras={false} />
          <Mala x={650} y={1640} cor="#26C6DA" />
          <Mala x={985} y={1650} cor="#EC407A" altura={360} />
          <Mala x={830} y={1700} cor="#FFCA28" deitada largura={200} altura={300} />
          <Fiel x={815} y={1620} escala={1.02} tipo="influencer" roupa={LOOKS[troca % LOOKS.length]} bracos="selfie" expressao={{ olhos: "feliz", boca: "sorrisao" }} />
          {ultimas.map((k) => (
            <CabideVoando key={k} x={800} y={980} t={f - k * QUADROS_POR_TROCA} cor={LOOKS[(k + 4) % 5]} dir={1} semente={`i${k}`} />
          ))}
        </g>
        <rect x={532} y={0} width={16} height={1920} fill="#FFFFFF" />
        <rect x={536} y={0} width={8} height={1920} fill={TINTA} />
      </Tela>
    );
  }

  // plano 1: espelho de corpo inteiro, troca de casula a cada 4 quadros, cabides voando
  return (
    <Tela>
      <Ambiente cor={CORES.sepia} piso={1610} />
      <Espelho x={800} y={1600} largura={330} altura={950}>
        <rect x={600} y={600} width={420} height={1100} fill="#D7ECF1" />
        <Padre x={830} y={1700} escala={0.7} casula={cor} pose={braçosAcima ? "trocando" : "neutro"} espelhado sombra={false} expressao={{ olhos: "feliz" }} />
      </Espelho>
      <Padre x={320} y={1660} escala={0.96} casula={cor} pose={braçosAcima ? "trocando" : "neutro"} expressao={{ olhos: "feliz" }} />
      {ultimas.map((k) => (
        <CabideVoando key={k} x={340} y={830} t={f - k * QUADROS_POR_TROCA} cor={k === troca ? corAnterior : CICLO[(k + 4) % 5]} dir={-1} semente={`a${k}`} />
      ))}
    </Tela>
  );
};
