import { Activity, ArrowRight, BookOpen, Cpu, Info, ShieldAlert } from 'lucide-react'
import styles from '../styles/ContentView.module.css'

interface NoiseChannelViewProps {
  onGoToWorkbench: () => void
}

export function NoiseChannelView({ onGoToWorkbench }: NoiseChannelViewProps) {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>Assigned Research Topic</span>
            <span className={styles.badge}>Decoherence Study</span>
          </div>
          <h1 className={styles.title}>Quantum Noise & Decoherence Channels</h1>
          <p className={styles.subtitle}>
            Investigating the quantum-to-classical transition by subjecting the coin operation
            to environmental phase damping and depolarizing noise channels.
          </p>
        </div>

        {/* Assigned Problem Statement Banner */}
        <div className={styles.card} style={{ borderColor: 'var(--champagne-gold)', background: 'rgba(27, 26, 24, 0.95)' }}>
          <div className={styles.cardTitle}>
            <BookOpen size={16} />
            Assigned Problem Statement
          </div>
          <div className={styles.cardBody} style={{ fontSize: '0.92rem', color: 'var(--warm-ivory)' }}>
            <em>
              "Decoherence study: Add dephasing or depolarizing noise to the coin operation of a
              quantum walk. Show how the distribution moves from quantum (two-peaked, spread out)
              to classical (Gaussian), and quantify using the standard deviation."
            </em>
          </div>
        </div>

        {/* Grid of Concept Cards */}
        <div className={styles.gridTwo}>
          {/* Card 1: Phase Damping */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Activity size={16} />
              1. Phase Damping / Dephasing (Primary Experiment)
            </div>
            <div className={styles.cardBody}>
              Phase damping models the loss of quantum coherence without energy relaxation.
              Applied to the coin qubit after each coin step:
            </div>
            <div className={styles.mathBlock}>
              E_0 = √(1 - p) · I<br />
              E_1 = √p · Z = √p [ [1,  0],<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[0, -1] ]
            </div>
            <div className={styles.cardBody}>
              Action on the coin density matrix <strong>ρ_c</strong>:
            </div>
            <div className={styles.mathBlock}>
              [ [ ρ_00,       ρ_01 ],<br />
              &nbsp;&nbsp;[ ρ_10,       ρ_11 ] ]<br />
              &nbsp;&nbsp;&nbsp;&nbsp;↓<br />
              [ [ ρ_00,       (1-2p)ρ_01 ],<br />
              &nbsp;&nbsp;[ (1-2p)ρ_10, ρ_11       ] ]
            </div>
            <div className={styles.cardBody}>
              Population probabilities are strictly conserved, but phase coherences decay
              exponentially, extinguishing interference.
            </div>
          </div>

          {/* Card 2: Depolarizing Noise */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <ShieldAlert size={16} />
              2. Depolarizing Noise (Optional Extension)
            </div>
            <div className={styles.cardBody}>
              Depolarizing noise introduces complete isotropic decoherence, replacing the state
              with the maximally mixed state with probability p:
            </div>
            <div className={styles.mathBlock}>
              E_depol(ρ) = (1 - p)ρ + (p / 2) · I
            </div>
            <div className={styles.cardBody}>
              Kraus operators:
            </div>
            <div className={styles.mathBlock}>
              E_0 = √(1 - 3p/4) · I<br />
              E_1 = √(p/4) · X<br />
              E_2 = √(p/4) · Y<br />
              E_3 = √(p/4) · Z
            </div>
            <div className={styles.cardBody}>
              This will be evaluated as a secondary study in Milestone 6 following validation of
              the primary phase-damping channel.
            </div>
          </div>

          {/* Card 3: Spreading Regimes */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Cpu size={16} />
              3. Spreading Regimes & Standard Deviation
            </div>
            <div className={styles.cardBody}>
              The hallmark signature of the quantum-to-classical transition is quantified by the
              standard deviation <strong>σ(t)</strong> of the position distribution:
            </div>
            <div className={styles.mathBlock}>
              μ(t) = ∑ x · P(x, t)<br />
              σ(t) = √( ∑ (x - μ(t))² · P(x, t) )
            </div>
            <div className={styles.cardBody}>
              <strong>Coherent Quantum Walk (p = 0):</strong><br />
              • Ballistic spreading: <strong>σ(t) ∝ t</strong> (scaling exponent α ≈ 1.0)<br />
              • Distinct bimodal peaks at wavefront edges<br /><br />
              <strong>Strongly Decohered Walk (p → 1):</strong><br />
              • Classical diffusive spreading: <strong>σ(t) ∝ √t</strong> (scaling exponent α ≈ 0.5)<br />
              • Central binomial / Gaussian distribution
            </div>
          </div>

          {/* Card 4: Classical Reference */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Info size={16} />
              4. Classical Reference Standard
            </div>
            <div className={styles.cardBody}>
              For an unbiased classical random walk on a 1D lattice with independent left/right
              steps of unit length:
            </div>
            <div className={styles.mathBlock}>
              P_classical(x, t) = (1/2^t) · ( t choose (t+x)/2 )<br />
              σ_classical(t) = √t
            </div>
            <div className={styles.cardBody}>
              Our investigation will compare actual computed σ(t) from noisy quantum simulations
              against this exact theoretical reference benchmark.
            </div>
          </div>
        </div>

        {/* Notice of scientific status */}
        <div className={styles.notice}>
          <Info size={18} style={{ flexShrink: 0, color: 'var(--champagne-gold)' }} />
          <span>
            <strong>Simulation Status:</strong> Noise parameters and Kraus operator channels
            will be wired directly into Qiskit Aer's <code>NoiseModel</code> in{' '}
            <strong>Milestone 6</strong>. No hard-coded spreading exponents or fake Gaussian
            plots are displayed.
          </span>
        </div>

        {/* Action Row */}
        <div className={styles.actionRow}>
          <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
            Inspect the physical coin qubit module and 1D track sites.
          </span>
          <button className={styles.actionBtn} onClick={onGoToWorkbench}>
            Inspect 3D Workbench
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
