import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Header } from './components/Header'
import { WorkbenchScene } from './components/WorkbenchScene'
import { InspectorPanel } from './components/InspectorPanel'
import { PresentationMode } from './components/PresentationMode'
import type { PresentationRegime } from './components/PresentationMode'
import { CoinOperatorView } from './components/CoinOperatorView'
import { NoiseChannelView } from './components/NoiseChannelView'
import { IADocumentationView } from './components/IADocumentationView'
import { fetchDecoherenceSimulation, checkBackendHealth } from './api/client'
import { exportExperimentJSON, exportExperimentCSV } from './utils/exportRecord'
import type { DecoherenceWalkResponse } from './api/client'
import type { ActiveView } from './types/workbench'
import styles from './styles/AppLayout.module.css'

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('workbench')
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false)
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true)

  // Selection & Hover State
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredCoord, setHoveredCoord] = useState<number | null>(null)
  const [selectedCoord, setSelectedCoord] = useState<number | null>(null)

  // Simulation Parameters & State
  const [noiseStrength, setNoiseStrength] = useState<number>(0.5)
  const [maxSteps, setMaxSteps] = useState<number>(15)
  const [currentStep, setCurrentStep] = useState<number>(15)
  const [simulationData, setSimulationData] = useState<DecoherenceWalkResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Abort controller to prevent race conditions from overlapping runs
  const abortControllerRef = useRef<AbortController | null>(null)

  // Determine active preset regime dynamically based on genuine parameters
  const activeRegime: PresentationRegime = useMemo(() => {
    if (maxSteps === 40) {
      if (Math.abs(noiseStrength - 0.0) < 1e-4) return 'A'
      if (Math.abs(noiseStrength - 0.5) < 1e-4) return 'B'
      if (Math.abs(noiseStrength - 1.0) < 1e-4) return 'C'
    }
    return 'custom'
  }, [maxSteps, noiseStrength])

  // Run experiment function: strictly executes actual backend simulation
  const runSimulation = useCallback(
    async (stepsToRun = maxSteps, noiseToRun = noiseStrength) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchDecoherenceSimulation(
          {
            max_steps: stepsToRun,
            noise_strength: noiseToRun,
          },
          controller.signal
        )

        setSimulationData(response)
        setIsBackendOnline(true)
        // Keep current scrubber step within bounds
        setCurrentStep((prev) => (prev > stepsToRun ? stepsToRun : prev))
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return // Request was superseded
        }
        const message = err instanceof Error ? err.message : 'Unknown connection error'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [maxSteps, noiseStrength]
  )

  // Initial backend check and initial simulation fetch on mount
  useEffect(() => {
    checkBackendHealth()
      .then(() => setIsBackendOnline(true))
      .catch(() => setIsBackendOnline(false))

    runSimulation(15, 0.5)

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Preset selection handler: populates parameters and triggers genuine backend run
  const handleSelectPreset = useCallback(
    (_regime: 'A' | 'B' | 'C', p: number, steps: number) => {
      setNoiseStrength(p)
      setMaxSteps(steps)
      setCurrentStep(steps)
      runSimulation(steps, p)
    },
    [runSimulation]
  )

  const handleResetControls = useCallback(() => {
    setNoiseStrength(0.5)
    setMaxSteps(15)
    setCurrentStep(15)
    setSelectedId(null)
    setSelectedCoord(null)
    runSimulation(15, 0.5)
  }, [runSimulation])

  const handleClearSelection = useCallback(() => {
    setSelectedId(null)
    setSelectedCoord(null)
  }, [])

  const handleExportJSON = useCallback(() => {
    if (simulationData) {
      exportExperimentJSON(simulationData, currentStep)
    }
  }, [simulationData, currentStep])

  const handleExportCSV = useCallback(() => {
    if (simulationData) {
      exportExperimentCSV(simulationData)
    }
  }, [simulationData])

  return (
    <div className={styles.appContainer}>
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        isPresentationMode={isPresentationMode}
        onTogglePresentationMode={() => setIsPresentationMode((prev) => !prev)}
        isBackendOnline={isBackendOnline}
      />

      {/* 5-Minute IA Demonstration Mode Layout */}
      {isPresentationMode ? (
        <main className={styles.presentationLayout}>
          <section className={styles.presentationViewport}>
            <WorkbenchScene
              hoveredId={hoveredId}
              selectedId={selectedId}
              onHover={(id) => {
                setHoveredId(id)
                if (id) setHoveredCoord(null)
              }}
              onSelect={(id) => {
                setSelectedId(id)
                if (id) setSelectedCoord(null)
              }}
              simulationData={simulationData}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              noiseStrength={noiseStrength}
              selectedCoord={selectedCoord}
              hoveredCoord={hoveredCoord}
              onHoverCoord={(coord) => {
                setHoveredCoord(coord)
                if (coord !== null) setHoveredId(null)
              }}
              onSelectCoord={(coord) => {
                setSelectedCoord(coord)
                if (coord !== null) setSelectedId(null)
              }}
            />
          </section>

          <section className={styles.presentationSidebar}>
            <PresentationMode
              simulationData={simulationData}
              currentStep={currentStep}
              noiseStrength={noiseStrength}
              maxSteps={maxSteps}
              isLoading={isLoading}
              error={error}
              activeRegime={activeRegime}
              onSelectPreset={handleSelectPreset}
              onRunExperiment={runSimulation}
              onResetControls={handleResetControls}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
              onExitPresentation={() => setIsPresentationMode(false)}
              selectedCoord={selectedCoord}
              onClearSelection={handleClearSelection}
            />
          </section>
        </main>
      ) : (
        /* Full Laboratory Mode Layout: All original functionality preserved */
        <>
          {activeView === 'workbench' && (
            <main className={styles.mainLayout}>
              <section className={styles.viewportSection}>
                <WorkbenchScene
                  hoveredId={hoveredId}
                  selectedId={selectedId}
                  onHover={(id) => {
                    setHoveredId(id)
                    if (id) setHoveredCoord(null)
                  }}
                  onSelect={(id) => {
                    setSelectedId(id)
                    if (id) setSelectedCoord(null)
                  }}
                  simulationData={simulationData}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  noiseStrength={noiseStrength}
                  selectedCoord={selectedCoord}
                  hoveredCoord={hoveredCoord}
                  onHoverCoord={(coord) => {
                    setHoveredCoord(coord)
                    if (coord !== null) setHoveredId(null)
                  }}
                  onSelectCoord={(coord) => {
                    setSelectedCoord(coord)
                    if (coord !== null) setSelectedId(null)
                  }}
                />
              </section>

              <section className={styles.sidebarSection}>
                <InspectorPanel
                  selectedId={selectedId}
                  selectedCoord={selectedCoord}
                  onClearSelection={handleClearSelection}
                  noiseStrength={noiseStrength}
                  maxSteps={maxSteps}
                  onChangeNoise={setNoiseStrength}
                  onChangeMaxSteps={setMaxSteps}
                  onRunExperiment={runSimulation}
                  onResetControls={handleResetControls}
                  onExportJSON={handleExportJSON}
                  onExportCSV={handleExportCSV}
                  isLoading={isLoading}
                  error={error}
                  simulationData={simulationData}
                  currentStep={currentStep}
                />
              </section>
            </main>
          )}

          {activeView === 'coin' && (
            <main className={styles.mainLayout}>
              <CoinOperatorView onGoToWorkbench={() => setActiveView('workbench')} />
            </main>
          )}

          {activeView === 'noise' && (
            <main className={styles.mainLayout}>
              <NoiseChannelView onGoToWorkbench={() => setActiveView('workbench')} />
            </main>
          )}

          {activeView === 'docs' && (
            <main className={styles.mainLayout}>
              <IADocumentationView onGoToWorkbench={() => setActiveView('workbench')} />
            </main>
          )}
        </>
      )}
    </div>
  )
}
