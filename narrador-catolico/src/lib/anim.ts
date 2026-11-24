// Utilitários de animação no estilo cartoon de TV: poses em degraus, pop com sobra, tremor.
import { Easing, interpolate, random } from "remotion";

/** Quantiza o tempo em degraus de n quadros (animação "em dois" ou "em três"). */
export const degrau = (f: number, n = 2) => Math.floor(f / n) * n;

/** Progresso 0..1 entre a e a+dur, com degraus de n quadros (troca seca de pose). */
export const trocaSeca = (f: number, a: number, dur = 3, n = 1) =>
  interpolate(degrau(f, n), [a, a + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** Escala de entrada pop: 0 → 110% → 100%. */
export const pop = (f: number, a: number, dur = 8) =>
  interpolate(f, [a, a + dur * 0.6, a + dur], [0, 1.1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

export const suave = (f: number, a: number, b: number, de = 0, para = 1, easing = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [de, para], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

/** Tremor de câmera determinístico (mesmo resultado em todo render). */
export const tremor = (f: number, intensidade: number, semente = "t") => ({
  x: (random(`${semente}x${degrau(f, 2)}`) - 0.5) * 2 * intensidade,
  y: (random(`${semente}y${degrau(f, 2)}`) - 0.5) * 2 * intensidade,
});

/** Quantos quadros desde o evento (negativo se ainda não aconteceu; Infinity negativo se não existe). */
export const desde = (f: number, ev: number | undefined) => (ev === undefined ? -Infinity : f - ev);

/** Interpolação linear simples entre números. */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
