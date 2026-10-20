export type ActiveView = 'workbench' | 'coin' | 'noise' | 'docs'

export interface InteractiveObjectInfo {
  id: string
  name: string
  type: 'site' | 'coin' | 'workbench' | 'track'
  title: string
  coordinate?: number
  description: string
  details: {
    label: string
    value: string
  }[]
  scientificExplanation?: {
    representation: string
    hadamardRole: string
    shiftMechanism: string
    simulationStatus: string
  }
}

export const BASE_SITE_METADATA: Record<string, InteractiveObjectInfo> = {
  Site_N4: {
    id: 'Site_N4',
    name: 'Site_N4',
    type: 'site',
    title: 'Track Reference Site (x = -4)',
    coordinate: -4,
    description: 'Negative spatial lattice site at the boundary of the 9-site physical demonstration track.',
    details: [
      { label: 'Coordinate', value: 'x = -4' },
      { label: 'Position-Register Index', value: '60 (Binary: 0111100_2)' },
      { label: 'Spatial Basis', value: '|-4⟩_x' },
    ],
  },
  Site_N3: {
    id: 'Site_N3',
    name: 'Site_N3',
    type: 'site',
    title: 'Track Reference Site (x = -3)',
    coordinate: -3,
    description: 'Negative spatial lattice site where constructive/destructive wavepacket nodes develop.',
    details: [
      { label: 'Coordinate', value: 'x = -3' },
      { label: 'Position-Register Index', value: '61 (Binary: 0111101_2)' },
      { label: 'Spatial Basis', value: '|-3⟩_x' },
    ],
  },
  Site_N2: {
    id: 'Site_N2',
    name: 'Site_N2',
    type: 'site',
    title: 'Track Reference Site (x = -2)',
    coordinate: -2,
    description: 'Inner-left position site along the quantum walk lattice track.',
    details: [
      { label: 'Coordinate', value: 'x = -2' },
      { label: 'Position-Register Index', value: '62 (Binary: 0111110_2)' },
      { label: 'Spatial Basis', value: '|-2⟩_x' },
    ],
  },
  Site_N1: {
    id: 'Site_N1',
    name: 'Site_N1',
    type: 'site',
    title: 'Track Reference Site (x = -1)',
    coordinate: -1,
    description: 'Immediate negative neighbor site to the walk origin.',
    details: [
      { label: 'Coordinate', value: 'x = -1' },
      { label: 'Position-Register Index', value: '63 (Binary: 0111111_2)' },
      { label: 'Spatial Basis', value: '|-1⟩_x' },
    ],
  },
  Site_Center: {
    id: 'Site_Center',
    name: 'Site_Center',
    type: 'site',
    title: 'Origin Site (x = 0)',
    coordinate: 0,
    description: 'Central origin site of the discrete-time quantum walk where the walker initiates at timestep t = 0.',
    details: [
      { label: 'Coordinate', value: 'x = 0 (Origin)' },
      { label: 'Position-Register Index', value: '64 (Binary: 1000000_2, Qubit 7 = 1)' },
      { label: 'Initial State |ψ₀⟩', value: '|x=0⟩ ⊗ (|0⟩ + i|1⟩)/√2' },
    ],
  },
  Site_P1: {
    id: 'Site_P1',
    name: 'Site_P1',
    type: 'site',
    title: 'Track Reference Site (x = +1)',
    coordinate: 1,
    description: 'Immediate positive neighbor site to the walk origin.',
    details: [
      { label: 'Coordinate', value: 'x = +1' },
      { label: 'Position-Register Index', value: '65 (Binary: 1000001_2)' },
      { label: 'Spatial Basis', value: '|+1⟩_x' },
    ],
  },
  Site_P2: {
    id: 'Site_P2',
    name: 'Site_P2',
    type: 'site',
    title: 'Track Reference Site (x = +2)',
    coordinate: 2,
    description: 'Inner-right position site along the quantum walk lattice track.',
    details: [
      { label: 'Coordinate', value: 'x = +2' },
      { label: 'Position-Register Index', value: '66 (Binary: 1000010_2)' },
      { label: 'Spatial Basis', value: '|+2⟩_x' },
    ],
  },
  Site_P3: {
    id: 'Site_P3',
    name: 'Site_P3',
    type: 'site',
    title: 'Track Reference Site (x = +3)',
    coordinate: 3,
    description: 'Positive spatial site displaying characteristic ballistic quantum spreading peaks.',
    details: [
      { label: 'Coordinate', value: 'x = +3' },
      { label: 'Position-Register Index', value: '67 (Binary: 1000011_2)' },
      { label: 'Spatial Basis', value: '|+3⟩_x' },
    ],
  },
  Site_P4: {
    id: 'Site_P4',
    name: 'Site_P4',
    type: 'site',
    title: 'Track Reference Site (x = +4)',
    coordinate: 4,
    description: 'Far-right position site defining the 9-site physical demonstration boundary.',
    details: [
      { label: 'Coordinate', value: 'x = +4' },
      { label: 'Position-Register Index', value: '68 (Binary: 1000100_2)' },
      { label: 'Spatial Basis', value: '|+4⟩_x' },
    ],
  },
  Coin_Module: {
    id: 'Coin_Module',
    name: 'Coin_Module',
    type: 'coin',
    title: 'Quantum Coin Qubit Module (q_c)',
    description: 'Two-level quantum coin system (q_c) that drives the directional superposition and conditional spatial shift of the walker.',
    details: [
      { label: 'Qubit Register', value: 'Coin Qubit 0 (LSB)' },
      { label: 'Coin Operator', value: 'Hadamard Gate H = 1/√2 [[1, 1], [1, -1]]' },
      { label: 'Basis Translation', value: '|0⟩_c → Right (x + 1) | |1⟩_c → Left (x - 1)' },
      { label: 'Evolution Step', value: 'U = S · E_p · (I ⊗ H)' },
      { label: 'Noise Channel', value: 'Phase Damping (Kraus: K0, K1)' },
      { label: 'Simulation Engine', value: 'FastAPI / Qiskit Aer Density Matrix' },
    ],
    scientificExplanation: {
      representation:
        'The coin is an internal two-level quantum degree of freedom |s⟩_c ∈ ℂ² spanned by computational basis states {|0⟩, |1⟩}. It is tensored with the spatial position register |x⟩_p on an 8-qubit space.',
      hadamardRole:
        'The Hadamard operator transforms computational basis states into coherent superpositions: H|0⟩ = (|0⟩+|1⟩)/√2 and H|1⟩ = (|0⟩-|1⟩)/√2. This continuous rotation at each step enables multi-path quantum interference.',
      shiftMechanism:
        'The conditional shift operator S translates the walker based on the coin state: |x⟩|0⟩ ↦ |x+1⟩|0⟩ (Right Shift) and |x⟩|1⟩ ↦ |x-1⟩|1⟩ (Left Shift). Constructive interference at the leading edges yields the characteristic two-peaked ballistic distribution.',
      simulationStatus:
        'Connected to the live backend decoherence engine. Computes exact mixed-state density matrices and statistical moments across 0 to 40 steps.',
    },
  },
}

export const OBJECT_METADATA: Record<string, InteractiveObjectInfo> = { ...BASE_SITE_METADATA }

/**
 * Robust target resolution: maps any sub-mesh name back to its primary interactive ID.
 */
export function resolveTargetId(name: string): string | null {
  if (name in OBJECT_METADATA) return name

  // Dynamic site IDs like Site_x_-7 or Site_x_12
  if (name.startsWith('Site_x_')) return name

  // Check base site prefix matches (Site_N4_Pip, Site_Center_Ring, etc.)
  for (const siteId of [
    'Site_N4', 'Site_N3', 'Site_N2', 'Site_N1',
    'Site_Center',
    'Site_P1', 'Site_P2', 'Site_P3', 'Site_P4',
  ]) {
    if (name.startsWith(siteId)) {
      return siteId
    }
  }

  // Check coin module sub-parts (Gate 'H', chamber, ports, arrows, waveguides)
  if (name.startsWith('Coin_')) {
    return 'Coin_Module'
  }

  return null
}

/**
 * Dynamically generate or retrieve site metadata for any integer coordinate x in [-40, +40].
 * Explicitly separates local position variables from global walk statistics.
 */
export function getSiteInfo(
  x: number,
  currentTimestep?: number,
  pNoisy?: number,
  pIdeal?: number,
  pClassical?: number,
  noiseStrength?: number
): InteractiveObjectInfo {
  let baseKey: string | null = null
  if (x === 0) baseKey = 'Site_Center'
  else if (x >= -4 && x <= -1) baseKey = `Site_N${Math.abs(x)}`
  else if (x >= 1 && x <= 4) baseKey = `Site_P${x}`

  const base = baseKey && BASE_SITE_METADATA[baseKey] ? BASE_SITE_METADATA[baseKey] : null
  const regIndex = 64 + x
  const id = `Site_x_${x}`

  const details: { label: string; value: string }[] = [
    { label: 'Spatial Coordinate', value: `x = ${x > 0 ? `+${x}` : x}` },
    { label: 'Position-Register Index', value: `${regIndex} (Binary: ${regIndex.toString(2).padStart(7, '0')}_2)` },
    { label: 'Spatial Basis State', value: `|${x}⟩_x` },
  ]

  if (currentTimestep !== undefined) {
    const isReachable = Math.abs(x) <= currentTimestep
    const hasParity = (currentTimestep + x) % 2 === 0
    const parityStatus = !isReachable
      ? 'Outside light-cone limit (|x| > t)'
      : !hasParity
      ? 'Parity-forbidden coordinate (Exact P = 0)'
      : 'Active interference position'
    details.push({ label: 'Site Reachability', value: parityStatus })
  }

  if (pNoisy !== undefined) {
    details.push({ label: 'P_noisy(x, t)', value: pNoisy.toFixed(6) })
  }
  if (pIdeal !== undefined) {
    details.push({ label: 'P_ideal(x, t)', value: pIdeal.toFixed(6) })
  }
  if (pClassical !== undefined) {
    details.push({ label: 'P_classical(x, t)', value: pClassical.toFixed(6) })
  }
  if (noiseStrength !== undefined) {
    details.push({ label: 'Channel Parameter (p)', value: noiseStrength.toFixed(2) })
  }

  return {
    id,
    name: id,
    type: 'site',
    title: base ? base.title : `Lattice Site (x = ${x > 0 ? `+${x}` : x})`,
    coordinate: x,
    description: base
      ? base.description
      : `Spatial lattice site x = ${x} on the extended 1D quantum walk track (register index ${regIndex}).`,
    details,
  }
}
