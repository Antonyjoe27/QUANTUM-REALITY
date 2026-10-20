import { Activity, RotateCcw, Play, Loader2, CheckCircle2, AlertTriangle, Download } from 'lucide-react'
import styles from '../styles/ExperimentControls.module.css'

interface ExperimentControlsProps {
  noiseStrength: number
  maxSteps: number
  onChangeNoise: (val: number) => void
  onChangeMaxSteps: (val: number) => void
  onRunExperiment: (steps?: number, noise?: number) => void
  onResetControls: () => void
  onExportJSON: () => void
  onExportCSV: () => void
  isLoading: boolean
  error: string | null
  executionTimeMs: number | null
  hasData: boolean
}

export function ExperimentControls({
  noiseStrength,
  maxSteps,
  onChangeNoise,
  onChangeMaxSteps,
  onRunExperiment,
  onResetControls,
  onExportJSON,
  onExportCSV,
  isLoading,
  error,
  executionTimeMs,
  hasData,
}: ExperimentControlsProps) {
  const getNoiseLabel = (p: number) => {
    if (p === 0.0) return 'Ideal Quantum Limit (Ballistic σ ∝ t, Zero Noise)'
    if (p === 1.0) return 'Complete Coin Dephasing (Classical Limit σ = √t)'
    if (p <= 0.3) return 'Weak Dephasing (Slight Coherence Attenuation)'
    if (p <= 0.7) return 'Intermediate Dephasing (Progressive Interference Suppression)'
    return 'Strong Dephasing (Transition to Diffusive Spreading)'
  }

  const handleSelectPreset = (pVal: number) => {
    onChangeNoise(pVal)
    onRunExperiment(maxSteps, pVal)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.title}>
          <Activity size={16} className={styles.titleIcon} />
          <span>Decoherence Experiment Controls</span>
        </div>
      </div>

      {/* Preset Comparison Workflows */}
      <div className={styles.presetSection}>
        <span className={styles.presetLabel}>Comparison Regimes</span>
        <div className={styles.presetButtonGroup}>
          <button
            className={`${styles.presetBtn} ${noiseStrength === 0.0 ? styles.presetBtnActive : ''}`}
            onClick={() => handleSelectPreset(0.0)}
            disabled={isLoading}
            title="Regime A: Zero dephasing noise (Ideal ballistic walk)"
          >
            A: Quantum (p=0)
          </button>
          <button
            className={`${styles.presetBtn} ${noiseStrength === 0.5 ? styles.presetBtnActive : ''}`}
            onClick={() => handleSelectPreset(0.5)}
            disabled={isLoading}
            title="Regime B: Intermediate phase damping (Decoherence transition)"
          >
            B: Dephased (p=0.5)
          </button>
          <button
            className={`${styles.presetBtn} ${noiseStrength === 1.0 ? styles.presetBtnActive : ''}`}
            onClick={() => handleSelectPreset(1.0)}
            disabled={isLoading}
            title="Regime C: Complete dephasing (Classical binomial limit)"
          >
            C: Classical (p=1)
          </button>
        </div>
      </div>

      {/* Control 1: Phase Damping Noise Strength Slider */}
      <div className={styles.controlGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>Phase Damping Strength (p)</label>
          <span className={styles.valueTag}>p = {noiseStrength.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.0}
          max={1.0}
          step={0.05}
          value={noiseStrength}
          onChange={(e) => onChangeNoise(parseFloat(e.target.value))}
          disabled={isLoading}
          className={styles.slider}
        />
        <div className={styles.sliderHint}>{getNoiseLabel(noiseStrength)}</div>
      </div>

      {/* Control 2: Maximum Timesteps Slider */}
      <div className={styles.controlGroup}>
        <div className={styles.labelRow}>
          <label className={styles.label}>Simulation Steps (max_steps)</label>
          <span className={styles.valueTag}>T = {maxSteps} steps</span>
        </div>
        <input
          type="range"
          min={1}
          max={40}
          step={1}
          value={maxSteps}
          onChange={(e) => onChangeMaxSteps(parseInt(e.target.value, 10))}
          disabled={isLoading}
          className={styles.slider}
        />
        <div className={styles.sliderHint}>
          Simulates all snapshots t = 0 through {maxSteps} without boundary wrap ([-40, +40] safe).
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.buttonRow}>
        <button
          className={styles.runButton}
          onClick={() => onRunExperiment(maxSteps, noiseStrength)}
          disabled={isLoading}
          title="Execute simulation on FastAPI backend"
        >
          {isLoading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" />
              <span>Run Experiment</span>
            </>
          )}
        </button>

        <button
          className={styles.resetBtn}
          onClick={onResetControls}
          disabled={isLoading}
          title="Reset to default experiment parameters (p = 0.5, T = 15)"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Export Section */}
      <div className={styles.exportRow}>
        <span style={{ fontSize: '0.72rem', color: '#A9A196' }}>Export Data:</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={styles.exportBtn}
            onClick={onExportJSON}
            disabled={!hasData || isLoading}
            title="Download complete experimental run as structured JSON"
          >
            <Download size={11} />
            <span>JSON</span>
          </button>
          <button
            className={styles.exportBtn}
            onClick={onExportCSV}
            disabled={!hasData || isLoading}
            title="Download full tabular timestep distribution data as CSV"
          >
            <Download size={11} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Execution Status / Error Feedback */}
      {error && (
        <div className={styles.errorBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} />
            <strong>Backend Error:</strong> {error}
          </div>
          <button className={styles.retryBtn} onClick={() => onRunExperiment(maxSteps, noiseStrength)}>
            Retry Request
          </button>
        </div>
      )}

      {!error && executionTimeMs !== null && (
        <div className={styles.statusCard}>
          <div className={styles.statusSuccess}>
            <CheckCircle2 size={13} />
            <span>Simulation Success • {executionTimeMs.toFixed(1)} ms</span>
          </div>
          <span style={{ fontSize: '0.68rem' }}>Qiskit Aer (Exact Matrix)</span>
        </div>
      )}
    </div>
  )
}
