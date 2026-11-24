import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PASTA_PUBLICA = path.join(RAIZ, "assets");

// O download do Chrome feito pelo Remotion é bloqueado nesta rede; usamos o Chromium já instalado.
// Em outra máquina, defina CHROMIUM=/caminho/do/chrome ou deixe vazio para o Remotion baixar o dele.
const candidatos = [
  process.env.CHROMIUM,
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
].filter(Boolean) as string[];
export const CHROMIUM = candidatos.find((c) => fs.existsSync(c)) ?? null;
