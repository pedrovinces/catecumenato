"""Utilitários de modelagem e materiais para as cenas 3D (Blender como módulo Python: `import bpy`).

Tudo é construído por código (bmesh + dados), sem operadores dependentes de interface,
para rodar sem tela. Unidades em metros; z para cima; a câmera olha para +y (frente dos personagens = -y).
"""
import math

import bmesh
import bpy
from mathutils import Vector, noise


def limpar():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def objeto(nome, malha, material=None, colecao=None, suave=True, subdiv=0):
    obj = bpy.data.objects.new(nome, malha)
    (colecao or bpy.context.scene.collection).objects.link(obj)
    if material is not None:
        malha.materials.append(material)
    if suave:
        for p in malha.polygons:
            p.use_smooth = True
    if subdiv:
        m = obj.modifiers.new("sub", "SUBSURF")
        m.levels = subdiv
        m.render_levels = subdiv
    return obj


def bm_para_malha(bm, nome):
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    return me


def esfera(nome, centro, escala, material, segs=32, aneis=16, subdiv=1, deformar=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=aneis, radius=1.0)
    for v in bm.verts:
        if deformar:
            v.co = deformar(v.co.copy())
        v.co = Vector((v.co.x * escala[0], v.co.y * escala[1], v.co.z * escala[2]))
    obj = objeto(nome, bm_para_malha(bm, nome), material, subdiv=subdiv)
    obj.location = centro
    return obj


def caixa(nome, centro, dim, material, chanfro=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * dim[0], v.co.y * dim[1], v.co.z * dim[2]))
    obj = objeto(nome, bm_para_malha(bm, nome), material, suave=False)
    obj.location = centro
    if chanfro:
        b = obj.modifiers.new("chanfro", "BEVEL")
        b.width = chanfro
        b.segments = 2
    return obj


def tubo(nome, a, b, raio, material, segs=24, raio_b=None, subdiv=1):
    """Cilindro entre os pontos a e b (com tampas arredondadas pela subdivisão)."""
    a, b = Vector(a), Vector(b)
    eixo = b - a
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=raio, radius2=raio_b or raio, depth=eixo.length)
    me = bm_para_malha(bm, nome)
    obj = objeto(nome, me, material, subdiv=subdiv)
    obj.location = (a + b) / 2
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(eixo.normalized())
    return obj


def curva(nome, pontos, espessura, material, achatar=1.0):
    """Curva com volume (sobrancelha, boca, cabide)."""
    cu = bpy.data.curves.new(nome, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = espessura
    cu.bevel_resolution = 4
    sp = cu.splines.new("POLY")
    sp.points.add(len(pontos) - 1)
    for p, c in zip(sp.points, pontos):
        p.co = (c[0], c[1], c[2], 1.0)
    obj = bpy.data.objects.new(nome, cu)
    bpy.context.scene.collection.objects.link(obj)
    cu.materials.append(material)
    if achatar != 1.0:
        obj.scale = (1, achatar, 1)
    return obj


def superficie_revolucao(nome, aneis, perfil, material, segs=64, subdiv=1, fechar_fundo=False):
    """Superfície de anéis: perfil(t, theta) -> Vector. t em [0,1] de cima para baixo, theta em [0, 2pi)."""
    bm = bmesh.new()
    grade = []
    for i in range(aneis + 1):
        t = i / aneis
        linha = []
        for j in range(segs):
            th = 2 * math.pi * j / segs
            linha.append(bm.verts.new(perfil(t, th)))
        grade.append(linha)
    for i in range(aneis):
        for j in range(segs):
            a, b = grade[i][j], grade[i][(j + 1) % segs]
            c, d = grade[i + 1][(j + 1) % segs], grade[i + 1][j]
            bm.faces.new((a, b, c, d))
    if fechar_fundo:
        bm.faces.new(list(reversed(grade[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return objeto(nome, bm_para_malha(bm, nome), material, subdiv=subdiv)


def ruido(x, y, z, escala=1.0):
    return noise.noise(Vector((x * escala, y * escala, z * escala)))


# ---------------- materiais ----------------

def _bsdf(mat):
    mat.use_nodes = True
    return mat.node_tree.nodes.get("Principled BSDF")


def _entrada(bsdf, nomes, valor):
    for n in nomes:
        if n in bsdf.inputs:
            bsdf.inputs[n].default_value = valor
            return


def material(nome, cor, rugosidade=0.5, metal=0.0, sss=0.0, brilho_tecido=0.0, emissao=None, forca_emissao=0.0, ruido_cor=0.0, relevo=0.0, escala_ruido=40.0):
    mat = bpy.data.materials.new(nome)
    b = _bsdf(mat)
    nt = mat.node_tree
    _entrada(b, ["Base Color"], (*cor, 1.0))
    _entrada(b, ["Roughness"], rugosidade)
    _entrada(b, ["Metallic"], metal)
    if sss:
        _entrada(b, ["Subsurface Weight", "Subsurface"], sss)
        _entrada(b, ["Subsurface Radius"], (0.9, 0.35, 0.2))
        _entrada(b, ["Subsurface Scale"], 0.02)
    if brilho_tecido:
        _entrada(b, ["Sheen Weight", "Sheen"], brilho_tecido)
        _entrada(b, ["Sheen Roughness"], 0.4)
    if emissao:
        _entrada(b, ["Emission Color", "Emission"], (*emissao, 1.0))
        _entrada(b, ["Emission Strength"], forca_emissao)
    if ruido_cor or relevo:
        coord = nt.nodes.new("ShaderNodeTexCoord")
        tex = nt.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = escala_ruido
        tex.inputs["Detail"].default_value = 6.0
        nt.links.new(coord.outputs["Object"], tex.inputs["Vector"])
        if ruido_cor:
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.inputs["Factor"].default_value = ruido_cor
            mix.inputs[6].default_value = (*cor, 1.0)
            mix.inputs[7].default_value = (cor[0] * 0.75, cor[1] * 0.75, cor[2] * 0.75, 1.0)
            nt.links.new(tex.outputs["Fac"], mix.inputs["Factor"])
            nt.links.new(mix.outputs[2], b.inputs["Base Color"])
        if relevo:
            bump = nt.nodes.new("ShaderNodeBump")
            bump.inputs["Strength"].default_value = relevo
            nt.links.new(tex.outputs["Fac"], bump.inputs["Height"])
            nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    return mat


def material_tabuas(nome, cor=(0.36, 0.22, 0.12)):
    """Piso de tábuas: textura de tijolo alongada + veio de madeira."""
    mat = bpy.data.materials.new(nome)
    b = _bsdf(mat)
    nt = mat.node_tree
    coord = nt.nodes.new("ShaderNodeTexCoord")
    brick = nt.nodes.new("ShaderNodeTexBrick")
    brick.inputs["Scale"].default_value = 1.2
    brick.inputs["Mortar Size"].default_value = 0.004
    brick.inputs["Brick Width"].default_value = 2.4
    brick.inputs["Row Height"].default_value = 0.18
    brick.inputs["Color1"].default_value = (*cor, 1)
    brick.inputs["Color2"].default_value = (cor[0] * 0.8, cor[1] * 0.78, cor[2] * 0.75, 1)
    brick.inputs["Mortar"].default_value = (0.08, 0.05, 0.03, 1)
    nt.links.new(coord.outputs["Object"], brick.inputs["Vector"])
    veio = nt.nodes.new("ShaderNodeTexWave")
    veio.inputs["Scale"].default_value = 6.0
    veio.inputs["Distortion"].default_value = 8.0
    nt.links.new(coord.outputs["Object"], veio.inputs["Vector"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 0.25
    nt.links.new(brick.outputs["Color"], mix.inputs[6])
    nt.links.new(veio.outputs["Color"], mix.inputs[7])
    nt.links.new(mix.outputs[2], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.42
    return mat


# ---------------- render ----------------

def configurar_render(saida, largura=1080, altura=1920, amostras=96, percentual=100, transparente=False):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = amostras
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = "OPENIMAGEDENOISE"
    except TypeError:
        pass
    sc.cycles.max_bounces = 6
    sc.render.resolution_x = largura
    sc.render.resolution_y = altura
    sc.render.resolution_percentage = percentual
    sc.render.film_transparent = transparente
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA" if transparente else "RGB"
    sc.render.filepath = saida
    try:
        sc.view_settings.view_transform = "AgX"
        sc.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        sc.view_settings.view_transform = "Filmic"


def camera(local, alvo, focal=40.0, abertura=None, foco=None):
    cam = bpy.data.cameras.new("camera")
    cam.lens = focal
    cam.sensor_fit = "VERTICAL"
    obj = bpy.data.objects.new("camera", cam)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = local
    direcao = Vector(alvo) - Vector(local)
    obj.rotation_euler = direcao.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = obj
    if abertura:
        cam.dof.use_dof = True
        cam.dof.aperture_fstop = abertura
        cam.dof.focus_distance = foco or direcao.length
    return obj


def luz(tipo, nome, local, forca, cor=(1, 1, 1), tamanho=1.0, alvo=None, angulo=None):
    dado = bpy.data.lights.new(nome, tipo)
    dado.energy = forca
    dado.color = cor
    if tipo == "AREA":
        dado.size = tamanho
    if tipo == "SUN" and angulo is not None:
        dado.angle = math.radians(angulo)
    obj = bpy.data.objects.new(nome, dado)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = local
    if alvo is not None:
        obj.rotation_euler = (Vector(alvo) - Vector(local)).to_track_quat("-Z", "Y").to_euler()
    return obj


def mundo(cor=(0.05, 0.05, 0.06), forca=1.0):
    w = bpy.data.worlds.new("mundo")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (*cor, 1)
    bg.inputs["Strength"].default_value = forca


def volume_ar(centro, dim, densidade=0.02, cor=(1, 0.95, 0.85)):
    """Ar levemente enevoado para os raios de luz aparecerem."""
    mat = bpy.data.materials.new("ar")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.remove(nt.nodes.get("Principled BSDF"))
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = densidade
    vol.inputs["Color"].default_value = (*cor, 1)
    nt.links.new(vol.outputs[0], nt.nodes.get("Material Output").inputs["Volume"])
    return caixa("ar", centro, dim, mat)
