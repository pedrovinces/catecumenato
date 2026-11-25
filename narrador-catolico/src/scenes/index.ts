import type React from "react";
import { Abertura } from "./Abertura";
import { Verde } from "./Verde";
import { Roxo } from "./Roxo";
import { Rosa } from "./Rosa";
import { Provisoria } from "./Provisoria";

// tipo da cena no JSON → componente. Cenas sem componente próprio usam a provisória.
export const CENAS: Record<string, React.FC> = {
  abertura: Abertura,
  verde: Verde,
  roxo: Roxo,
  rosa: Rosa,
};
export const cenaPara = (tipo: string): React.FC => CENAS[tipo] ?? Provisoria;
