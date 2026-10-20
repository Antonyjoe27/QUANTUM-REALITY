/**
 * Experiment Record Exporter (Milestone 7)
 * Exports actual completed simulation responses to JSON and CSV.
 */

import type { DecoherenceWalkResponse } from '../api/client'

export function exportExperimentJSON(data: DecoherenceWalkResponse, currentStep: number) {
  const currentSnap = data.timesteps[currentStep] || data.timesteps[0]

  const record = {
    exported_at: new Date().toISOString(),
    project: 'QUANTUM REALITY',
    academic_subtitle: data.academic_subtitle,
    model_name: data.model_name,
    noise_channel: data.noise_channel_name,
    noise_strength_p: data.noise_strength,
    max_steps: data.max_steps,
    inspected_timestep: currentStep,
    initial_coin_state: data.initial_coin_state,
    movement_convention: data.movement_convention,
    simulation_engine: data.simulation_engine,
    execution_time_ms: data.execution_time_ms,
    inspected_step_statistics: {
      mean_position: currentSnap.noisy.mean,
      std_dev_noisy: currentSnap.noisy.std_dev,
      std_dev_ideal: currentSnap.ideal.std_dev,
      std_dev_classical: currentSnap.classical.std_dev,
      total_variation_distance: currentSnap.total_variation_distance,
      probability_norm_check: currentSnap.noisy.norm_check,
    },
    timesteps: data.timesteps,
  }

  const jsonString = JSON.stringify(record, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `quantum_walk_exp_p${data.noise_strength.toFixed(2)}_t${data.max_steps}_${timestamp}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportExperimentCSV(data: DecoherenceWalkResponse) {
  const headers = [
    'timestep',
    'x',
    'p_noisy',
    'p_ideal',
    'p_classical',
    'mean_noisy',
    'std_dev_noisy',
    'std_dev_classical',
    'tv_distance_to_classical',
    'noise_strength_p',
  ]

  const rows: string[] = [headers.join(',')]

  for (const snap of data.timesteps) {
    const t = snap.step
    const mean = snap.noisy.mean.toFixed(6)
    const stdNoisy = snap.noisy.std_dev.toFixed(6)
    const stdClass = snap.classical.std_dev.toFixed(6)
    const tv = snap.total_variation_distance.toFixed(6)
    const pNoise = data.noise_strength.toFixed(4)

    const noisyMap = new Map(snap.noisy.distribution.map((d) => [d.x, d.probability]))
    const idealMap = new Map(snap.ideal.distribution.map((d) => [d.x, d.probability]))
    const classMap = new Map(snap.classical.distribution.map((d) => [d.x, d.probability]))

    for (let x = -t; x <= t; x++) {
      const pN = (noisyMap.get(x) ?? 0).toFixed(6)
      const pI = (idealMap.get(x) ?? 0).toFixed(6)
      const pC = (classMap.get(x) ?? 0).toFixed(6)

      rows.push(`${t},${x},${pN},${pI},${pC},${mean},${stdNoisy},${stdClass},${tv},${pNoise}`)
    }
  }

  const csvString = rows.join('\n')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `quantum_walk_exp_p${data.noise_strength.toFixed(2)}_t${data.max_steps}_${timestamp}.csv`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
