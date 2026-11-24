#!/usr/bin/env python3
"""Faixa-guia robótica da narração (eSpeak NG + MBROLA) com o tempo exato de cada palavra.

Uso: python3 -I scripts/guia_espeak.py roteiro/ep01-cores-liturgicas.json

Gera:
  assets/<audio.guia>                 WAV 48 kHz mono
  roteiro/<slug>-timestamps.json      tempos de cada palavra (mesmo formato do Whisper alinhado)

O tempo vem dos eventos de marca do próprio sintetizador (uma <mark/> SSML antes de cada palavra),
então a sincronização da guia é exata. Serve para ensaiar o ritmo até a narração real chegar.
"""
import ctypes
import datetime
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import wave
from xml.sax.saxutils import escape

RAIZ = pathlib.Path(__file__).resolve().parent.parent
VOZ = "mb-br3"          # masculina, timbre médio-grave
TAXA_PPM = 162          # calibrado: resulta em ~157 ppm descontadas as pausas marcadas
INTERVALO_CENAS = 0.55  # silêncio entre o fim de uma cena e o começo da seguinte
SILENCIO_INICIAL = 0.35

PAUSAS = {"pausa": 0.4, "pausa longa": 0.8}
DIRECOES = {
    "seco": 'pitch="-12%" rate="92%"',
    "sorrindo": 'pitch="+6%"',
    "sussurrando": 'volume="55%" rate="88%" pitch="-8%"',
}


def tokenizar(locucao: str):
    """Mesma regra de src/lib/tokens.ts: marcações [..] e (..) saem; o resto é separado por espaço."""
    tokens = []
    direcao = None
    for parte in re.split(r"(\[[^\]]*\]|\([^)]*\))", locucao):
        if not parte.strip():
            continue
        if parte.startswith("["):
            if tokens:
                tokens[-1]["pausa"] = PAUSAS.get(parte[1:-1].strip().lower(), 0.4)
            direcao = None
        elif parte.startswith("("):
            direcao = parte[1:-1].strip().lower()
        else:
            for w in parte.split():
                tokens.append({"texto": w, "pausa": 0.0, "direcao": direcao})
    return tokens


def normal(p: str) -> str:
    return re.sub(r"[^\wÀ-ÿ]", "", p).lower()


def falavel(texto: str, pronuncia: dict) -> str:
    nucleo = re.sub(r"^[^\wÀ-ÿ]+|[^\wÀ-ÿ]+$", "", texto)
    for k, v in pronuncia.items():
        if normal(k) == normal(nucleo):
            texto = texto.replace(nucleo, v)
            break
    if texto.upper() == texto and any(c.isalpha() for c in texto):
        texto = texto.lower()  # caixa alta é ênfase, não sigla
    return texto


def ssml_da_cena(tokens, pronuncia):
    partes = ["<speak>"]
    aberta = None
    for i, t in enumerate(tokens):
        if t["direcao"] != aberta:
            if aberta:
                partes.append("</prosody>")
            if t["direcao"] in DIRECOES:
                partes.append(f"<prosody {DIRECOES[t['direcao']]}>")
                aberta = t["direcao"]
            else:
                aberta = None
        enfase = t["texto"].upper() == t["texto"] and len(normal(t["texto"])) > 2
        palavra = escape(falavel(t["texto"], pronuncia))
        if enfase:
            palavra = f"<emphasis>{palavra}</emphasis>"
        partes.append(f'<mark name="w{i}"/>{palavra} ')
        if t["pausa"] or i == len(tokens) - 1:
            partes.append(f'<mark name="f{i}"/>')
            if aberta:
                partes.append("</prosody>")
                aberta = None
            if t["pausa"]:
                partes.append(f'<break time="{int(t["pausa"] * 1000)}ms"/>')
        elif re.search(r"[.?!]$", t["texto"]):
            # pausa natural de fim de frase; sem um <break> explícito o eSpeak engole a marca seguinte
            partes.append('<break time="260ms"/>')
        elif re.search(r"[:;]$", t["texto"]):
            partes.append('<break time="160ms"/>')
    if aberta:
        partes.append("</prosody>")
    partes.append("</speak>")
    return "".join(partes)


class Evento(ctypes.Structure):
    _fields_ = [
        ("type", ctypes.c_int),
        ("unique_identifier", ctypes.c_uint),
        ("text_position", ctypes.c_int),
        ("length", ctypes.c_int),
        ("audio_position", ctypes.c_int),
        ("sample", ctypes.c_int),
        ("user_data", ctypes.c_void_p),
        ("id", ctypes.c_void_p),
    ]


CALLBACK = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.POINTER(Evento))
EV_FIM_LISTA, EV_MARCA = 0, 3


class Sintetizador:
    def __init__(self):
        self.lib = ctypes.CDLL("libespeak-ng.so.1")
        self.taxa = self.lib.espeak_Initialize(2, 0, None, 0)  # AUDIO_OUTPUT_SYNCHRONOUS
        if self.lib.espeak_SetVoiceByName(VOZ.encode()) != 0:
            raise SystemExit(f"voz {VOZ} indisponível")
        self.lib.espeak_SetParameter(1, TAXA_PPM, 0)  # espeakRATE
        self._cb = CALLBACK(self._recebe)
        self.lib.espeak_SetSynthCallback(self._cb)

    def _recebe(self, wav, n, eventos):
        if n > 0 and wav:
            self.amostras.extend(wav[:n])
        i = 0
        while eventos[i].type != EV_FIM_LISTA:
            ev = eventos[i]
            if ev.type == EV_MARCA and ev.id:
                nome = ctypes.cast(ev.id, ctypes.c_char_p).value.decode()
                self.marcas[nome] = ev.audio_position / 1000.0
            i += 1
        return 0

    def falar(self, ssml: str):
        self.amostras, self.marcas = [], {}
        dados = ssml.encode("utf-8")
        flags = 1 | 0x10  # espeakCHARS_UTF8 | espeakSSML
        self.lib.espeak_Synth(dados, len(dados) + 1, 0, 1, 0, flags, None, None)
        self.lib.espeak_Synchronize()
        return list(self.amostras), dict(self.marcas)


def main():
    caminho = RAIZ / (sys.argv[1] if len(sys.argv) > 1 else "roteiro/ep01-cores-liturgicas.json")
    roteiro = json.loads(caminho.read_text(encoding="utf-8"))
    pronuncia = roteiro.get("pronuncia", {})
    sint = Sintetizador()

    # o MBROLA br3 sai a 22050 Hz pela biblioteca, mas confirmamos pela razão amostras/tempo
    audio = [0] * int(SILENCIO_INICIAL * sint.taxa)
    palavras, cenas = [], []
    for cena in roteiro["cenas"]:
        tokens = tokenizar(cena["locucao"])
        amostras, marcas = sint.falar(ssml_da_cena(tokens, pronuncia))
        # corta silêncio do fim da síntese (mantém 60 ms)
        fim_util = len(amostras)
        while fim_util > 0 and abs(amostras[fim_util - 1]) < 200:
            fim_util -= 1
        amostras = amostras[: min(len(amostras), fim_util + int(0.06 * sint.taxa))]
        base = len(audio) / sint.taxa
        dur = len(amostras) / sint.taxa
        for i, t in enumerate(tokens):
            ini = marcas.get(f"w{i}")
            if f"f{i}" in marcas:
                fim = marcas[f"f{i}"]
            elif f"w{i + 1}" in marcas:
                fim = marcas[f"w{i + 1}"]
            else:
                fim = dur
            palavras.append({
                "cena": cena["id"], "i": i, "texto": t["texto"],
                "inicio": round(base + ini, 3), "fim": round(base + min(fim, dur), 3),
            })
        cenas.append({"id": cena["id"], "inicio": round(base + marcas.get("w0", 0), 3), "fim": round(base + dur, 3)})
        audio.extend(amostras)
        audio.extend([0] * int(INTERVALO_CENAS * sint.taxa))

    destino = RAIZ / "assets" / roteiro["audio"]["guia"]
    destino.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        bruto = pathlib.Path(tmp) / "bruto.wav"
        with wave.open(str(bruto), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(sint.taxa)
            w.writeframes(b"".join(int(s).to_bytes(2, "little", signed=True) for s in audio))
        subprocess.run([
            "ffmpeg", "-y", "-v", "error", "-i", str(bruto),
            "-af", "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=11",
            "-ar", "48000", "-ac", "1", str(destino),
        ], check=True)

    total = len(audio) / sint.taxa
    falado = sum(p["fim"] - p["inicio"] for p in palavras)
    saida = {
        "fonte": "guia-espeak",
        "voz": VOZ,
        "gerado": datetime.datetime.now().isoformat(timespec="seconds"),
        "duracao": round(total, 3),
        "cenas": cenas,
        "palavras": palavras,
    }
    ts = RAIZ / "roteiro" / f"{roteiro['codigo']}-timestamps.json"
    ts.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"guia: {destino.relative_to(RAIZ)}  {total:.1f} s, {len(palavras)} palavras, "
          f"{len(palavras) / falado * 60:.0f} ppm durante a fala")
    for c in cenas:
        print(f"  {c['id']:12s} {c['inicio']:6.2f} a {c['fim']:6.2f}  ({c['fim'] - c['inicio']:.1f} s)")


if __name__ == "__main__":
    main()
