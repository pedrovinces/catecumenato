// Cada episódio = roteiro JSON + tempos das palavras + planos do filme. Para um episódio novo, acrescente os imports.
import roteiro01 from "../roteiro/ep01-cores-liturgicas.json";
import tempos01 from "../roteiro/ep01-timestamps.json";
import planos01 from "../roteiro/ep01-planos.json";
import roteiro02 from "../roteiro/ep02-papa-nunca-erra.json";
import tempos02 from "../roteiro/ep02-timestamps.json";
import planos02 from "../roteiro/ep02-planos.json";
import roteiro03 from "../roteiro/ep03-a-culpa-e-da-serpente.json";
import tempos03 from "../roteiro/ep03-timestamps.json";
import planos03 from "../roteiro/ep03-planos.json";

export const EPISODIOS: Record<string, { roteiro: unknown; tempos: unknown; planos?: unknown }> = {
  ep01: { roteiro: roteiro01, tempos: tempos01, planos: planos01 },
  ep02: { roteiro: roteiro02, tempos: tempos02, planos: planos02 },
  ep03: { roteiro: roteiro03, tempos: tempos03, planos: planos03 },
};
