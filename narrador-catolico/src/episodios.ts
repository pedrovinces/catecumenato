// Cada episódio = roteiro JSON + tempos das palavras. Para um episódio novo, acrescente as duas linhas de import.
import roteiro01 from "../roteiro/ep01-cores-liturgicas.json";
import tempos01 from "../roteiro/ep01-timestamps.json";

export const EPISODIOS: Record<string, { roteiro: unknown; tempos: unknown }> = {
  ep01: { roteiro: roteiro01, tempos: tempos01 },
};
