import { useState } from 'react'
import { Layers, HelpCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { OBJECT_METADATA, getSiteInfo } from '../types/workbench'
import { ExperimentControls } from './ExperimentControls'
import { ScientificCharts } from './ScientificCharts'
import type { DecoherenceWalkResponse } from '../api/client'
import styles from '../styles/InspectorPanel.module.css'

interface InspectorPanelProps {
  selectedId: string | null
  selectedCoord: number | null
  onClearSelection: () => void
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
  simulationData: DecoherenceWalkResponse | null
  currentStep: number
}

export function InspectorPanel({
  selectedId,
  selectedCoord,
  onClearSelection,
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
  simulationData,
  currentStep,
}: InspectorPanelProps) {
  const [showTheory, setShowTheory] = useState<boolean>(false)

  const currentSnapshot = simulationData && simulationData.timesteps.length > currentStep
    ? simulationData.timesteps[currentStep]
    : null

  let inspectedMeta = null

  if (selectedCoord !== null) {
    const pNoisy = currentSnapshot?.noisy.distribution.find((d) => d.x === selectedCoord)?.probability
    const pIdeal = currentSnapshot?.ideal.distribution.find((d) => d.x === selectedCoord)?.probability
    const pClassical = currentSnapshot?.classical.distribution.find((d) => d.x === selectedCoord)?.probability

    inspectedMeta = getSiteInfo(
      selectedCoord,
      currentStep,
      pNoisy,
      pIdeal,
      pClassical,
      noiseStrength
    )
  } else if (selectedId && selectedId in OBJECT_METADATA) {
    inspectedMeta = OBJECT_METADATA[selectedId]
  }

  const isCoinSelected = selectedId === 'Coin_Module'

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>
          <Layers size={14} />
          Scientific Control & Inspector
        </span>
        {(selectedId || selectedCoord !== null) && (
          <button className={styles.clearBtn} onClick={onClearSelection}>
            Clear Target
          </button>
        )}
      </div>

      <div className={styles.panelBody}>
        {/* 1. Experiment Control Panel */}
        <ExperimentControls
          noiseStrength={noiseStrength}
          maxSteps={maxSteps}
          onChangeNoise={onChangeNoise}
          onChangeMaxSteps={onChangeMaxSteps}
          onRunExperiment={onRunExperiment}
          onResetControls={onResetControls}
          onExportJSON={onExportJSON}
          onExportCSV={onExportCSV}
          isLoading={isLoading}
          error={error}
          executionTimeMs={simulationData?.execution_time_ms ?? null}
          hasData={simulationData !== null}
        />

        {/* 2. Global Walk Ensemble Statistics (Clearly separated from local position data) */}
        {currentSnapshot && (
          <div className={styles.objectCard} style={{ borderColor: 'rgba(198, 166, 107, 0.4)' }}>
            <span className={styles.objectTag}>Global Ensemble</span>
            <h3 className={styles.objectTitle}>Walk Ensemble Statistics (t = {currentStep})</h3>
            <p className={styles.objectDesc}>
              Statistical moments computed over the complete spatial probability distribution at timestep {currentStep}.
            </p>

            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Mean Position μ(t)</span>
                <span className={styles.detailValue} style={{ color: '#F0E9DB' }}>
                  {Math.abs(currentSnapshot.noisy.mean) < 1e-10 ? '0.0000' : currentSnapshot.noisy.mean.toFixed(4)} (Symmetric)
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Noisy Std Dev σ_noisy(t)</span>
                <span className={styles.detailValue} style={{ color: '#D9BD87', fontWeight: 700 }}>
                  {currentSnapshot.noisy.std_dev.toFixed(4)}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Ideal Std Dev σ_ideal(t)</span>
                <span className={styles.detailValue}>
                  {currentSnapshot.ideal.std_dev.toFixed(4)} (Ballistic σ ∝ t)
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Classical Reference σ_cl(t)</span>
                <span className={styles.detailValue}>
                  {currentSnapshot.classical.std_dev.toFixed(4)} (Diffusive √t)
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Spreading Ratio σ_n / σ_c</span>
                <span className={styles.detailValue}>
                  {currentSnapshot.std_dev_ratio_vs_classical
                    ? `${currentSnapshot.std_dev_ratio_vs_classical.toFixed(3)}×`
                    : '1.000×'}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total Variation TV(P_n, P_c)</span>
                <span className={styles.detailValue}>
                  {currentSnapshot.total_variation_distance.toFixed(4)}
                </span>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Total Probability Norm</span>
                <span className={styles.detailValue}>
                  {currentSnapshot.noisy.norm_check.toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Selected Local Position / Object Details */}
        {inspectedMeta ? (
          <div className={styles.objectCard}>
            <span className={styles.objectTag}>{inspectedMeta.type}</span>
            <h3 className={styles.objectTitle}>{inspectedMeta.title}</h3>
            <p className={styles.objectDesc}>{inspectedMeta.description}</p>

            <div className={styles.detailsList}>
              {inspectedMeta.details.map((item, idx) => (
                <div key={idx} className={styles.detailRow}>
                  <span className={styles.detailLabel}>{item.label}</span>
                  <span className={styles.detailValue}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* In-depth Quantum Theory for Coin Module */}
            {isCoinSelected && inspectedMeta.scientificExplanation && (
              <div className={styles.explanationCard}>
                <div className={styles.explanationHeader}>
                  Coin Qubit & Phase Damping Channel
                </div>

                <div className={styles.explanationItem}>
                  <div className={styles.explanationItemTitle}>1. Two-Level Coin Superposition</div>
                  <div className={styles.explanationItemText}>
                    {inspectedMeta.scientificExplanation.representation}
                  </div>
                </div>

                <div className={styles.explanationItem}>
                  <div className={styles.explanationItemTitle}>2. Hadamard Gate (H)</div>
                  <div className={styles.explanationItemText}>
                    {inspectedMeta.scientificExplanation.hadamardRole}
                  </div>
                </div>

                <div className={styles.explanationItem}>
                  <div className={styles.explanationItemTitle}>3. Conditional Spatial Translation (S)</div>
                  <div className={styles.explanationItemText}>
                    {inspectedMeta.scientificExplanation.shiftMechanism}
                  </div>
                </div>

                <div className={styles.explanationItem}>
                  <div className={styles.explanationItemTitle}>
                    4. Active Dephasing Channel: K₀, K₁
                  </div>
                  <div className={styles.explanationItemText}>
                    Phase damping scales off-diagonal coin density matrix coherences by{' '}
                    <strong>√(1 - p) = {Math.sqrt(Math.max(0, 1 - noiseStrength)).toFixed(4)}</strong>.
                    {noiseStrength === 0 && ' (No dephasing: pure quantum walk)'}
                    {noiseStrength === 1 && ' (Complete dephasing: classical binomial random walk)'}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <HelpCircle size={28} className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              Click any 3D probability bar or track site to inspect exact numerical probabilities
              and register indices at timestep t = {currentStep}.
            </p>
          </div>
        )}

        {/* 4. Educational Explanation Collapsible Section */}
        <div className={styles.objectCard}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            onClick={() => setShowTheory(!showTheory)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D9BD87', fontSize: '0.80rem', fontWeight: 600 }}>
              <BookOpen size={14} />
              <span>Decoherence Theory & Equations</span>
            </div>
            {showTheory ? <ChevronUp size={15} color="#A9A196" /> : <ChevronDown size={15} color="#A9A196" />}
          </div>

          {showTheory && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.73rem', color: '#A9A196', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div>
                <strong style={{ color: '#F0E9DB' }}>1. Coin Hilbert Space:</strong> The coin qubit q_c is an internal degree of freedom spanned by computational states |0⟩ and |1⟩.
              </div>
              <div>
                <strong style={{ color: '#F0E9DB' }}>2. Hadamard Interference:</strong> Gate H = 1/√2 [[1, 1], [1, -1]] creates superpositions with relative phase -1 on |1⟩, generating constructive interference at wavefront edges.
              </div>
              <div>
                <strong style={{ color: '#F0E9DB' }}>3. Phase Damping Channel:</strong> Kraus operators K₀ = [[1, 0], [0, √(1-p)]] and K₁ = [[0, 0], [0, √p]] multiply off-diagonal coin coherences by √(1-p) without altering populations.
              </div>
              <div>
                <strong style={{ color: '#F0E9DB' }}>4. Classical Convergence (p = 1.0):</strong> With coherences eliminated, interference vanishes and the quantum walk reduces to an unbiased binomial random walk with variance σ² = t.
              </div>
              <div>
                <strong style={{ color: '#F0E9DB' }}>5. Spreading Quantification:</strong> Standard deviation σ(t) = √(Σ (x - μ)² P(x)) transitions from ballistic (σ ∝ t) to diffusive (σ ∝ √t).
              </div>
            </div>
          )}
        </div>

        {/* 5. Scientific Visualizations & Charts */}
        {simulationData && (
          <ScientificCharts
            simulationData={simulationData}
            currentStep={currentStep}
          />
        )}
      </div>
    </aside>
  )
}
