/**
 * QUANTUM REALITY — Typed API Client for FastAPI Backend
 * Milestone 6: Real simulation integration.
 */

export interface DistributionPoint {
  x: number
  probability: number
}

export interface QuantumStepData {
  mean: number
  std_dev: number
  norm_check: number
  is_symmetric: boolean
  distribution: DistributionPoint[]
}

export interface NoisyStepData {
  mean: number
  std_dev: number
  norm_check: number
  is_symmetric: boolean
  distribution: DistributionPoint[]
}

export interface ClassicalStepData {
  mean: number
  std_dev: number
  theoretical_std_dev: number
  norm_check: number
  distribution: DistributionPoint[]
}

export interface DecoherenceTimestepSnapshot {
  step: number
  noisy: NoisyStepData
  ideal: QuantumStepData
  classical: ClassicalStepData
  total_variation_distance: number
  total_variation_vs_ideal: number
  std_dev_ratio_vs_classical: number | null
}

export interface RegisterEncodingInfo {
  total_qubits: number
  coin_qubit: number
  position_qubits: number[]
  num_position_states: number
  origin_index: number
  coordinate_formula: string
  boundary_safe_range: string
}

export interface DecoherenceWalkRequest {
  max_steps: number
  noise_strength: number
}

export interface DecoherenceWalkResponse {
  model_name: string
  academic_subtitle: string
  noise_channel_name: string
  noise_strength: number
  simulation_mode: string
  kraus_operators_description: string
  initial_coin_state: string
  movement_convention: string
  timestep_sequence: string
  register_encoding: RegisterEncodingInfo
  max_steps: number
  timesteps: DecoherenceTimestepSnapshot[]
  simulation_engine: string
  execution_time_ms: number
}

export interface BackendHealthResponse {
  status: string
  service: string
  version: string
  simulation_engine: string
  milestone: number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Check backend health status.
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse> {
  const url = `${API_BASE}/health`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    throw new ApiError(`Health check failed with status ${res.status}`, res.status)
  }
  return res.json()
}

/**
 * Execute decoherence quantum walk simulation.
 */
export async function fetchDecoherenceSimulation(
  params: DecoherenceWalkRequest,
  signal?: AbortSignal
): Promise<DecoherenceWalkResponse> {
  const url = `${API_BASE}/api/quantum-walk/decoherence`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    signal,
  })

  if (!res.ok) {
    let detail = `Simulation request failed (${res.status})`
    try {
      const errJson = await res.json()
      if (errJson && errJson.detail) {
        detail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(detail, res.status)
  }

  return res.json()
}
