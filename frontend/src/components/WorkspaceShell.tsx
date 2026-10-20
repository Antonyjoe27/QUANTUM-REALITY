import { FlaskConical, Info } from 'lucide-react'
import styles from '../styles/WorkspaceShell.module.css'

export function WorkspaceShell() {
  return (
    <main className={styles.workspace}>
      <div className={styles.shell}>
        {/* Panel title bar */}
        <div className={styles['shell__titlebar']}>
          <span className={styles['shell__titlebar-label']}>
            Experiment Workspace
          </span>
          <span className={styles['shell__titlebar-badge']}>
            3D Scene — Pending Milestone 3
          </span>
        </div>

        {/* Body */}
        <div className={styles['shell__body']}>
          <div className={styles['shell__icon']}>
            <FlaskConical size={28} strokeWidth={1.5} />
          </div>

          <h2 className={styles['shell__heading']}>
            Quantum Walk Laboratory
          </h2>

          <p className={styles['shell__description']}>
            The interactive 3D workbench will be built in{' '}
            <strong style={{ color: 'var(--champagne-gold)' }}>Milestone 3</strong>
            {' '}using Blender-created assets and React Three Fiber.
            The simulation engine connects in{' '}
            <strong style={{ color: 'var(--champagne-gold)' }}>Milestone 5</strong>.
            No fabricated distributions or results are displayed.
          </p>

          {/* Status grid */}
          <div className={styles['shell__grid']}>
            <div className={styles['shell__cell']}>
              <div className={styles['shell__cell-label']}>Experiment</div>
              <div className={styles['shell__cell-value']}>Quantum Walk</div>
            </div>
            <div className={styles['shell__cell']}>
              <div className={styles['shell__cell-label']}>Noise Model</div>
              <div className={styles['shell__cell-value']}>Dephasing</div>
            </div>
            <div className={styles['shell__cell']}>
              <div className={styles['shell__cell-label']}>Engine Status</div>
              <div className={styles['shell__cell-value']} style={{ color: 'var(--secondary-text)' }}>
                Disconnected
              </div>
            </div>
            <div className={styles['shell__cell']}>
              <div className={styles['shell__cell-label']}>Coin Operator</div>
              <div className={styles['shell__cell-value']}>Hadamard (H)</div>
            </div>
            <div className={styles['shell__cell']}>
              <div className={styles['shell__cell-label']}>Walk Type</div>
              <div className={styles['shell__cell-value']}>Discrete-time 1D</div>
            </div>
            <div className={styles['shell__cell']}>
              <div className={styles['shell__cell-label']}>Milestone</div>
              <div className={styles['shell__cell-value']}>2 / 10</div>
            </div>
          </div>

          {/* Honest notice */}
          <div className={styles['shell__notice']}>
            <Info
              size={16}
              className={styles['shell__notice-icon']}
              strokeWidth={1.5}
            />
            <p className={styles['shell__notice-text']}>
              <strong>Development notice:</strong> This is a verified scaffold.
              The API health endpoint is live at{' '}
              <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--champagne-gold)' }}>
                localhost:8000/health
              </code>
              . No quantum simulation has been implemented yet. Results, probability
              distributions and standard-deviation values will only appear when
              the simulation engine is connected in a later milestone.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
