import React from "react";
import { Composition, Still } from "remotion";
import { Episodio, type PropsEpisodio } from "./Episodio";
import { EPISODIOS } from "./episodios";
import { resolverLinha, FPS, LARGURA, ALTURA } from "./lib/linha-do-tempo";
import { PranchaLogos } from "./Logos";
import { QuadrosEstilo, type PropsEstilo } from "./estilo/QuadrosEstilo";
import { TestePadre } from "./teste/TestePadre";
import { TestePadreLP } from "./teste/TestePadreLP";

export const Raiz: React.FC = () => (
  <>
    {Object.keys(EPISODIOS).map((codigo) => (
      <Composition
        key={codigo}
        id={codigo}
        component={Episodio}
        fps={FPS}
        width={LARGURA}
        height={ALTURA}
        durationInFrames={300}
        defaultProps={{ codigo, audio: true, legenda: true } as PropsEpisodio}
        calculateMetadata={({ props }) => {
          const ep = EPISODIOS[props.codigo];
          const linha = resolverLinha(ep.roteiro, ep.tempos);
          return { durationInFrames: linha.duracao, props: { ...props, linha } };
        }}
      />
    ))}
    <Still id="Logos" component={PranchaLogos} width={1080} height={1920} />
    <Still id="Estilo" component={QuadrosEstilo} width={1080} height={1920} defaultProps={{ quadro: 1 } as PropsEstilo} />
    <Still id="TestePadre" component={TestePadre} width={1080} height={1920} />
    <Still id="TestePadreLP" component={TestePadreLP} width={1080} height={1920} />
  </>
);
