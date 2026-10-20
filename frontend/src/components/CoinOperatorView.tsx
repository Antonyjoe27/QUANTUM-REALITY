import { ArrowRight, Compass, Cpu, Info, Layers } from 'lucide-react'
import styles from '../styles/ContentView.module.css'

interface CoinOperatorViewProps {
  onGoToWorkbench: () => void
}

export function CoinOperatorView({ onGoToWorkbench }: CoinOperatorViewProps) {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>Quantum Walk Theory</span>
            <span className={styles.badge}>Operator C</span>
          </div>
          <h1 className={styles.title}>Quantum Coin Operator (Hadamard Gate)</h1>
          <p className={styles.subtitle}>
            The internal two-level quantum degree of freedom governing spatial translation
            and wavepacket interference on a 1D lattice.
          </p>
        </div>

        {/* Grid of Concept Cards */}
        <div className={styles.gridTwo}>
          {/* Card 1: Hilbert Space */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Cpu size={16} />
              1. The Coin Hilbert Space (H_c)
            </div>
            <div className={styles.cardBody}>
              In a discrete-time quantum walk (DTQW), the total system state lives in
              the composite Hilbert space:
            </div>
            <div className={styles.mathBlock}>
              H_total = H_p ⊗ H_c
            </div>
            <div className={styles.cardBody}>
              where <strong>H_p = span(&#123;|x⟩ : x ∈ ℤ&#125;)</strong> is the infinite
              (or bounded) spatial lattice, and <strong>H_c = span(&#123;|0⟩_c, |1⟩_c&#125;)</strong>
              represents the internal coin qubit <strong>q_c</strong>.
            </div>
            <div className={styles.mathBlock}>
              |0⟩_c = [1, 0]^T  (Right Shift Mode: x + 1)<br />
              |1⟩_c = [0, 1]^T  (Left Shift Mode: x - 1)
            </div>
          </div>

          {/* Card 2: Hadamard Matrix */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Layers size={16} />
              2. Hadamard Coin Transformation (H)
            </div>
            <div className={styles.cardBody}>
              At each discrete timestep, a unitary coin operator <strong>C</strong> is applied
              to rotate the coin state into a superposition. By default, the balanced Hadamard
              coin is chosen:
            </div>
            <div className={styles.mathBlock}>
              H = (1/√2) [ [1,  1],<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[1, -1] ]
            </div>
            <div className={styles.cardBody}>
              Action on computational basis states:
            </div>
            <div className={styles.mathBlock}>
              H|0⟩_c = (|0⟩ + |1⟩) / √2<br />
              H|1⟩_c = (|0⟩ - |1⟩) / √2
            </div>
            <div className={styles.cardBody}>
              Notice the phase factor <strong>-1</strong> on |1⟩. This relative phase is the
              direct origin of quantum interference in the walk.
            </div>
          </div>

          {/* Card 3: Conditional Spatial Shift */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Compass size={16} />
              3. Conditional Spatial Shift Operator (S)
            </div>
            <div className={styles.cardBody}>
              Following coin rotation, the conditional shift operator <strong>S</strong> moves
              the walker conditionally based on the coin basis:
            </div>
            <div className={styles.mathBlock}>
              S = ∑_x ( |x+1⟩⟨x| ⊗ |0⟩⟨0| + |x-1⟩⟨x| ⊗ |1⟩⟨1| )
            </div>
            <div className={styles.cardBody}>
              Single-timestep composite unitary evolution operator:
            </div>
            <div className={styles.mathBlock}>
              U = S · (I_p ⊗ H)
            </div>
            <div className={styles.cardBody}>
              State at timestep t: <strong>|Ψ(t)⟩ = U^t |Ψ(0)⟩</strong>.
            </div>
          </div>

          {/* Card 4: Symmetric Initial States */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Info size={16} />
              4. Coin State Symmetry & Interference
            </div>
            <div className={styles.cardBody}>
              Because Hadamard gives a -1 phase to |1⟩, an initial state of <strong>|0⟩_x ⊗ |0⟩_c</strong>
              produces an asymmetric probability distribution skewed to the right.
            </div>
            <div className={styles.mathBlock}>
              |ψ_sym⟩ = |0⟩_x ⊗ ( |0⟩ + i|1⟩ ) / √2
            </div>
            <div className={styles.cardBody}>
              Injecting a relative phase of <strong>π/2 (i)</strong> cancels the directional
              bias, yielding the classic symmetric, two-peaked ballistic wavepacket.
            </div>
          </div>
        </div>

        {/* Notice of scientific status */}
        <div className={styles.notice}>
          <Info size={18} style={{ flexShrink: 0, color: 'var(--champagne-gold)' }} />
          <span>
            <strong>Simulation Status:</strong> The Quantum Walk Engine will execute full
            statevector and density-matrix simulations in <strong>Milestone 5</strong> via
            Qiskit Aer. Real position probability histograms P(x, t) and mean positions μ(t)
            will be computed directly from Qiskit runs without mock data.
          </span>
        </div>

        {/* Action Row */}
        <div className={styles.actionRow}>
          <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
            Examine the physical coin gate module in the 3D laboratory.
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
