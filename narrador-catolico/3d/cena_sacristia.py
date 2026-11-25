"""Cena de teste 3D: o Padre na sacristia, armário de paramentos aberto, luz entrando pela janela.

Uso: python3 -I 3d/cena_sacristia.py [saida.png] [percentual]
"""
import math
import pathlib
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import base as B  # noqa: E402
import padre3d as P  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def sala():
    reboco = B.material("reboco", (0.78, 0.70, 0.57), rugosidade=0.9, ruido_cor=0.25, relevo=0.15, escala_ruido=8)
    madeira = B.material("madeira", (0.24, 0.13, 0.06), rugosidade=0.45, ruido_cor=0.3, relevo=0.05, escala_ruido=30)
    madeira_escura = B.material("madeira_escura", (0.10, 0.055, 0.03), rugosidade=0.5, ruido_cor=0.2)
    piso = B.material_tabuas("piso")
    B.caixa("piso", (0, 1, -0.05), (8, 8, 0.1), piso)
    B.caixa("parede_fundo", (0, 2.3, 2.5), (8, 0.2, 5), reboco)
    B.caixa("rodape", (0, 2.18, 0.08), (8, 0.04, 0.16), madeira)
    # parede esquerda com janela (vão de y -0.2 a 1.0, z 1.0 a 2.7)
    x = -2.2
    B.caixa("pe_a", (x, -1.9, 2.5), (0.2, 3.4, 5), reboco)
    B.caixa("pe_b", (x, 1.75, 2.5), (0.2, 1.5, 5), reboco)
    B.caixa("pe_baixo", (x, 0.4, 0.5), (0.2, 1.2, 1.0), reboco)
    B.caixa("pe_cima", (x, 0.4, 3.85), (0.2, 1.2, 2.3), reboco)
    for z in (1.0, 2.7):
        B.caixa(f"moldura_h{z}", (x + 0.05, 0.4, z), (0.14, 1.24, 0.08), madeira)
    for y in (-0.2, 0.4, 1.0):
        B.caixa(f"moldura_v{y}", (x + 0.05, y, 1.85), (0.14, 0.06, 1.74), madeira)
    B.caixa("travessa", (x + 0.05, 0.4, 1.85), (0.14, 1.2, 0.05), madeira)
    # armário de paramentos aberto
    ax, ay = 1.15, 1.85
    B.caixa("arm_fundo", (ax, ay + 0.3, 1.15), (1.7, 0.05, 2.3), madeira_escura)
    B.caixa("arm_lado_e", (ax - 0.85, ay, 1.15), (0.06, 0.65, 2.3), madeira, chanfro=0.01)
    B.caixa("arm_lado_d", (ax + 0.85, ay, 1.15), (0.06, 0.65, 2.3), madeira, chanfro=0.01)
    B.caixa("arm_topo", (ax, ay, 2.32), (1.76, 0.68, 0.06), madeira, chanfro=0.01)
    B.caixa("arm_base", (ax, ay, 0.06), (1.76, 0.68, 0.12), madeira, chanfro=0.01)
    porta = B.caixa("arm_porta", (ax + 0.85 + 0.30, ay - 0.36, 1.15), (0.85, 0.05, 2.2), madeira, chanfro=0.01)
    porta.rotation_euler = (0, 0, math.radians(52))
    ouro = B.material("barra", (0.7, 0.55, 0.3), rugosidade=0.3, metal=0.9)
    B.tubo("arm_barra", (ax - 0.8, ay + 0.05, 2.12), (ax + 0.8, ay + 0.05, 2.12), 0.012, ouro)
    # casulas penduradas (roxo, branco, vermelho, rosa): geometria em escala 1, objeto reduzido e pendurado
    mats = P.materiais()
    esc = (0.42, 0.22, 0.42)
    for k, cor in enumerate(["roxo", "branco", "vermelho", "rosa"]):
        cx = ax - 0.6 + k * 0.4
        for o in P.casula(cor, mats, nome=f"cab_{cor}"):
            o.scale = esc
            o.location = (cx, ay + 0.08, 2.07 - 1.47 * esc[2])
        B.curva(f"cabide_{cor}", [(cx - 0.12, ay + 0.06, 2.03), (cx, ay + 0.06, 2.09), (cx + 0.12, ay + 0.06, 2.03)], 0.006, ouro)
    return reboco


def montar(saida, percentual=50):
    B.limpar()
    sala()
    P.padre("verde", local=(-0.45, 0.2, 0), giro=12, pose="bracos_baixos", sorriso=0.8)
    # luz: sol entrando pela janela, preenchimento frio e contraluz
    B.luz("SUN", "sol", (-4, 0.2, 4), 3.2, cor=(1.0, 0.86, 0.66), alvo=(0.2, 0.6, 0.4), angulo=1.5)
    B.luz("AREA", "preenchimento", (2.2, -3.2, 2.4), 260, cor=(0.78, 0.86, 1.0), tamanho=3.0, alvo=(-0.3, 0.3, 1.2))
    B.luz("AREA", "recorte", (1.2, 2.0, 2.6), 120, cor=(1.0, 0.9, 0.75), tamanho=1.2, alvo=(-0.35, 0.25, 1.5))
    B.mundo((0.035, 0.032, 0.03), 1.0)
    B.volume_ar((0, 0.5, 2.0), (4.3, 4.0, 4.0), densidade=0.018)
    B.camera((0.45, -4.3, 1.35), (0.0, 0.8, 1.15), focal=32, abertura=3.5, foco=4.5)
    B.configurar_render(saida, amostras=96, percentual=percentual)
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"render: {saida} em {time.time() - t:.0f} s")


if __name__ == "__main__":
    saida = sys.argv[1] if len(sys.argv) > 1 else str(RAIZ / "out" / "3d" / "teste-sacristia.png")
    pathlib.Path(saida).parent.mkdir(parents=True, exist_ok=True)
    montar(saida, int(sys.argv[2]) if len(sys.argv) > 2 else 50)
