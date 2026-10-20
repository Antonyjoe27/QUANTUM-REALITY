import { ArrowRight, BookOpen, CheckCircle, Code, Cpu, FileText, Info } from 'lucide-react'
import styles from '../styles/ContentView.module.css'

interface IADocumentationViewProps {
  onGoToWorkbench: () => void
}

export function IADocumentationView({ onGoToWorkbench }: IADocumentationViewProps) {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.badgeRow}>
            <span className={styles.badge}>Internal Assessment Dossier</span>
            <span className={styles.badge}>QUANTUM REALITY</span>
          </div>
          <h1 className={styles.title}>Project Documentation & Academic Rubric</h1>
          <p className={styles.subtitle}>
            Comprehensive technical and academic documentation for the third-year university
            Internal Assessment: "Decoherence Study of a Quantum Walk".
          </p>
        </div>

        {/* Project Summary Banner */}
        <div className={styles.card} style={{ background: 'rgba(27, 26, 24, 0.95)' }}>
          <div className={styles.cardTitle}>
            <FileText size={16} />
            Academic Title & Investigation Focus
          </div>
          <div className={styles.cardBody} style={{ fontSize: '0.9rem' }}>
            <strong>Project Name:</strong> QUANTUM REALITY<br />
            <strong>Subtitle:</strong> Decoherence Study of a Quantum Walk<br />
            <strong>Core Research Question:</strong> How does the systematic addition of phase-damping
            noise to the coin operation of a discrete-time quantum walk transition the spatial
            probability distribution from ballistic quantum interference to classical diffusive spreading,
            and how is this transition quantified by the scaling of the standard deviation σ(t)?
          </div>
        </div>

        {/* Grid of Rubric Sections */}
        <div className={styles.gridTwo}>
          {/* Card 1: Technology Stack */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Code size={16} />
              Verified Technology Stack
            </div>
            <div className={styles.cardBody}>
              All tools are locked to reproducible, verified versions:
            </div>
            <div className={styles.mathBlock}>
              • 3D Environment: Blender 5.2.2 LTS (GLB export)<br />
              • Frontend: React 19, TypeScript, Vite, Three.js, R3F<br />
              • Backend: Python 3.11.9, FastAPI, Uvicorn<br />
              • Quantum Engine: Qiskit 2.6.0, Qiskit Aer 0.18.0<br />
              • Numerics & Testing: NumPy 2.4.6, Pytest 9.1.1
            </div>
          </div>

          {/* Card 2: Assessment Criteria Alignment */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <BookOpen size={16} />
              Assessment Rubric Strategy
            </div>
            <div className={styles.cardBody}>
              Development is structured around the IA marking criteria:
            </div>
            <div className={styles.mathBlock}>
              1. Quantum Concepts: Superposition, interference, decoherence<br />
              2. Circuit Design: Hadamard coin, Kraus noise, conditional shift<br />
              3. Analysis: Ballistic (σ ∝ t) vs Diffusive (σ ∝ √t) scaling<br />
              4. Validation (10 marks): Comparison to classical σ = √t<br />
              5. Technical Report: Resource limits, registers, hardware noise
            </div>
          </div>

          {/* Card 3: Milestone Roadmap */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <CheckCircle size={16} />
              Development Milestone Roadmap
            </div>
            <div className={styles.cardBody}>
              Progress follows the mandatory milestone sequence:
            </div>
            <div className={styles.mathBlock}>
              M1. Environment inspection ................... [ COMPLETED ]<br />
              M2. Project scaffolding & tests ............... [ COMPLETED ]<br />
              M3. Interactive 3D workbench ................. [ COMPLETED ]<br />
              M3.1 UI recovery & coin redesign ............. [ COMPLETED ]<br />
              M4. Blender asset pipeline & interactions .... [ CURRENT ]<br />
              M5. Quantum-walk simulation engine ........... [ QUEUED ]<br />
              M6. Dephasing noise experiment ............... [ QUEUED ]<br />
              M7. Standard deviation & classical comparison . [ QUEUED ]<br />
              M8. Frontend/backend integration ............. [ QUEUED ]<br />
              M9. Noisy simulation validation .............. [ QUEUED ]<br />
              M10. Final academic report & evidence ........ [ QUEUED ]
            </div>
          </div>

          {/* Card 4: Scientific Integrity Policy */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Cpu size={16} />
              Scientific Integrity Standards
            </div>
            <div className={styles.cardBody}>
              Strict rules enforced throughout the project:
            </div>
            <div className={styles.mathBlock}>
              • Never fabricate quantum probability distributions<br />
              • Never fake standard-deviation scaling exponents<br />
              • Distinguish theoretical, exact, and shot-sampled data<br />
              • Clearly label simulation status (Engine Offline)<br />
              • Retain execution logs and test suite outputs as evidence
            </div>
          </div>
        </div>

        {/* Notice of scientific status */}
        <div className={styles.notice}>
          <Info size={18} style={{ flexShrink: 0, color: 'var(--champagne-gold)' }} />
          <span>
            <strong>Reproducibility:</strong> All code, scripts, Blender automation files,
            and test suites are version-controlled in the repository at <code>D:\VISHAL ANNAN</code>.
            Detailed execution instructions and test logs are retained in the <code>evidence/</code> folder.
          </span>
        </div>

        {/* Action Row */}
        <div className={styles.actionRow}>
          <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
            Return to the interactive 3D laboratory workbench.
          </span>
          <button className={styles.actionBtn} onClick={onGoToWorkbench}>
            Go to 3D Workbench
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
