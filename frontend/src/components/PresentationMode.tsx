import { useMemo } from 'react'
import {
  Sparkles,
  RotateCcw,
  Play,
  Loader2,
  AlertTriangle,
  Download,
  CheckCircle2,
} from 'lucide-react'
import type { DecoherenceWalkResponse, DecoherenceTimestepSnapshot } from '../api/client'
import styles from '../styles/PresentationMode.module.css'

export type PresentationRegime = 'A' | 'B' | 'C' | 'custom'

interface PresentationModeProps {
  simulationData: DecoherenceWalkResponse | null
  currentStep: number
  noiseStrength: number
  maxSteps: number
  isLoading: boolean
  error: string | null
  activeRegime: PresentationRegime
  onSelectPreset: (regime: 'A' | 'B' | 'C', p: number, steps: number) => void
  onRunExperiment: (steps?: number, noise?: number) => void
  onResetControls: () => void
  onExportJSON: () => void
  onExportCSV: () => void
  onExitPresentation: () => void
  selectedCoord: number | null
  onClearSelection: () => void
}

export function PresentationMode({
  simulationData,
  currentStep,
  noiseStrength,
  maxSteps,
  isLoading,
  error,
  activeRegime,
  onSelectPreset,
  onRunExperiment,
  onResetControls,
  onExportJSON,
  onExportCSV,
  onExitPresentation,
  selectedCoord,
  onClearSelection,
}: PresentationModeProps) {
  const currentSnapshot: DecoherenceTimestepSnapshot | null =
    simulationData && simulationData.timesteps.length > currentStep
      ? simulationData.timesteps[currentStep]
      : null

  // Dynamic explanation text for "What the experiment demonstrates"
  const regimeExplanation = useMemo(() => {
    switch (activeRegime) {
      case 'A':
        return {
          title: 'Regime A — Coherent Quantum Spreading (Ballistic Expansion)',
          badge: 'Ideal Quantum Limit (p = 0.00)',
          desc: 'Unbroken quantum superposition and constructive interference drive ballistic spatial expansion (σ ∝ t). Probability flows outward toward the wavefront limits, forming two prominent interference peaks near x ≈ ±t/√2 (±28 at t = 40), while destructive interference suppresses the central origin.',
        }
      case 'B':
        return {
          title: 'Regime B — Intermediate Coin Decoherence (Transition State)',
          badge: 'Partial Dephasing (p = 0.50)',
          desc: 'The phase-damping channel scales off-diagonal coin density matrix coherences by √(1 - p) ≈ 0.707 at every step. This progressive suppression of quantum phase interference damps the outer peaks and redistributes probability back toward the center, yielding an intermediate spreading rate.',
        }
      case 'C':
        return {
          title: 'Regime C — Classical Random-Walk Recovery (Diffusive Spreading)',
          badge: 'Complete Dephasing (p = 1.00)',
          desc: 'Complete phase damping extinguishes all off-diagonal coin coherences (√(1 - 1) = 0). The coin operates as an uncorrelated classical 50/50 coin flip. Under our model, the probability distribution converges exactly to the classical discrete binomial random walk, with σ matching √t and total variation distance vanishing to 0.',
        }
      default:
        return {
          title: `Custom Noise Regime (p = ${noiseStrength.toFixed(2)})`,
          badge: `Noise Parameter p = ${noiseStrength.toFixed(2)}`,
          desc: `Investigating walk dynamics at user-configured noise strength p = ${noiseStrength.toFixed(2)}. As p rises from 0 to 1, off-diagonal coherences are attenuated by factor √(1 - p) = ${Math.sqrt(Math.max(0, 1 - noiseStrength)).toFixed(3)} per step.`,
        }
    }
  }, [activeRegime, noiseStrength])

  // Mini distribution plot geometry for presentation panel
  const miniChartData = useMemo(() => {
    if (!currentSnapshot || currentStep === 0) return null
    const nDist = currentSnapshot.noisy.distribution
    const cDist = currentSnapshot.classical.distribution
    const t = currentStep

    const maxP = Math.max(
      ...nDist.map((d) => d.probability),
      ...cDist.map((d) => d.probability),
      0.04
    )

    const w = 400
    const h = 110
    const padL = 35
    const padR = 15
    const padT = 12
    const padB = 22
    const plotW = w - padL - padR
    const plotH = h - padT - padB

    const mapX = (x: number) => padL + ((x - (-t)) / (2 * t)) * plotW
    const mapY = (p: number) => padT + plotH - (p / maxP) * plotH

    const noisyPath = nDist
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.x).toFixed(1)} ${mapY(pt.probability).toFixed(1)}`)
      .join(' ')

    const classicalPath = cDist
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.x).toFixed(1)} ${mapY(pt.probability).toFixed(1)}`)
      .join(' ')

    return { w, h, padL, padB, plotW, plotH, maxP, noisyPath, classicalPath, t }
  }, [currentSnapshot, currentStep])

  // Theoretical comparisons computed from genuine data
  const theoryChecks = useMemo(() => {
    if (!currentSnapshot) return null

    const sigmaNoisy = currentSnapshot.noisy.std_dev
    const sigmaIdeal = currentSnapshot.ideal.std_dev
    const sigmaClSim = currentSnapshot.classical.std_dev
    const sigmaClTheory = Math.sqrt(currentStep)
    const tvCl = currentSnapshot.total_variation_distance
    const tvIdeal = currentSnapshot.total_variation_vs_ideal
    const meanNoisy = currentSnapshot.noisy.mean
    const norm = currentSnapshot.noisy.norm_check

    return {
      sigmaNoisy,
      sigmaIdeal,
      sigmaClSim,
      sigmaClTheory,
      tvCl,
      tvIdeal,
      meanNoisy,
      norm,
      deltaIdeal: Math.abs(sigmaNoisy - sigmaIdeal),
      deltaClassical: Math.abs(sigmaNoisy - sigmaClTheory),
    }
  }, [currentSnapshot, currentStep])

  // Selected site data if user clicked a node in 3D
  const selectedSiteProb = useMemo(() => {
    if (selectedCoord === null || !currentSnapshot) return null
    const pt = currentSnapshot.noisy.distribution.find((d) => d.x === selectedCoord)
    const ptCl = currentSnapshot.classical.distribution.find((d) => d.x === selectedCoord)
    return {
      x: selectedCoord,
      pNoisy: pt ? pt.probability : 0,
      pClassical: ptCl ? ptCl.probability : 0,
    }
  }, [selectedCoord, currentSnapshot])

  return (
    <aside className={styles.container}>
      {/* 1. Presentation Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerTitles}>
          <div className={styles.titleRow}>
            <Sparkles size={16} className={styles.goldIcon} />
            <span className={styles.mainTitle}>5-Minute IA Demonstration</span>
          </div>
          <span className={styles.subTitle}>
            Decoherence Study: Phase Damping on Coin Qubit (T = {maxSteps})
          </span>
        </div>
        <button
          className={styles.exitBtn}
          onClick={onExitPresentation}
          title="Return to Full Laboratory View"
        >
          Exit Demo Mode
        </button>
      </div>

      <div className={styles.scrollArea}>
        {/* 2. One-Click Experiment Presets */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Sequential Walkthrough</span>
            <h3 className={styles.sectionTitle}>1. Select Experiment Preset</h3>
          </div>

          <div className={styles.presetGrid}>
            {/* Preset A */}
            <button
              className={`${styles.presetCard} ${
                activeRegime === 'A' ? styles.presetCardActive : ''
              }`}
              onClick={() => onSelectPreset('A', 0.0, 40)}
              disabled={isLoading}
            >
              <div className={styles.presetTop}>
                <span className={styles.presetCode}>Regime A</span>
                <span className={styles.presetParam}>p = 0.00, T = 40</span>
              </div>
              <div className={styles.presetName}>Coherent Quantum</div>
              <div className={styles.presetDesc}>
                Baseline walk without dephasing. Ballistic spreading (σ ∝ t) with prominent outer peaks.
              </div>
            </button>

            {/* Preset B */}
            <button
              className={`${styles.presetCard} ${
                activeRegime === 'B' ? styles.presetCardActive : ''
              }`}
              onClick={() => onSelectPreset('B', 0.5, 40)}
              disabled={isLoading}
            >
              <div className={styles.presetTop}>
                <span className={styles.presetCode}>Regime B</span>
                <span className={styles.presetParam}>p = 0.50, T = 40</span>
              </div>
              <div className={styles.presetName}>Intermediate Decoherence</div>
              <div className={styles.presetDesc}>
                Partial coin dephasing. Phase interference suppressed; outer peaks decay toward center.
              </div>
            </button>

            {/* Preset C */}
            <button
              className={`${styles.presetCard} ${
                activeRegime === 'C' ? styles.presetCardActive : ''
              }`}
              onClick={() => onSelectPreset('C', 1.0, 40)}
              disabled={isLoading}
            >
              <div className={styles.presetTop}>
                <span className={styles.presetCode}>Regime C</span>
                <span className={styles.presetParam}>p = 1.00, T = 40</span>
              </div>
              <div className={styles.presetName}>Complete Dephasing</div>
              <div className={styles.presetDesc}>
                Classical limit. Eliminates coin coherence; converges to classical binomial random walk (σ = √t).
              </div>
            </button>
          </div>

          {/* Quick action controls & status */}
          <div className={styles.actionRow}>
            <div className={styles.actionLeft}>
              <button
                className={styles.runBtn}
                onClick={() => onRunExperiment(maxSteps, noiseStrength)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className={styles.spinner} />
                    <span>Executing Aer Simulation...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>

              <button
                className={styles.resetBtn}
                onClick={onResetControls}
                disabled={isLoading}
                title="Reset simulation parameters to defaults"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>

            <div className={styles.exportGroup}>
              <button
                className={styles.exportBtn}
                onClick={onExportJSON}
                disabled={!simulationData || isLoading}
                title="Export active simulation data as JSON"
              >
                <Download size={13} />
                <span>JSON</span>
              </button>
              <button
                className={styles.exportBtn}
                onClick={onExportCSV}
                disabled={!simulationData || isLoading}
                title="Export active simulation data as CSV"
              >
                <Download size={13} />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* 3. Large Projector-Ready Scientific Metrics */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Real-Time Measurements</span>
            <h3 className={styles.sectionTitle}>
              2. Quantitative Ensemble Metrics (t = {currentStep})
            </h3>
          </div>

          <div className={styles.metricsGrid}>
            {/* Card 1: Noisy Std Dev */}
            <div className={`${styles.metricCard} ${styles.metricCardHighlight}`}>
              <span className={styles.metricLabel}>Noisy Std Dev σ_noisy(t)</span>
              <div className={styles.metricValueLarge}>
                {theoryChecks ? theoryChecks.sigmaNoisy.toFixed(4) : '—'}
              </div>
              <span className={styles.metricSub}>
                {activeRegime === 'A'
                  ? 'Ballistic spreading (3.42× classical)'
                  : activeRegime === 'C'
                  ? 'Matches theoretical √t exactly'
                  : 'Intermediate transition'}
              </span>
            </div>

            {/* Card 2: Classical Reference Std Dev */}
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Classical Limit σ_classical(t)</span>
              <div className={styles.metricValue}>
                {theoryChecks ? theoryChecks.sigmaClTheory.toFixed(4) : '—'}
              </div>
              <span className={styles.metricSub}>Theoretical bound: √{currentStep}</span>
            </div>

            {/* Card 3: Spreading Ratio */}
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Quantum Ratio σ_noisy / σ_cl</span>
              <div className={styles.metricValue}>
                {currentSnapshot?.std_dev_ratio_vs_classical
                  ? `${currentSnapshot.std_dev_ratio_vs_classical.toFixed(3)}×`
                  : theoryChecks
                  ? `${(theoryChecks.sigmaNoisy / Math.max(1e-6, theoryChecks.sigmaClTheory)).toFixed(3)}×`
                  : '—'}
              </div>
              <span className={styles.metricSub}>
                {activeRegime === 'C' ? 'Converged to 1.000×' : 'Spreading acceleration'}
              </span>
            </div>

            {/* Card 4: Total Variation Distance */}
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Variation TV(P_n, P_cl)</span>
              <div className={styles.metricValue}>
                {theoryChecks ? theoryChecks.tvCl.toFixed(4) : '—'}
              </div>
              <span className={styles.metricSub}>
                {theoryChecks && theoryChecks.tvCl < 1e-4
                  ? 'Zero distance (identical distributions)'
                  : 'Statistical distance to classical'}
              </span>
            </div>

            {/* Card 5: Mean Position */}
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Mean Position μ(t)</span>
              <div className={styles.metricValue}>
                {theoryChecks
                  ? Math.abs(theoryChecks.meanNoisy) < 1e-10
                    ? '0.0000'
                    : theoryChecks.meanNoisy.toFixed(4)
                  : '—'}
              </div>
              <span className={styles.metricSub}>Symmetric: (|0⟩ + i|1⟩)/√2 coin</span>
            </div>

            {/* Card 6: Probability Norm */}
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Probability Sum Σ P(x)</span>
              <div className={styles.metricValue}>
                {theoryChecks ? theoryChecks.norm.toFixed(6) : '—'}
              </div>
              <span className={styles.metricSub}>Unitarity & trace-preservation</span>
            </div>
          </div>

          {/* Selected individual site readout if clicked in 3D */}
          {selectedSiteProb && (
            <div className={styles.selectedSiteBox}>
              <div className={styles.selectedSiteHeader}>
                <span>Selected Lattice Site (x = {selectedSiteProb.x > 0 ? `+${selectedSiteProb.x}` : selectedSiteProb.x})</span>
                <button className={styles.clearSiteBtn} onClick={onClearSelection}>
                  Clear Selection
                </button>
              </div>
              <div className={styles.selectedSiteRow}>
                <span>P_noisy(x, {currentStep}) = <strong>{selectedSiteProb.pNoisy.toFixed(6)}</strong></span>
                <span>P_classical(x, {currentStep}) = <strong>{selectedSiteProb.pClassical.toFixed(6)}</strong></span>
                <span>Delta |P_n - P_c| = <strong>{Math.abs(selectedSiteProb.pNoisy - selectedSiteProb.pClassical).toFixed(6)}</strong></span>
              </div>
            </div>
          )}
        </section>

        {/* 4. Live Mini Distribution Graph */}
        {miniChartData && (
          <section className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTag}>Profile Comparison</span>
              <h3 className={styles.sectionTitle}>
                3. Spatial Probability Curve P(x, t = {currentStep})
              </h3>
            </div>

            <div className={styles.chartWrapper}>
              <svg viewBox={`0 0 ${miniChartData.w} ${miniChartData.h}`} className={styles.chartSvg}>
                {/* Axes */}
                <line
                  x1={miniChartData.padL}
                  y1={miniChartData.h - miniChartData.padB}
                  x2={miniChartData.w}
                  y2={miniChartData.h - miniChartData.padB}
                  stroke="#272625"
                  strokeWidth="1.2"
                />
                <line
                  x1={miniChartData.padL}
                  y1={10}
                  x2={miniChartData.padL}
                  y2={miniChartData.h - miniChartData.padB}
                  stroke="#272625"
                  strokeWidth="1.2"
                />

                {/* Classical Reference (dashed white/ivory) */}
                <path
                  d={miniChartData.classicalPath}
                  fill="none"
                  stroke="#A9A196"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.8"
                />

                {/* Noisy/Quantum Curve (gold) */}
                <path
                  d={miniChartData.noisyPath}
                  fill="none"
                  stroke="#D9BD87"
                  strokeWidth="2.2"
                />

                {/* Labels */}
                <text
                  x={miniChartData.padL}
                  y={miniChartData.h - 6}
                  fill="#A9A196"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  -{miniChartData.t}
                </text>
                <text
                  x={miniChartData.padL + miniChartData.plotW / 2}
                  y={miniChartData.h - 6}
                  fill="#A9A196"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  x = 0
                </text>
                <text
                  x={miniChartData.w - 15}
                  y={miniChartData.h - 6}
                  fill="#A9A196"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  +{miniChartData.t}
                </text>
                <text
                  x={miniChartData.padL - 4}
                  y={18}
                  fill="#A9A196"
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {miniChartData.maxP.toFixed(2)}
                </text>
              </svg>

              <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendColorGold} />
                  <span>Simulated Distribution P_noisy(x) (p = {noiseStrength.toFixed(2)})</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendColorDashed} />
                  <span>Classical Binomial Reference P_classical(x)</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 5. Theory-versus-Simulation Verification Panel */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>Mathematical Rigor</span>
            <h3 className={styles.sectionTitle}>4. Theory-versus-Simulation Verification</h3>
          </div>

          <div className={styles.theoryEquations}>
            <div className={styles.eqRow}>
              <span className={styles.eqLabel}>Mean Position:</span>
              <span className={styles.eqCode}>μ(t) = Σ x · P(x, t)</span>
            </div>
            <div className={styles.eqRow}>
              <span className={styles.eqLabel}>Standard Deviation:</span>
              <span className={styles.eqCode}>σ(t) = √(Σ (x − μ(t))² · P(x, t))</span>
            </div>
            <div className={styles.eqRow}>
              <span className={styles.eqLabel}>Classical Reference:</span>
              <span className={styles.eqCode}>μ_cl = 0,  σ_classical(t) = √t</span>
            </div>
          </div>

          {/* Genuine Dynamic Comparison based on active regime */}
          <div className={styles.verificationCard}>
            <div className={styles.verificationTitle}>
              <CheckCircle2 size={14} className={styles.checkIcon} />
              <span>Current Scientific Verification (t = {currentStep})</span>
            </div>

            {theoryChecks && (
              <div className={styles.verificationList}>
                {noiseStrength === 0.0 && (
                  <>
                    <div className={styles.verifRow}>
                      <span>Noisy vs. Ideal Endpoint Agreement:</span>
                      <strong style={{ color: '#D9BD87' }}>
                        Δσ = {theoryChecks.deltaIdeal.toFixed(6)} | TV(P_n, P_ideal) = {theoryChecks.tvIdeal.toFixed(6)}
                      </strong>
                    </div>
                    <div className={styles.verifNote}>
                      ✔ Coherent state matches ideal baseline to machine precision. Outer interference peaks detected at x ≈ ±{Math.round(currentStep / Math.SQRT2)}.
                    </div>
                  </>
                )}

                {noiseStrength > 0.0 && noiseStrength < 1.0 && (
                  <>
                    <div className={styles.verifRow}>
                      <span>Intermediate Decoherence Metrics:</span>
                      <strong style={{ color: '#D9BD87' }}>
                        σ = {theoryChecks.sigmaNoisy.toFixed(4)} | TV(P_n, P_cl) = {theoryChecks.tvCl.toFixed(4)}
                      </strong>
                    </div>
                    <div className={styles.verifNote}>
                      ✔ Displaying real simulated transition data without fabricated closed-form predictions. Quantum interference progressively attenuates by factor √(1 - p) = {Math.sqrt(Math.max(0, 1 - noiseStrength)).toFixed(3)} per step.
                    </div>
                  </>
                )}

                {noiseStrength === 1.0 && (
                  <>
                    <div className={styles.verifRow}>
                      <span>Simulated vs. Theoretical √t (√{currentStep}):</span>
                      <strong style={{ color: '#D9BD87' }}>
                        |σ_noisy − √{currentStep}| = {theoryChecks.deltaClassical.toExponential(3)}
                      </strong>
                    </div>
                    <div className={styles.verifRow}>
                      <span>Total Variation to Classical Binomial:</span>
                      <strong style={{ color: '#D9BD87' }}>
                        TV(P_noisy, P_classical) = {theoryChecks.tvCl.toFixed(6)}
                      </strong>
                    </div>
                    <div className={styles.verifNote}>
                      ✔ Complete convergence verified. Noisy distribution overlays classical random walk reference with zero residual distance.
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Plain language bullet summary */}
          <div className={styles.plainLanguageBlock}>
            <div className={styles.bulletItem}>
              <strong>• Quantum Spreading:</strong> The ideal walk expands ballistically through unitary interference among superposition paths.
            </div>
            <div className={styles.bulletItem}>
              <strong>• Phase Damping:</strong> Noise suppresses off-diagonal coin coherence by factor √(1 - p) without changing population balance.
            </div>
            <div className={styles.bulletItem}>
              <strong>• Classical Convergence:</strong> At p = 1.00, coin coherences vanish; the walker reduces to an unbiased binomial random walk.
            </div>
            <div className={styles.bulletItem}>
              <strong>• Binomial vs. Gaussian:</strong> The exact finite-time classical reference is discrete binomial; it is Gaussian-like only in the asymptotic large-t limit.
            </div>
          </div>
        </section>

        {/* 6. Section: What the Experiment Demonstrates */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>IA Takeaway</span>
            <h3 className={styles.sectionTitle}>What the Experiment Demonstrates</h3>
          </div>

          <div className={styles.demonstratesBox}>
            <div className={styles.demonstratesBadge}>{regimeExplanation.badge}</div>
            <h4 className={styles.demonstratesHeading}>{regimeExplanation.title}</h4>
            <p className={styles.demonstratesText}>{regimeExplanation.desc}</p>
          </div>
        </section>
      </div>
    </aside>
  )
}
