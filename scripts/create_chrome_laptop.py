import math
import subprocess
from pathlib import Path

import bpy
from mathutils import Euler, Vector


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "public" / "models"
IMAGE_DIR = ROOT / "public" / "images"
SOURCE_DIR = ROOT / "assets"
for directory in (MODEL_DIR, IMAGE_DIR, SOURCE_DIR):
    directory.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for material in list(bpy.data.materials):
    bpy.data.materials.remove(material)

created = []


def material(name, color, metallic, roughness, coat=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    output = nodes.new("ShaderNodeOutputMaterial")
    mat.node_tree.links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = 0.025
    return mat


chrome = material("Liquid platinum | mirror polish", (0.24, 0.32, 0.46), 1.0, 0.022, 0.9)
chrome_dark = material("Smoked liquid chrome", (0.09, 0.12, 0.19), 0.96, 0.055, 0.55)
black_glass = material("Obsidian display glass", (0.004, 0.006, 0.012), 0.05, 0.11, 0.65)
stage_mat = material("Midnight studio", (0.012, 0.018, 0.033), 0.22, 0.34)
orange_glow = material("Amber reflection", (0.98, 0.23, 0.035), 0.72, 0.08, 0.5)


def finish_mesh(obj, mat, bevel=0.0, segments=4):
    obj.data.materials.append(mat)
    if obj.type == "MESH":
        if bevel:
            mod = obj.modifiers.new("Soft liquid edges", "BEVEL")
            mod.width = bevel
            mod.segments = segments
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=mod.name)
        for face in obj.data.polygons:
            face.use_smooth = True
    created.append(obj)
    return obj


def block(name, dims, loc, mat, bevel=0.08, rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if rot:
        obj.rotation_euler = rot
    return finish_mesh(obj, mat, bevel)


def sphere(name, loc, scale, mat, rot=None, segments=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    if rot:
        obj.rotation_euler = rot
    return finish_mesh(obj, mat)


def curve(name, points, radius, mat):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.resolution_u = 18
    data.bevel_depth = radius
    data.bevel_resolution = 5
    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for p, co in zip(spline.bezier_points, points):
        p.co = co
        p.handle_left_type = "AUTO"
        p.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return finish_mesh(obj, mat)


# The open clamshell is deliberately reclined, with liquid-metal overflow frozen at its edges.
block("Lower shell", (4.2, 2.88, 0.22), (0, 0, 0), chrome, 0.17)
block("Keyboard well", (3.82, 1.52, 0.035), (0, 0.40, 0.125), chrome_dark, 0.12)

row_y = [-0.23, 0.06, 0.35, 0.64, 0.93]
cols = 14
key_w, key_d, gap = 0.205, 0.205, 0.035
start_x = -((cols * key_w + (cols - 1) * gap) / 2) + key_w / 2
for row, y in enumerate(row_y):
    for col in range(cols):
        width = 0.72 if row == 4 and col in (4, 5, 6, 7, 8, 9) else key_w
        if row == 4 and col in (5, 6, 7, 8, 9):
            continue
        x = start_x + col * (key_w + gap)
        block(f"Key {row + 1}-{col + 1}", (width, key_d, 0.045), (x, y, 0.155), chrome, 0.045)

# Broad polished trackpad with a hairline liquid rim.
block("Trackpad | mirror inset", (1.12, 0.60, 0.025), (0, -0.91, 0.126), black_glass, 0.07)
block("Trackpad | liquid rim", (1.20, 0.68, 0.018), (0, -0.91, 0.112), chrome, 0.08)

# Hinge barrels and the lid use a shared reclined axis.
bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=0.085, depth=3.7, location=(0, 1.38, 0.115))
hinge = bpy.context.object
hinge.name = "Full-width mirror hinge"
hinge.rotation_euler[1] = math.radians(90)
finish_mesh(hinge, chrome)

lid_angle = math.radians(-46)
lid_rot = Euler((lid_angle, 0, 0), "XYZ")
lid_origin = Vector((0, 1.34, 0.14))


def lid_world(local):
    point = Vector(local)
    point.rotate(lid_rot)
    return lid_origin + point


lid = block("Display lid | flowing platinum", (4.08, 0.15, 2.72), tuple(lid_world((0, 0, 1.36))), chrome, 0.20, lid_rot)
lid.rotation_euler = lid_rot

# The screen is a dark mirror rather than a graphic, so the metal reflections stay dominant.
screen = block("Liquid mirror display", (3.62, 0.026, 2.25), tuple(lid_world((0, -0.087, 1.38))), black_glass, 0.105, lid_rot)

# A fine bright chrome bead runs around the screen perimeter as a fluid meniscus.
for x in (-1.91, 1.91):
    curve("Molten bezel side", [lid_world((x, -0.10, 0.19)), lid_world((x * 1.015, -0.11, 1.25)), lid_world((x * 0.985, -0.10, 2.42))], 0.028, chrome)
curve("Molten bezel crown", [lid_world((-1.9, -0.1, 2.38)), lid_world((0, -0.12, 2.45)), lid_world((1.9, -0.1, 2.38))], 0.035, chrome)

# Keep all product meshes under one transform origin for clean 360-degree rotation in the browser.
for obj in created:
    obj.location.z -= 1.02

# Studio stage and backdrop are for the poster only, not part of the GLB.
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -2.23))
floor = bpy.context.object
floor.name = "Render stage"
floor.data.materials.append(stage_mat)

world = bpy.data.worlds.new("Midnight chrome studio")
world.use_nodes = True
world_nodes = world.node_tree.nodes
world_nodes.clear()
background = world_nodes.new("ShaderNodeBackground")
background.inputs["Strength"].default_value = 0.55
environment = world_nodes.new("ShaderNodeTexEnvironment")
environment.image = bpy.data.images.load(str(ROOT / "public" / "environments" / "studio_small_09_1k.hdr"), check_existing=True)
world.node_tree.links.new(environment.outputs["Color"], background.inputs["Color"])
world_output = world_nodes.new("ShaderNodeOutputWorld")
world.node_tree.links.new(background.outputs["Background"], world_output.inputs["Surface"])
scene = bpy.context.scene
scene.world = world


def area(name, loc, target, power, color, size, shape="DISK", size_y=None):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = shape
    data.size = size
    if size_y and shape == "RECTANGLE":
        data.size_y = size_y
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
    return obj


area("Huge softbox", (1.0, -3.5, 7.5), (0, 0, 0), 250, (0.80, 0.88, 1.0), 4.0)
area("Long white strip", (-4.5, -0.3, 3.2), (0, 0, 0), 240, (0.95, 0.98, 1.0), 4.8, "RECTANGLE", 0.32)
area("Warm orange strip", (4.4, 1.4, 2.6), (0, 0, 0), 300, (1.0, 0.20, 0.035), 4.0, "RECTANGLE", 0.28)
area("Front reflection card", (0.0, -5.0, 0.7), (0, 0, 0), 110, (0.55, 0.75, 1.0), 3.2, "RECTANGLE", 0.35)
area("Top edge light", (0, 3.0, 5.8), (0, 0, 0.7), 300, (1.0, 1.0, 1.0), 3.5, "RECTANGLE", 0.35)

camera_data = bpy.data.cameras.new("Product camera")
camera = bpy.data.objects.new("Product camera", camera_data)
scene.collection.objects.link(camera)
camera.location = (7.7, -9.2, 5.1)
camera.rotation_euler = (Vector((0, 0, 0.05)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 58
scene.camera = camera

scene.render.engine = "CYCLES"
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 1500
scene.render.resolution_y = 1125
scene.render.resolution_percentage = 82
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.film_transparent = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.render.filepath = str(IMAGE_DIR / "laptop-liquid-chrome.png")

# Save the editable source before rendering, then create the poster and browser-ready GLB.
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_DIR / "laptop-liquid-chrome.blend"))
bpy.ops.render.render(write_still=True)
subprocess.run(
    ["magick", str(IMAGE_DIR / "laptop-liquid-chrome.png"), "-quality", "90", str(IMAGE_DIR / "laptop-liquid-chrome.webp")],
    check=True,
)

bpy.ops.object.select_all(action="DESELECT")
for obj in created:
    obj.select_set(True)
bpy.context.view_layer.objects.active = created[0]
bpy.ops.export_scene.gltf(filepath=str(MODEL_DIR / "laptop-liquid-chrome.glb"), export_format="GLB", use_selection=True, export_apply=True, export_materials="EXPORT", export_cameras=False, export_lights=False)

print("CHROME_LAPTOP_OUTPUTS", MODEL_DIR / "laptop-liquid-chrome.glb", IMAGE_DIR / "laptop-liquid-chrome.png", SOURCE_DIR / "laptop-liquid-chrome.blend")
