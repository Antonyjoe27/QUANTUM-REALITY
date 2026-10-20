"""
QUANTUM REALITY — Blender Workbench Generation Script (Milestone 3.1)
Redesigned Quantum Coin Qubit Module & Precision 1D Walk Workbench.

Run with:
  blender --background --python assets/blender/generate_workbench.py -- \
    --output-blend "assets/blender/workbench.blend" \
    --output-glb "assets/glb/workbench.glb"
"""

import bpy
import sys
import os
import math

# ── Argument parsing ──────────────────────────────────────────────────────────
argv = sys.argv
try:
    sep = argv.index("--")
    args = argv[sep + 1:]
except ValueError:
    args = []

output_blend = None
output_glb   = None
for i, arg in enumerate(args):
    if arg == "--output-blend" and i + 1 < len(args):
        output_blend = args[i + 1]
    if arg == "--output-glb" and i + 1 < len(args):
        output_glb = args[i + 1]

if not output_blend:
    output_blend = os.path.join(os.path.dirname(__file__), "workbench.blend")
if not output_glb:
    output_glb = os.path.join(os.path.dirname(__file__), "..", "glb", "workbench.glb")

output_blend = os.path.abspath(output_blend)
output_glb   = os.path.abspath(output_glb)

print(f"[QR] Output .blend : {output_blend}")
print(f"[QR] Output  .glb  : {output_glb}")

os.makedirs(os.path.dirname(output_blend), exist_ok=True)
os.makedirs(os.path.dirname(output_glb),   exist_ok=True)

# ── Scene reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "QuantumWalkWorkbench"

# ── Physically calibrated PBR palette (Obsidian & Champagne Gold) ───────────
COL_OBSIDIAN      = (0.040, 0.042, 0.045, 1.0)  # #17181A deep obsidian
COL_DEEP_GRAPHITE = (0.082, 0.080, 0.078, 1.0)  # #22211F dark machined graphite base
COL_GRAPHITE      = (0.130, 0.125, 0.120, 1.0)  # #2E2C2A graphite panels and rails
COL_SITE          = (0.190, 0.185, 0.180, 1.0)  # #383734 distinct track site pads
COL_GOLD          = (0.600, 0.450, 0.220, 1.0)  # #C6A66B champagne gold trim
COL_GOLD_HI       = (0.720, 0.580, 0.340, 1.0)  # #D9BD87 highlight gold
COL_IVORY         = (0.860, 0.820, 0.740, 1.0)  # #F0E9DB warm ivory

def make_principled_mat(name, base_color, metallic=0.0, roughness=0.5,
                        specular=0.5, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    out  = nodes.new("ShaderNodeOutputMaterial")
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (-300, 0)
    out.location  = (0, 0)
    bsdf.inputs["Base Color"].default_value  = base_color
    bsdf.inputs["Metallic"].default_value    = metallic
    bsdf.inputs["Roughness"].default_value   = roughness
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = specular
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = specular

    if emission and emission_strength > 0:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = emission_strength
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = emission

    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat

# Materials
mat_bench     = make_principled_mat("Mat_Bench",     COL_DEEP_GRAPHITE, metallic=0.45, roughness=0.35)
mat_graphite  = make_principled_mat("Mat_Graphite",  COL_GRAPHITE,      metallic=0.50, roughness=0.38)
mat_obsidian  = make_principled_mat("Mat_Obsidian",  COL_OBSIDIAN,      metallic=0.40, roughness=0.50)
mat_site      = make_principled_mat("Mat_Site",      COL_SITE,          metallic=0.35, roughness=0.28)
mat_site_ctr  = make_principled_mat("Mat_SiteCenter",COL_GOLD,          metallic=0.88, roughness=0.22)
mat_gold      = make_principled_mat("Mat_Gold",      COL_GOLD,          metallic=0.88, roughness=0.24)
mat_gold_hi   = make_principled_mat("Mat_GoldHi",    COL_GOLD_HI,       metallic=0.92, roughness=0.18)
mat_coin_body = make_principled_mat("Mat_CoinBody",  COL_OBSIDIAN,      metallic=0.55, roughness=0.30)
mat_ivory     = make_principled_mat("Mat_Ivory",     COL_IVORY,         metallic=0.10, roughness=0.60)

# ── Helper functions ──────────────────────────────────────────────────────────
def make_box(name, loc, size, material, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj

def make_cylinder(name, loc, radius, depth, material, vertices=48, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=loc,
        rotation=rot
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
    return obj

# ── Dimensions ───────────────────────────────────────────────────────────────
BENCH_W, BENCH_D, BENCH_H = 10.4, 3.2, 0.16
BENCH_Y  = 0.0
BENCH_Z  = 0.0
LEG_H    = 0.9

TRACK_W = 9.4
TRACK_Z  = BENCH_H / 2
TRACK_RAIL_DEPTH  = 0.06
TRACK_RAIL_HEIGHT = 0.10

SITE_SPACING = 1.15
SITE_R       = 0.32
SITE_H       = 0.06
SITE_Z       = TRACK_Z + SITE_H / 2 + 0.005

TRIM_H = 0.04
TRIM_D = 0.06

# ── Workbench base slab ───────────────────────────────────────────────────────
bench_base = make_box(
    "Workbench_Base",
    loc=(0, BENCH_Y, 0),
    size=(BENCH_W, BENCH_D, BENCH_H),
    material=mat_bench
)

# Legs
leg_positions = [
    (-BENCH_W/2 + 0.35,  BENCH_D/2 - 0.35),
    ( BENCH_W/2 - 0.35,  BENCH_D/2 - 0.35),
    (-BENCH_W/2 + 0.35, -BENCH_D/2 + 0.35),
    ( BENCH_W/2 - 0.35, -BENCH_D/2 + 0.35),
]
for i, (lx, ly) in enumerate(leg_positions):
    make_box(
        f"Leg_{i+1}",
        loc=(lx, ly, -BENCH_H/2 - LEG_H/2),
        size=(0.20, 0.20, LEG_H),
        material=mat_obsidian,
        parent=bench_base
    )

# Champagne-gold perimeter trim
make_box("Trim_Bar_Front", loc=(0, -BENCH_D/2, BENCH_H/2 - TRIM_H/2), size=(BENCH_W, TRIM_D, TRIM_H), material=mat_gold, parent=bench_base)
make_box("Trim_Bar_Back",  loc=(0,  BENCH_D/2, BENCH_H/2 - TRIM_H/2), size=(BENCH_W, TRIM_D, TRIM_H), material=mat_gold, parent=bench_base)
make_box("Trim_Bar_Left",  loc=(-BENCH_W/2, 0, BENCH_H/2 - TRIM_H/2), size=(TRIM_D, BENCH_D, TRIM_H), material=mat_gold, parent=bench_base)
make_box("Trim_Bar_Right", loc=( BENCH_W/2, 0, BENCH_H/2 - TRIM_H/2), size=(TRIM_D, BENCH_D, TRIM_H), material=mat_gold, parent=bench_base)

# Guide rails
for name, y_pos in [("Track_Rail_Left", 0.58), ("Track_Rail_Right", -0.58)]:
    make_box(
        name,
        loc=(0, y_pos, TRACK_Z + TRACK_RAIL_HEIGHT / 2),
        size=(TRACK_W, TRACK_RAIL_DEPTH, TRACK_RAIL_HEIGHT),
        material=mat_graphite,
        parent=bench_base
    )

# End-block supports
for name, x_pos in [("Support_Left", -TRACK_W/2 - 0.16), ("Support_Right", TRACK_W/2 + 0.16)]:
    make_box(
        name,
        loc=(x_pos, 0, TRACK_Z + 0.12),
        size=(0.24, 0.85, 0.28),
        material=mat_gold,
        parent=bench_base
    )

# ── Position sites (x = -4 … +4) ─────────────────────────────────────────────
site_names = [
    "Site_N4", "Site_N3", "Site_N2", "Site_N1",
    "Site_Center",
    "Site_P1", "Site_P2", "Site_P3", "Site_P4",
]
site_x_values = [i * SITE_SPACING for i in range(-4, 5)]

for idx, (sname, sx) in enumerate(zip(site_names, site_x_values)):
    is_center = (sname == "Site_Center")
    mat_disc = mat_site_ctr if is_center else mat_site

    # Primary selectable parent object
    disc = make_cylinder(
        sname,
        loc=(sx, 0.0, SITE_Z),
        radius=SITE_R if not is_center else SITE_R * 1.18,
        depth=SITE_H if not is_center else SITE_H * 1.35,
        material=mat_disc,
        vertices=48
    )

    # Raised center pip (parented to site)
    make_cylinder(
        f"{sname}_Pip",
        loc=(sx, 0.0, SITE_Z + SITE_H / 2 + 0.012),
        radius=0.07,
        depth=0.024,
        material=mat_ivory if is_center else mat_gold,
        vertices=24,
        parent=disc
    )

    # Outer decorative bevel ring (parented to site)
    make_cylinder(
        f"{sname}_Ring",
        loc=(sx, 0.0, SITE_Z + 0.005),
        radius=(SITE_R if not is_center else SITE_R * 1.18) + 0.035,
        depth=0.02,
        material=mat_gold,
        vertices=36,
        parent=disc
    )

    # Pedestal (parented to site)
    make_cylinder(
        f"{sname}_Ped",
        loc=(sx, 0.0, TRACK_Z + 0.025),
        radius=0.14,
        depth=0.05,
        material=mat_obsidian,
        vertices=24,
        parent=disc
    )

# Track connectors between sites
for i in range(-4, 4):
    sx_mid = (i + 0.5) * SITE_SPACING
    make_box(
        f"Site_Connector_{i+5}",
        loc=(sx_mid, 0.0, SITE_Z - SITE_H / 2 + 0.006),
        size=(SITE_SPACING - SITE_R * 2.1, 0.07, 0.012),
        material=mat_obsidian,
        parent=bench_base
    )

# ── Redesigned Quantum Coin Qubit Module ──────────────────────────────────────
# Instead of a confusing bare circular disc, this is a dedicated Quantum Gate Module
# with an embossed 3D Hadamard 'H' gate element, qubit state ports (|0> left, |1> right),
# and waveguide bus connecting directly to the walk origin.
COIN_X = 0.0
COIN_Y = -1.10
COIN_BASE_W = 1.40
COIN_BASE_D = 1.05
COIN_BASE_H = 0.32

# Main Coin Module Housing
coin_housing = make_box(
    "Coin_Module",
    loc=(COIN_X, COIN_Y, TRACK_Z + COIN_BASE_H / 2),
    size=(COIN_BASE_W, COIN_BASE_D, COIN_BASE_H),
    material=mat_coin_body
)

# Gold perimeter trim on module base
make_box("Coin_Trim_Front", loc=(COIN_X, COIN_Y - COIN_BASE_D/2, TRACK_Z + COIN_BASE_H/2), size=(COIN_BASE_W, 0.03, COIN_BASE_H), material=mat_gold, parent=coin_housing)
make_box("Coin_Trim_Left",  loc=(COIN_X - COIN_BASE_W/2, COIN_Y, TRACK_Z + COIN_BASE_H/2), size=(0.03, COIN_BASE_D, COIN_BASE_H), material=mat_gold, parent=coin_housing)
make_box("Coin_Trim_Right", loc=(COIN_X + COIN_BASE_W/2, COIN_Y, TRACK_Z + COIN_BASE_H/2), size=(0.03, COIN_BASE_D, COIN_BASE_H), material=mat_gold, parent=coin_housing)

# Raised Hadamard Gate Console Chamber
CHAMBER_H = 0.18
chamber_z = TRACK_Z + COIN_BASE_H + CHAMBER_H / 2
make_box(
    "Coin_Gate_Chamber",
    loc=(COIN_X, COIN_Y, chamber_z),
    size=(0.92, 0.72, CHAMBER_H),
    material=mat_graphite,
    parent=coin_housing
)

# Gold Bezel around Gate Chamber
make_box(
    "Coin_Gate_Bezel",
    loc=(COIN_X, COIN_Y, chamber_z + CHAMBER_H/2 + 0.01),
    size=(0.96, 0.76, 0.02),
    material=mat_gold,
    parent=coin_housing
)

# Recessed Gate Plate
make_box(
    "Coin_Gate_Plate",
    loc=(COIN_X, COIN_Y, chamber_z + CHAMBER_H/2 + 0.015),
    size=(0.84, 0.64, 0.01),
    material=mat_obsidian,
    parent=coin_housing
)

# ── Dimensional 3D Hadamard 'H' Gate Element ──────────────────────────────────
# Clean, unmistakable 3D 'H' letter crafted from brushed highlight gold
H_Z = chamber_z + CHAMBER_H/2 + 0.045
H_THICK = 0.04
H_HEIGHT = 0.32
H_WIDTH = 0.28
H_BAR = 0.06

# Left upright of 'H'
make_box(
    "Coin_Gate_H_Left",
    loc=(COIN_X - H_WIDTH/2 + H_BAR/2, COIN_Y, H_Z),
    size=(H_BAR, H_HEIGHT, H_THICK),
    material=mat_gold_hi,
    parent=coin_housing
)

# Right upright of 'H'
make_box(
    "Coin_Gate_H_Right",
    loc=(COIN_X + H_WIDTH/2 - H_BAR/2, COIN_Y, H_Z),
    size=(H_BAR, H_HEIGHT, H_THICK),
    material=mat_gold_hi,
    parent=coin_housing
)

# Crossbar of 'H'
make_box(
    "Coin_Gate_H_Cross",
    loc=(COIN_X, COIN_Y, H_Z),
    size=(H_WIDTH - H_BAR, H_BAR, H_THICK),
    material=mat_gold_hi,
    parent=coin_housing
)

# ── Directional Waveguide Shift Ports (|0> Left, |1> Right) ───────────────────
# Left state port (|0> -> Left shift x - 1)
make_cylinder(
    "Coin_Port_Left",
    loc=(COIN_X - 0.52, COIN_Y, TRACK_Z + COIN_BASE_H + 0.04),
    radius=0.10,
    depth=0.12,
    material=mat_gold,
    parent=coin_housing,
    rot=(0, math.radians(90), 0)
)
# Left chevron arrow pointer
make_box(
    "Coin_Arrow_Left",
    loc=(COIN_X - 0.58, COIN_Y, TRACK_Z + COIN_BASE_H + 0.04),
    size=(0.04, 0.12, 0.04),
    material=mat_gold_hi,
    parent=coin_housing,
    rot=(0, 0, math.radians(45))
)

# Right state port (|1> -> Right shift x + 1)
make_cylinder(
    "Coin_Port_Right",
    loc=(COIN_X + 0.52, COIN_Y, TRACK_Z + COIN_BASE_H + 0.04),
    radius=0.10,
    depth=0.12,
    material=mat_gold,
    parent=coin_housing,
    rot=(0, math.radians(90), 0)
)
# Right chevron arrow pointer
make_box(
    "Coin_Arrow_Right",
    loc=(COIN_X + 0.58, COIN_Y, TRACK_Z + COIN_BASE_H + 0.04),
    size=(0.04, 0.12, 0.04),
    material=mat_gold_hi,
    parent=coin_housing,
    rot=(0, 0, math.radians(45))
)

# ── Qubit Bus Conduits (Connecting Coin Module to Origin Site) ────────────────
# Dual gold & graphite conduit bridging the coin transformation to track origin x=0
BUS_LEN = abs(COIN_Y) - 0.35
BUS_MID_Y = (COIN_Y + 0.0) / 2 - 0.10
make_box(
    "Coin_Bus_Left",
    loc=(COIN_X - 0.08, BUS_MID_Y, TRACK_Z + 0.04),
    size=(0.04, BUS_LEN, 0.04),
    material=mat_gold,
    parent=coin_housing
)
make_box(
    "Coin_Bus_Right",
    loc=(COIN_X + 0.08, BUS_MID_Y, TRACK_Z + 0.04),
    size=(0.04, BUS_LEN, 0.04),
    material=mat_gold,
    parent=coin_housing
)
make_box(
    "Coin_Bus_Junction",
    loc=(COIN_X, BUS_MID_Y, TRACK_Z + 0.03),
    size=(0.24, 0.14, 0.04),
    material=mat_graphite,
    parent=coin_housing
)

# ── Save .blend and export GLB ───────────────────────────────────────────────
print(f"[QR] Saving .blend to {output_blend}")
bpy.ops.wm.save_as_mainfile(filepath=output_blend)

print(f"[QR] Exporting GLB to {output_glb}")

bpy.ops.object.select_all(action="DESELECT")
for obj in bpy.context.scene.objects:
    if obj.type == "MESH":
        obj.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=output_glb,
    export_format="GLB",
    use_selection=True,
    export_apply=False,         # Retain hierarchical parenting
    export_materials="EXPORT",
    export_lights=False,
    export_cameras=False,
    export_normals=True,
    export_draco_mesh_compression_enable=False,
)

print("[QR] Export complete.")
size = os.path.getsize(output_glb) if os.path.exists(output_glb) else 0
print(f"[QR] GLB size: {size:,} bytes")
