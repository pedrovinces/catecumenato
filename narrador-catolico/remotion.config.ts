import { Config } from "@remotion/cli/config";
import fs from "node:fs";
import path from "node:path";

// assets/ é a pasta pública: staticFile("audio/narracao.wav") aponta para assets/audio/narracao.wav
Config.setPublicDir(path.resolve(process.cwd(), "assets"));

// O download do Chrome feito pelo Remotion é bloqueado nesta rede; usamos o Chromium já instalado.
const chromium = [
  process.env.CHROMIUM,
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
].find((c) => c && fs.existsSync(c));
if (chromium) Config.setBrowserExecutable(chromium);

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
