import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import type { CenaQ, Linha } from "./lib/linha-do-tempo";
import { ProvedorCena } from "./components/motor/contexto";
import { Congela } from "./components/motor/Congela";
import { Legenda } from "./components/motor/Legenda";
import { SeloDeBloco } from "./components/motor/SeloDeBloco";
import { TextoTela } from "./components/motor/TextoTela";
import { QUADROS_WIPE, Wipe } from "./components/motor/Wipe";
import { cenaPara } from "./scenes";
import { carregarFontes } from "./lib/fontes";
import { CORES } from "./lib/paleta";

carregarFontes();

export type PropsEpisodio = {
  codigo: string;
  linha?: Linha;
  destaque?: "exata" | "clara";
  audio?: boolean; // narração na prévia (o mix final é feito no ffmpeg)
  legenda?: boolean;
};

const Sobreposicao: React.FC<{ cena: CenaQ; handle: string }> = ({ cena, handle }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {cena.selo && <SeloDeBloco f={f} cor={cena.cor} nome={cena.selo.cor} tempo={cena.selo.tempo} entrada={cena.wipe ? 2 : 6} />}
      <TextoTela textos={cena.textos} f={f} temSelo={!!cena.selo} cor={cena.cor} handle={handle} />
    </AbsoluteFill>
  );
};

const CenaRender: React.FC<{ cena: CenaQ; linha: Linha }> = ({ cena, linha }) => {
  const Comp = cenaPara(cena.tipo);
  return (
    <ProvedorCena cena={cena} linha={linha}>
      <AbsoluteFill style={{ backgroundColor: CORES[cena.cor] }}>
        <Congela janelas={cena.congelas} tempoReal={<Sobreposicao cena={cena} handle={linha.handle} />}>
          <Comp />
        </Congela>
      </AbsoluteFill>
    </ProvedorCena>
  );
};

export const Episodio: React.FC<PropsEpisodio> = ({ linha, destaque, audio = true, legenda = true }) => {
  if (!linha) return null;
  const q = (s: number) => Math.round(s * linha.fps);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {linha.cenas.map((c) => (
        <Sequence key={c.id} from={c.inicio} durationInFrames={c.duracao} name={c.id}>
          <CenaRender cena={c} linha={linha} />
        </Sequence>
      ))}
      {linha.cenas
        .filter((c) => c.wipe)
        .map((c) => (
          <Sequence key={`wipe-${c.id}`} from={c.inicio - QUADROS_WIPE} durationInFrames={QUADROS_WIPE} name={`wipe ${c.id}`}>
            <Wipe cor={c.cor} />
          </Sequence>
        ))}
      {legenda && <Legenda linha={linha} destaque={destaque} />}
      {audio &&
        linha.narracao.segmentos.map((s, i) => (
          <Sequence key={`voz-${i}`} from={q(s.destino)} durationInFrames={q(s.origemFim - s.origemIni) + 1} name={`voz ${i}`}>
            <Audio src={staticFile(linha.narracao.arquivo)} startFrom={q(s.origemIni)} endAt={q(s.origemFim)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  );
};
