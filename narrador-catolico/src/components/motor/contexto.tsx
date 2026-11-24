import React, { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import type { CenaQ, Linha } from "../../lib/linha-do-tempo";
import { CORES } from "../../lib/paleta";
import { acharFrase } from "../../lib/tokens";

type Ctx = { cena: CenaQ; linha: Linha };
const Contexto = createContext<Ctx | null>(null);

export const ProvedorCena: React.FC<Ctx & { children: React.ReactNode }> = ({ cena, linha, children }) => (
  <Contexto.Provider value={{ cena, linha }}>{children}</Contexto.Provider>
);

/** Dentro de uma cena: quadro local (congelado quando a cena congela) e acesso aos eventos do roteiro. */
export const useCena = () => {
  const c = useContext(Contexto);
  if (!c) throw new Error("useCena fora de uma cena");
  const f = useCurrentFrame();
  const { cena } = c;
  /** quadro do evento (n-ésima ocorrência) ou undefined */
  const ev = (nome: string, n = 0): number | undefined => cena.eventos[nome]?.[n];
  /** quadros desde o evento; -Infinity se o evento não existe ou ainda não aconteceu */
  const desde = (nome: string, n = 0) => {
    const e = ev(nome, n);
    return e === undefined ? -Infinity : f - e;
  };
  /** true a partir do evento */
  const passou = (nome: string, n = 0) => desde(nome, n) >= 0;
  /** índice do último evento da lista `nomes` que já aconteceu (-1 se nenhum): útil para planos */
  const plano = (nomes: string[]) => {
    let idx = -1;
    nomes.forEach((n, i) => {
      if (passou(n)) idx = i;
    });
    return idx;
  };
  /** quadro em que a frase começa a ser dita (para cortes internos ancorados na fala) */
  const pal = (frase: string, ocorrencia = 1): number => {
    const i = acharFrase(cena.palavras, frase, ocorrencia);
    if (i < 0) throw new Error(`cena "${cena.id}": "${frase}" não está na locução`);
    return cena.palavras[i].inicio;
  };
  return { ...c, f, ev, desde, passou, plano, pal, fundo: CORES[cena.cor] };
};
