// Cena 4: coroa do Advento, primeira vela; Padre na arquibancada; sino; giro para a estola; barra em 25%.
import React from "react";
import { AbsoluteFill } from "remotion";
import { useCena } from "../components/motor/contexto";
import { Camera, Tela } from "../components/motor/Camera";
import { Padre, type NomePose } from "../components/Padre";
import { Ambiente, Arquibancada, CoroaAdvento, Manjedoura, Mesa, SinoIgreja } from "../components/cenario";
import { BarraDeCarregamento } from "../components/BarraDeCarregamento";
import { CASULA, CORES, escurecer } from "../lib/paleta";
import { degrau } from "../lib/anim";

// giro de 6 quadros: achata, espelha e volta (troca de figurino no meio)
const GIRO = [1, 0.45, -0.3, -1, -0.35, 0.5, 1];

export const Roxo: React.FC = () => {
  const { f, ev, desde, passou, pal } = useCena();

  if (passou("loading")) {
    return (
      <>
      <Tela>
        <Ambiente cor={CORES.roxo} piso={1500} />
        <Manjedoura x={540} y={1490} escala={1.2} />
        </Tela>
        <AbsoluteFill><BarraDeCarregamento x={160} y={760} largura={760} f={desde("loading")} alvo={25} rotulo="PREPARANDO O NATAL..." cor="#9C64C9" /></AbsoluteFill>
      </>
    );
  }

  if (passou("torcedor")) {
    const dSino = desde("sino");
    const giro = dSino >= 10 ? GIRO[Math.min(GIRO.length - 1, dSino - 10)] : 1;
    const trocou = dSino >= 13;
    let pose: NomePose = degrau(f, 6) % 12 === 0 ? "torcedor" : "torcedor2";
    if (dSino >= 0) pose = "parado";
    if (trocou) pose = "solene";
    return (
      <Camera zoom={1.04}>
        <Tela>
          <Arquibancada cor={CORES.roxo} f={dSino >= 0 ? (ev("sino") ?? f) : f} />
          <g transform={`translate(540 0) scale(${giro} 1) translate(-540 0)`}>
            <Padre
              x={540}
              y={1780}
              escala={1.02}
              casula={null}
              estola={trocou ? CASULA.roxo : null}
              cachecol={trocou ? null : CASULA.roxo}
              pose={pose}
              adereco={dSino >= 0 ? null : "corneta"}
              expressao={dSino >= 0 && !trocou ? { olhos: "arregalado", sobrancelhas: "alta", boca: "reta", olhar: [0, 0] } : undefined}
            />
          </g>
          <SinoIgreja x={860} y={330} f={dSino} escala={0.8} />
        </Tela>
      </Camera>
    );
  }

  // coroa do Advento: geral, depois close na coroa; a primeira vela acende em "começa"
  const close = f >= pal("penitência") - 2;
  const dVela = desde("vela");
  return (
    <Camera zoom={close ? 1.55 : 1} foco={[700, 1220]}>
      <Tela>
        <Ambiente cor={CORES.roxo} piso={1400} />
        <rect x={600} y={560} width={300} height={420} rx={20} fill={escurecer(CORES.roxo, 0.25)} />
        <Mesa x={740} y={1330} largura={560} />
        <CoroaAdvento x={740} y={1260} escala={0.82} acesas={dVela >= 3 ? 1 : 0} f={f} faisca={dVela} />
        <Padre x={250} y={1700} escala={0.92} casula={CASULA.roxo} pose="solene" />
      </Tela>
    </Camera>
  );
};
