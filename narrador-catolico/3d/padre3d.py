"""O Padre em 3D: ~1,74 m, cerca de 50 anos, cabelo grisalho ralo, rosto redondo, sorriso fácil.
Alva branca e casula na cor litúrgica com galão dourado. Personagem original da série.
Frente do personagem = -y.
"""
import math

from mathutils import Vector

import base as B

CORES_CASULA = {
    "verde": (0.035, 0.21, 0.07),
    "roxo": (0.17, 0.05, 0.27),
    "branco": (0.86, 0.84, 0.78),
    "vermelho": (0.42, 0.03, 0.03),
    "rosa": (0.74, 0.33, 0.45),
}


def _smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def materiais():
    return {
        "pele": B.material("pele", (0.78, 0.53, 0.40), rugosidade=0.48, sss=0.25, ruido_cor=0.12, relevo=0.05, escala_ruido=180),
        "alva": B.material("alva", (0.86, 0.84, 0.79), rugosidade=0.82, brilho_tecido=0.35, relevo=0.08, escala_ruido=220),
        "ouro": B.material("ouro", (0.86, 0.64, 0.24), rugosidade=0.32, metal=0.85, relevo=0.25, escala_ruido=160),
        "ouro_claro": B.material("ouro_claro", (0.98, 0.80, 0.38), rugosidade=0.25, metal=0.9),
        "cabelo": B.material("cabelo", (0.58, 0.57, 0.55), rugosidade=0.55, brilho_tecido=0.4, ruido_cor=0.35, relevo=0.6, escala_ruido=900),
        "olho": B.material("olho", (0.92, 0.9, 0.86), rugosidade=0.12, sss=0.1),
        "iris": B.material("iris", (0.22, 0.13, 0.07), rugosidade=0.2),
        "pupila": B.material("pupila", (0.01, 0.01, 0.01), rugosidade=0.1),
        "sobrancelha": B.material("sobrancelha", (0.36, 0.34, 0.32), rugosidade=0.7),
        "boca": B.material("boca", (0.45, 0.17, 0.14), rugosidade=0.45, sss=0.2),
        "sapato": B.material("sapato", (0.03, 0.03, 0.03), rugosidade=0.25),
    }


def casula_material(cor):
    c = CORES_CASULA.get(cor, cor)
    return B.material(f"casula_{cor}", c, rugosidade=0.62, brilho_tecido=0.7, ruido_cor=0.15, relevo=0.12, escala_ruido=260)


def _perfil_casula(t, th, escala=1.0):
    # t: 0 (gola) → 1 (barra). Frente/costas mais compridas (ogiva), laterais mais curtas.
    frente = abs(math.sin(th))  # 1 na frente/costas, 0 nas laterais
    z_top = 1.47
    z_barra = 0.80 - 0.16 * frente
    z = z_top - t * (z_top - z_barra)
    ombro = _smooth(0.0, 0.13, t)
    braco = _smooth(0.10, 0.55, t)
    rx = 0.085 + 0.145 * ombro + 0.085 * braco
    ry = 0.075 + 0.085 * ombro + 0.035 * braco
    dobra = 1 + 0.03 * math.sin(7 * th + 1.3) * _smooth(0.25, 1.0, t) + 0.012 * B.ruido(math.cos(th), math.sin(th), t, 3.0)
    return Vector((math.cos(th) * rx * dobra * escala, math.sin(th) * ry * dobra * escala, z))


def casula(cor, mats, nome="casula", escala=1.0, offset=Vector((0, 0, 0))):
    mat = casula_material(cor)
    obj = B.superficie_revolucao(nome, 40, lambda t, th: _perfil_casula(t, th, escala) + offset, mat, segs=96, subdiv=1)
    s = obj.modifiers.new("espessura", "SOLIDIFY")
    s.thickness = 0.008
    obj.modifiers.move(1, 0)
    # galão: faixa dourada colada à frente (theta ≈ -90°), da gola à barra
    def galao(t, th):
        c = -math.pi / 2 + (th - math.pi) * 0.085  # mapeia a volta inteira para uma faixa estreita
        p = _perfil_casula(t, c, escala)
        n = Vector((p.x, p.y, 0)).normalized()
        return p + n * 0.006 + offset
    g = B.superficie_revolucao(nome + "_galao", 40, galao, mats["ouro"], segs=24, subdiv=1)
    # cruz: barra horizontal à altura do peito
    def barra(t, th):
        c = -math.pi / 2 + (th - math.pi) * 0.33
        tt = 0.33 + (t - 0.5) * 0.06
        p = _perfil_casula(tt, c, escala)
        n = Vector((p.x, p.y, 0)).normalized()
        return p + n * 0.009 + offset
    cz = B.superficie_revolucao(nome + "_cruz", 6, barra, mats["ouro_claro"], segs=24, subdiv=1)
    def haste(t, th):
        c = -math.pi / 2 + (th - math.pi) * 0.025
        tt = 0.24 + t * 0.2
        p = _perfil_casula(tt, c, escala)
        n = Vector((p.x, p.y, 0)).normalized()
        return p + n * 0.009 + offset
    hs = B.superficie_revolucao(nome + "_haste", 10, haste, mats["ouro_claro"], segs=24, subdiv=1)
    return [obj, g, cz, hs]


def alva(mats):
    def perfil(t, th):
        z = 1.40 - t * 1.37
        r = 0.205 + 0.09 * _smooth(0.2, 1.0, t)
        dobra = 1 + 0.04 * math.sin(9 * th + 2.0 * B.ruido(math.cos(th), math.sin(th), 0.3, 2.0)) * _smooth(0.4, 1.0, t)
        return Vector((math.cos(th) * r * dobra, math.sin(th) * r * 0.78 * dobra, z))
    return B.superficie_revolucao("alva", 30, perfil, mats["alva"], segs=96, subdiv=1, fechar_fundo=True)


def cabeca(mats, sorriso=0.6):
    cz = 1.655
    objs = []

    def forma(v):
        # rosto redondo: bochechas cheias, queixo suave, topo levemente achatado
        if v.z < 0:
            v.x *= 1 - 0.12 * (v.z ** 2)
            v.y *= 1 - 0.05 * (v.z ** 2)
        if v.z > 0.6:
            v.z = 0.6 + (v.z - 0.6) * 0.85
        if v.y < -0.3 and -0.6 < v.z < 0.1:  # bochechas
            v.y -= 0.05 * (1 - abs(v.z + 0.25) * 2)
        return v

    objs.append(B.esfera("cabeca", (0, 0, cz), (0.087, 0.095, 0.118), mats["pele"], segs=48, aneis=24, subdiv=2, deformar=forma))
    objs.append(B.tubo("pescoco", (0, 0.01, 1.43), (0, 0.01, 1.58), 0.052, mats["pele"]))
    # nariz e orelhas
    nz = B.esfera("nariz", (0, -0.092, cz - 0.005), (0.016, 0.02, 0.027), mats["pele"], subdiv=2)
    nz.rotation_euler = (math.radians(-12), 0, 0)
    objs.append(nz)
    for lado in (-1, 1):
        o = B.esfera(f"orelha{lado}", (lado * 0.088, 0.005, cz + 0.002), (0.011, 0.02, 0.031), mats["pele"], subdiv=2)
        o.rotation_euler = (0, 0, math.radians(lado * -18))
        objs.append(o)
    # olhos: globo, íris, pupila, pálpebra superior
    for lado in (-1, 1):
        x = lado * 0.032
        cy, ez = -0.074, cz + 0.022
        objs.append(B.esfera(f"olho{lado}", (x, cy, ez), (0.0125, 0.0125, 0.0125), mats["olho"], subdiv=1))
        objs.append(B.esfera(f"iris{lado}", (x, cy - 0.0108, ez - 0.0005), (0.0068, 0.0025, 0.0068), mats["iris"], subdiv=1))
        objs.append(B.esfera(f"pupila{lado}", (x, cy - 0.0129, ez - 0.0005), (0.0032, 0.0012, 0.0032), mats["pupila"], subdiv=1))
        pal = B.esfera(f"palpebra{lado}", (x, cy + 0.001, ez + 0.0015), (0.0139, 0.0139, 0.0139), mats["pele"], subdiv=1,
                       deformar=lambda v: Vector((v.x, v.y, max(v.z, 0.1))))
        pal.rotation_euler = (math.radians(-28), 0, 0)
        objs.append(pal)
        # sobrancelha grisalha, levemente arqueada
        pts = [(x - lado * 0.016, -0.083, ez + 0.026), (x, -0.087, ez + 0.033), (x + lado * 0.019, -0.081, ez + 0.027)]
        objs.append(B.curva(f"sobrancelha{lado}", pts, 0.0042, mats["sobrancelha"], achatar=0.6))
    # boca: sorriso
    arco = []
    for k in range(9):
        u = (k / 8) * 2 - 1
        arco.append((u * 0.024, -0.091 + abs(u) * 0.01, cz - 0.05 + (u * u) * 0.009 * sorriso))
    objs.append(B.curva("boca", arco, 0.0028, mats["boca"], achatar=0.7))
    # cabelo grisalho: só laterais e nuca (topo calvo)
    def cabelo(v):
        return v
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=1.0)
    apagar = []
    for v in bm.verts:
        frente = v.co.y < -0.55
        topo = v.co.z > 0.78
        baixo = v.co.z < -0.32
        if frente or topo or baixo or (v.co.z > 0.38 and v.co.y < -0.05):
            apagar.append(v)
    bmesh.ops.delete(bm, geom=apagar, context="VERTS")
    for v in bm.verts:
        r = 1.035 + 0.025 * B.ruido(v.co.x, v.co.y, v.co.z, 9.0)
        v.co = Vector((v.co.x * 0.087 * r, v.co.y * 0.095 * r, v.co.z * 0.118 * r))
    ca = B.objeto("cabelo", B.bm_para_malha(bm, "cabelo"), mats["cabelo"], subdiv=2)
    ca.location = (0, 0, cz)
    sol = ca.modifiers.new("espessura", "SOLIDIFY")
    sol.thickness = 0.006
    ca.modifiers.move(1, 0)
    objs.append(ca)
    return objs


def mao(nome, pulso, direcao, mats, fechada=True):
    """Mão simples: palma e quatro dedos curvados para dentro, mais o polegar."""
    d = Vector(direcao).normalized()
    lateral = d.cross(Vector((0, 0, 1))).normalized()
    p = Vector(pulso)
    objs = [B.esfera(nome + "_palma", p + d * 0.045, (0.04, 0.025, 0.048), mats["pele"], subdiv=2)]
    objs[0].rotation_mode = "QUATERNION"
    objs[0].rotation_quaternion = Vector((0, 0, 1)).rotation_difference(d)
    for k in range(4):
        base = p + d * 0.085 + lateral * (k - 1.5) * 0.017
        ponta = base + d * 0.04 + Vector((0, 0, -0.03 if fechada else 0))
        objs.append(B.tubo(f"{nome}_dedo{k}", base, ponta, 0.0085, mats["pele"], segs=12))
    objs.append(B.tubo(f"{nome}_polegar", p + d * 0.03 + lateral * 0.03, p + d * 0.07 + lateral * 0.045 + Vector((0, -0.01, 0.01)), 0.009, mats["pele"], segs=12))
    return objs


def padre(cor="verde", local=(0, 0, 0), giro=0.0, pose="maos_postas", sorriso=0.7):
    """Monta o Padre e devolve o objeto-pai (para mover e girar o conjunto)."""
    import bpy

    mats = materiais()
    objs = []
    objs.append(alva(mats))
    objs += casula(cor, mats)
    gola = B.esfera("gola", (0, 0.0, 1.46), (0.1, 0.085, 0.025), mats["alva"], subdiv=2)
    objs.append(gola)
    for lado in (-1, 1):
        objs.append(B.esfera(f"sapato{lado}", (lado * 0.09, -0.12, 0.03), (0.055, 0.12, 0.04), mats["sapato"], subdiv=2))
    objs += cabeca(mats, sorriso)
    if pose == "bracos_baixos":
        for lado in (-1, 1):
            cotovelo = Vector((lado * 0.25, 0.0, 1.06))
            pulso = Vector((lado * 0.27, -0.04, 0.80))
            objs.append(B.tubo(f"manga{lado}", cotovelo, pulso, 0.046, mats["alva"], raio_b=0.042))
            objs += mao(f"mao{lado}", pulso, (lado * 0.05, -0.15, -1.0), mats, fechada=False)
    if pose == "maos_postas":
        # antebraços saem por baixo das laterais da casula e as mãos se juntam à frente da cintura
        for lado in (-1, 1):
            ombro = Vector((lado * 0.30, -0.08, 1.08))
            pulso = Vector((lado * 0.06, -0.29, 1.02))
            objs.append(B.tubo(f"manga{lado}", ombro, pulso, 0.05, mats["alva"], raio_b=0.044))
            objs += mao(f"mao{lado}", pulso, (-lado * 0.8, -0.35, -0.2), mats)
    pai = bpy.data.objects.new("Padre", None)
    bpy.context.scene.collection.objects.link(pai)
    for o in objs:
        o.parent = pai
    pai.location = local
    pai.rotation_euler = (0, 0, math.radians(giro))
    return pai
