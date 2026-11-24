// Cena 7 (quadro-símbolo): rosa no Gaudete e no Laetare; barra em 75%; porta da igreja; óculos pixelados.
import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";
import { useCena } from "../components/motor/contexto";
import { Camera, Tela } from "../components/motor/Camera";
import { Padre } from "../components/Padre";
import { Fiel } from "../components/Fiel";
import { Ambiente, PortaIgreja } from "../components/cenario";
import { BarraDeCarregamento } from "../components/BarraDeCarregamento";
import { Calendario } from "../components/Calendario";
import { OculosMeme } from "../components/OculosMeme";
import { Balao } from "../components/Balao";
import { CASULA, CORES } from "../lib/paleta";
import { tremor } from "../lib/anim";

export const Rosa: React.FC = () => {
  const { f, ev, desde, passou } = useCena();

  if (passou("porta")) {
    const dOc = desde("oculos");
    const cruzando = dOc >= 2 ? interpolate(dOc, [2, 26], [0, 1], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) }) : 0;
    const t = dOc >= 0 ? tremor(f, interpolate(dOc, [0, 30], [9, 2], { extrapolateRight: "clamp" })) : { x: 0, y: 0 };
    const zoom = dOc >= 0 ? interpolate(dOc, [0, 6], [1, 1.18], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }) : 1;
    const balaoVisivel = dOc < 0;
    return (
      <Camera zoom={zoom} foco={[430, 1000]} desloc={[t.x, t.y]}>
        <Tela>
          <PortaIgreja x={430} y={1560} largura={560} altura={1060} />
          <Fiel x={790} y={1720} escala={0.92} tipo="senhora" bracos={dOc >= 0 ? "baixo" : "cochicho"} expressao={dOc >= 0 ? { olhos: "arregalado", boca: "O", sobrancelhas: "alta" } : { olhos: "normal", boca: "preocupada", olhar: [8, 0] }} />
          <Fiel x={985} y={1740} escala={0.98} tipo="homem" espelhado expressao={dOc >= 0 ? { olhos: "arregalado", boca: "O", sobrancelhas: "alta" } : { olhos: "normal", boca: "reta", olhar: [-8, 0], sobrancelhas: "franzida" }} />
          <Padre
            x={400}
            y={1750}
            escala={1.0}
            casula={CASULA.rosa}
            pose={dOc >= 2 ? "confiante" : "cumprimentando"}
            poseAnterior={dOc >= 2 ? "cumprimentando" : undefined}
            progresso={cruzando}
            expressao={dOc >= 0 ? { boca: "confiante", sobrancelhas: "neutra" } : undefined}
            oculos={dOc >= -15 ? <OculosMeme f={dOc} /> : undefined}
          />
          {balaoVisivel && (
            <>
              <Balao x={690} y={720} largura={360} altura={110} texto="PERDEU APOSTA?" ponta={[760, 990]} tamanhoFonte={38} />
              <Balao x={740} y={870} largura={360} altura={110} texto="MUDOU DE TIME?" ponta={[930, 1010]} tamanhoFonte={38} />
            </>
          )}
        </Tela>
      </Camera>
    );
  }

  if (passou("loading")) {
    return (
      <>
      <Tela>
        <Ambiente cor={CORES.rosa} piso={1500} />
        </Tela>
        <AbsoluteFill><BarraDeCarregamento x={160} y={800} largura={760} f={desde("loading")} de={25} alvo={75} rotulo="PREPARANDO O NATAL..." cor="#E26C9C" duracao={20} /></AbsoluteFill>
      </>
    );
  }

  if (passou("data1")) {
    const segundo = passou("data2");
    return (
      <Tela>
        <Ambiente cor={CORES.rosa} piso={1700} />
        <Calendario
          x={250}
          y={650}
          largura={580}
          ano={segundo ? 2027 : 2026}
          mes={segundo ? 3 : 12}
          corTopo={segundo ? CORES.roxo : CORES.roxo}
          circulados={[{ dia: segundo ? 7 : 13, f: desde(segundo ? "data2" : "data1") }]}
        />
      </Tela>
    );
  }

  // abertura do bloco: o Padre de rosa, "tchã-rã"
  return (
    <Camera zoom={f > 20 ? 1.12 : 1} foco={[540, 1100]}>
      <Tela>
        <Ambiente cor={CORES.rosa} piso={1600} />
        <Padre x={540} y={1740} escala={1.05} casula={CASULA.rosa} pose="tada" />
      </Tela>
    </Camera>
  );
};
