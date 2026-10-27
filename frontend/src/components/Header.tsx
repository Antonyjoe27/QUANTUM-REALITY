import { Sparkles, LogOut } from 'lucide-react'
import type { ActiveView } from '../types/workbench'
import styles from '../styles/Header.module.css'

interface HeaderProps {
  activeView: ActiveView
  onSelectView: (view: ActiveView) => void
  isPresentationMode: boolean
  onTogglePresentationMode: () => void
  isBackendOnline: boolean
}

export function Header({
  activeView,
  onSelectView,
  isPresentationMode,
  onTogglePresentationMode,
  isBackendOnline,
}: HeaderProps) {
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

        {/* Centre navigation: Streamlined when in Presentation Mode */}
        {isPresentationMode ? (
          <div className={styles.header__presentationBadge}>
            <Sparkles size={14} />
            <span>5-Minute IA Demonstration Mode (T = 40)</span>
          </div>
        ) : (
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
        )}

        {/* Right side controls: Presentation Toggle & Engine connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          {isPresentationMode ? (
            <button
              className={styles.header__exitDemo}
              onClick={onTogglePresentationMode}
              title="Exit Presentation Mode and return to full laboratory view"
            >
              <LogOut size={13} />
              <span>Exit Demo Mode</span>
            </button>
          ) : (
            <button
              className={styles.header__demoToggle}
              onClick={onTogglePresentationMode}
              title="Enter 5-Minute IA Demonstration Mode"
            >
              <Sparkles size={13} />
              <span>5-Min IA Demo</span>
            </button>
          )}

          <div
            className={styles.header__status}
            title={
              isBackendOnline
                ? 'Qiskit Aer simulation engine online'
                : 'Connecting to simulation backend on http://127.0.0.1:8000'
            }
          >
            <div
              className={`${styles['header__status-dot']} ${
                isBackendOnline
                  ? styles['header__status-dot--connected']
                  : styles['header__status-dot--disconnected']
              }`}
            />
            <span className={styles['header__status-label']}>
              {isBackendOnline ? 'Qiskit Aer Online' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
