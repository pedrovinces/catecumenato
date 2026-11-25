import React from "react";
import { Composition, Still } from "remotion";
import { Episodio, type PropsEpisodio } from "./Episodio";
import { Filme, type PropsFilme } from "./filme/Filme";
import { resolverPlanos } from "./filme/planos";
import { Capa, type PropsCapa } from "./filme/Capa";
import { PranchaMarca } from "./marca/PranchaMarca";
import { MarcaAvatar, MarcaEmpilhada, MarcaHorizontal, MarcaPerfil, MarcaSimbolo } from "./marca/Exportar";
import clipes from "./clipes-disponiveis.json";
import { EPISODIOS } from "./episodios";
import { resolverLinha, FPS, LARGURA, ALTURA } from "./lib/linha-do-tempo";
import { PranchaLogos } from "./Logos";
import { QuadrosEstilo, type PropsEstilo } from "./estilo/QuadrosEstilo";
import { TestePadre } from "./teste/TestePadre";
import { TestePadreLP } from "./teste/TestePadreLP";

export const Raiz: React.FC = () => (
  <>
    {Object.keys(EPISODIOS)
      .filter((codigo) => EPISODIOS[codigo].planos)
      .map((codigo) => (
        <Composition
          key={codigo}
          id={codigo}
          component={Filme}
          fps={FPS}
          width={LARGURA}
          height={ALTURA}
          durationInFrames={300}
          defaultProps={{ codigo, audio: true, legenda: true } as PropsFilme}
          calculateMetadata={({ props }) => {
            const ep = EPISODIOS[props.codigo];
            const linha = resolverLinha(ep.roteiro, ep.tempos);
            const planos = resolverPlanos(ep.planos, linha, (clipes as Record<string, Record<string, number>>)[props.codigo] ?? {});
            return { durationInFrames: linha.duracao, props: { ...props, linha, planos } };
          }}
        />
      ))}
    {Object.keys(EPISODIOS).map((codigo) => (
      <Composition
        key={`${codigo}-desenho`}
        id={`${codigo}-desenho`}
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
    <Still id="Capa" component={Capa} width={1080} height={1920} defaultProps={{ codigo: "ep01", imagem: "p01-espelho", linhas: ["POR QUE O PADRE", "MUDA DE COR?"] } as PropsCapa} />
    <Still id="Marca" component={PranchaMarca} width={1800} height={2400} />
    <Still id="MarcaAvatar" component={MarcaAvatar} width={1080} height={1080} />
    <Still id="MarcaPerfil" component={MarcaPerfil} width={1080} height={1080} />
    <Still id="MarcaHorizontal" component={MarcaHorizontal} width={2400} height={800} defaultProps={{ claro: false }} />
    <Still id="MarcaEmpilhada" component={MarcaEmpilhada} width={1600} height={1600} defaultProps={{ claro: false }} />
    <Still id="MarcaSimbolo" component={MarcaSimbolo} width={1024} height={1024} defaultProps={{ cor: "#E9B949" }} />
    <Still id="Logos" component={PranchaLogos} width={1080} height={1920} />
    <Still id="Estilo" component={QuadrosEstilo} width={1080} height={1920} defaultProps={{ quadro: 1 } as PropsEstilo} />
    <Still id="TestePadre" component={TestePadre} width={1080} height={1920} />
    <Still id="TestePadreLP" component={TestePadreLP} width={1080} height={1920} />
  </>
);
