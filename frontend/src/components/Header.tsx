import type { ActiveView } from '../types/workbench'
import styles from '../styles/Header.module.css'

interface HeaderProps {
  activeView: ActiveView
  onSelectView: (view: ActiveView) => void
}

export function Header({ activeView, onSelectView }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.header__inner}>
        {/* Brand / title block */}
        <div className={styles.header__brand} onClick={() => onSelectView('workbench')}>
          <span className={styles.header__title}>Quantum Reality</span>
          <span className={styles.header__subtitle}>
            Decoherence Study of a Quantum Walk
          </span>
        </div>

        {/* Centre navigation */}
        <nav className={styles.header__nav}>
          <button
            className={`${styles['header__nav-item']} ${
              activeView === 'workbench' ? styles['header__nav-item--active'] : ''
            }`}
            onClick={() => onSelectView('workbench')}
            title="Interactive 3D Workbench View"
          >
            3D Workbench
          </button>
          <button
            className={`${styles['header__nav-item']} ${
              activeView === 'coin' ? styles['header__nav-item--active'] : ''
            }`}
            onClick={() => onSelectView('coin')}
            title="Quantum Coin Operator Theory & Shift Mechanics"
          >
            Coin Operator
          </button>
          <button
            className={`${styles['header__nav-item']} ${
              activeView === 'noise' ? styles['header__nav-item--active'] : ''
            }`}
            onClick={() => onSelectView('noise')}
            title="Decoherence Models & Phase Damping Study"
          >
            Noise Channel
          </button>
          <button
            className={`${styles['header__nav-item']} ${
              activeView === 'docs' ? styles['header__nav-item--active'] : ''
            }`}
            onClick={() => onSelectView('docs')}
            title="Internal Assessment Academic Dossier & Rubric"
          >
            IA Documentation
          </button>
        </nav>

        {/* Engine connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={styles.header__milestone}>Milestone 3.1 — Interactive Lab</span>
          <div className={styles.header__status} title="Qiskit Aer simulation backend connects in Milestone 5">
            <div className={`${styles['header__status-dot']} ${styles['header__status-dot--disconnected']}`} />
            <span className={styles['header__status-label']}>Engine offline</span>
          </div>
        </div>
      </div>
    </header>
  )
}
