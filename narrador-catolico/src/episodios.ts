// Cada episódio = roteiro JSON + tempos das palavras + planos do filme. Para um episódio novo, acrescente os imports.
import roteiro01 from "../roteiro/ep01-cores-liturgicas.json";
import tempos01 from "../roteiro/ep01-timestamps.json";
import planos01 from "../roteiro/ep01-planos.json";

export const EPISODIOS: Record<string, { roteiro: unknown; tempos: unknown; planos?: unknown }> = {
  ep01: { roteiro: roteiro01, tempos: tempos01, planos: planos01 },
};
