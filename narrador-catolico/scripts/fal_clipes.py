#!/usr/bin/env python3
"""Anima as imagens do episódio com image-to-video no fal.ai (fila assíncrona).

Uso:
  python3 -I scripts/fal_clipes.py ep01 --so p04-sobrancelha     # um clipe (teste)
  python3 -I scripts/fal_clipes.py ep01                          # todos os que ainda não existem
  python3 -I scripts/fal_clipes.py ep01 --refazer p12-medalha    # gera de novo (substitui)
  python3 -I scripts/fal_clipes.py ep01 --saldo                  # mostra o saldo e sai

Lê roteiro/<codigo>-clipes.json (modelo, estilo, negativo, clipes[id, duracao, prompt, fim opcional]);
a imagem de partida é assets/img/<codigo>/<id>.png. O vídeo sai em assets/video/<codigo>/<id>.mp4
e o registro do pedido (request_id, custo estimado, url) em roteiro/<codigo>-clipes-registro.json.

A chave do fal.ai não fica no código: o proxy do ambiente a injeta nos pedidos a queue.fal.run e
api.fal.ai. Fora deste ambiente, defina FAL_KEY.
"""
import base64
import io
import json
import os
import pathlib
import sys
import time

import requests
from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FILA = "https://queue.fal.run"
API = "https://api.fal.ai/v1"
PRECO_TETO = 0.14  # US$/s, o maior dos dois preços publicados para o Kling 3 (página: 0,112 sem áudio)


def cabecalhos() -> dict:
    h = {"Content-Type": "application/json"}
    chave = os.environ.get("FAL_KEY")
    h["Authorization"] = f"Key {chave or 'proxy-injected'}"
    return h


def saldo() -> float | None:
    try:
        r = requests.get(f"{API}/account/billing", params={"expand": "credits"}, headers=cabecalhos(), timeout=30)
        r.raise_for_status()
        return float(r.json()["credits"]["current_balance"])
    except Exception as e:  # a consulta de saldo é auxiliar; não impede a geração
        print(f"  (não consegui ler o saldo: {e})")
        return None


def data_uri(caminho: pathlib.Path) -> str:
    img = Image.open(caminho).convert("RGB")
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=93, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def enviar(modelo: str, corpo: dict) -> dict:
    r = requests.post(f"{FILA}/{modelo}", headers=cabecalhos(), json=corpo, timeout=120)
    if r.status_code >= 400:
        raise RuntimeError(f"envio recusado ({r.status_code}): {r.text[:800]}")
    return r.json()


def acompanhar(pedido: dict, rotulo: str, limite_s=3600) -> dict:
    t0 = time.time()
    ultimo = None
    while time.time() - t0 < limite_s:
        r = requests.get(pedido["status_url"], headers=cabecalhos(), timeout=60)
        r.raise_for_status()
        st = r.json().get("status")
        if st != ultimo:
            print(f"  {rotulo}: {st} ({time.time() - t0:.0f} s)", flush=True)
            ultimo = st
        if st == "COMPLETED":
            res = requests.get(pedido["response_url"], headers=cabecalhos(), timeout=120)
            if res.status_code >= 400:
                raise RuntimeError(f"{rotulo}: falhou ({res.status_code}): {res.text[:800]}")
            return res.json()
        time.sleep(8)
    raise TimeoutError(f"{rotulo}: passou de {limite_s} s na fila")


def main():
    args = sys.argv[1:]
    codigo = args[0] if args and not args[0].startswith("--") else "ep01"
    if "--saldo" in args:
        print(f"saldo: US$ {saldo()}")
        return
    plano = json.loads((RAIZ / "roteiro" / f"{codigo}-clipes.json").read_text(encoding="utf-8"))
    reg_arq = RAIZ / "roteiro" / f"{codigo}-clipes-registro.json"
    registro = json.loads(reg_arq.read_text(encoding="utf-8")) if reg_arq.exists() else {}
    pasta = RAIZ / "assets" / "video" / codigo
    pasta.mkdir(parents=True, exist_ok=True)

    def ids_apos(flag):
        if flag not in args:
            return None
        i = args.index(flag) + 1
        return set(args[i].split(",")) if i < len(args) else set()

    so, refazer = ids_apos("--so"), ids_apos("--refazer") or set()
    fila = []
    for c in plano["clipes"]:
        if so is not None and c["id"] not in so and c["id"] not in refazer:
            continue
        if (pasta / f"{c['id']}.mp4").exists() and c["id"] not in refazer:
            continue
        fila.append(c)
    if not fila:
        print("nada a gerar")
        return

    def pendente(c):
        a = registro.get(c["id"], {})
        return a.get("request_id") and "url" not in a and "erro" not in a and c["id"] not in refazer

    novos = [c for c in fila if not pendente(c)]
    custo = sum(c["duracao"] for c in novos) * PRECO_TETO
    s = saldo()
    print(f"{len(novos)} clipe(s) novos, {sum(c['duracao'] for c in novos)} s, até US$ {custo:.2f}; {len(fila) - len(novos)} retomado(s); saldo: US$ {s}")
    if s is not None and custo > s:
        sys.exit("saldo insuficiente para este lote; nada foi enviado")

    pedidos = []
    for c in fila:
        anterior = registro.get(c["id"], {})
        if anterior.get("request_id") and "url" not in anterior and "erro" not in anterior and c["id"] not in refazer:
            # pedido já enviado e ainda sem resultado: retoma o acompanhamento, não paga de novo
            app = "/".join(plano["modelo"].split("/")[:2])
            base = f"{FILA}/{app}/requests/{anterior['request_id']}"
            print(f"retomando {c['id']}: {anterior['request_id']}", flush=True)
            pedidos.append((c, {"status_url": f"{base}/status", "response_url": base}))
            continue
        img = RAIZ / "assets" / "img" / codigo / f"{c['id']}.png"
        corpo = {
            "prompt": f"{c['prompt']} {plano['estilo']}",
            "start_image_url": data_uri(img),
            "duration": str(c["duracao"]),
            "generate_audio": False,
            "negative_prompt": plano["negativo"],
            "cfg_scale": c.get("cfg", 0.5),
        }
        if c.get("fim"):  # imagem final: o modelo anima o caminho entre a imagem inicial e esta
            corpo["end_image_url"] = data_uri(RAIZ / "assets" / "img" / codigo / f"{c['fim']}.png")
        p = enviar(plano["modelo"], corpo)
        print(f"enviado {c['id']}: {p.get('request_id')}", flush=True)
        registro[c["id"]] = {"request_id": p.get("request_id"), "modelo": plano["modelo"], "duracao": c["duracao"], "prompt": c["prompt"], "enviado": time.strftime("%Y-%m-%d %H:%M:%S")}
        reg_arq.write_text(json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8")
        pedidos.append((c, p))

    falhas = []
    for c, p in pedidos:
        try:
            res = acompanhar(p, c["id"])
            url = res["video"]["url"]
            destino = pasta / f"{c['id']}.mp4"
            with requests.get(url, stream=True, timeout=300) as r:
                r.raise_for_status()
                with open(destino, "wb") as f:
                    for bloco in r.iter_content(1 << 20):
                        f.write(bloco)
            registro[c["id"]].update({"url": url, "arquivo": str(destino.relative_to(RAIZ)), "concluido": time.strftime("%Y-%m-%d %H:%M:%S")})
            print(f"  ok {c['id']} -> {destino.relative_to(RAIZ)} ({destino.stat().st_size / 1e6:.1f} MB)", flush=True)
        except Exception as e:
            falhas.append(c["id"])
            registro[c["id"]]["erro"] = str(e)[:800]
            print(f"  ERRO {c['id']}: {e}", flush=True)
        reg_arq.write_text(json.dumps(registro, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"saldo depois: US$ {saldo()}")
    if falhas:
        sys.exit(f"falharam: {', '.join(falhas)}")


if __name__ == "__main__":
    main()
