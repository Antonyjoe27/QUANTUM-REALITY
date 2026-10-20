import React, { Suspense, useRef, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Lightformer } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { RotateCcw } from 'lucide-react'
import { WorkbenchModel } from './WorkbenchModel'
import { ProbabilityBars3D } from './ProbabilityBars3D'
import { TimestepScrubber } from './TimestepScrubber'
import { OBJECT_METADATA } from '../types/workbench'
import type { DecoherenceWalkResponse } from '../api/client'
import styles from '../styles/WorkbenchScene.module.css'

interface WorkbenchSceneProps {
  hoveredId: string | null
  selectedId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string | null) => void
  simulationData: DecoherenceWalkResponse | null
  currentStep: number
  onStepChange: (step: number) => void
  noiseStrength: number
  selectedCoord: number | null
  hoveredCoord: number | null
  onHoverCoord: (coord: number | null) => void
  onSelectCoord: (coord: number | null) => void
}

const DEFAULT_CAMERA_POS: [number, number, number] = [0, 4.4, 7.8]
const DEFAULT_TARGET_POS: [number, number, number] = [0, 0.2, 0]

export function WorkbenchScene({
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  simulationData,
  currentStep,
  onStepChange,
  noiseStrength,
  selectedCoord,
  hoveredCoord,
  onHoverCoord,
  onSelectCoord,
}: WorkbenchSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...DEFAULT_TARGET_POS)
      controlsRef.current.object.position.set(...DEFAULT_CAMERA_POS)
      controlsRef.current.object.lookAt(...DEFAULT_TARGET_POS)
      controlsRef.current.update()
    }
  }, [])

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const activeHoverMeta = hoveredId ? OBJECT_METADATA[hoveredId] : null
  const currentSnapshot = simulationData && simulationData.timesteps.length > currentStep
    ? simulationData.timesteps[currentStep]
    : null

  return (
    <div
      className={styles.viewportContainer}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        onHover(null)
        onHoverCoord(null)
      }}
    >
      {/* 3D Scene Controls & Legend Overlay */}
      <div className={styles.controlsOverlay}>
        <button
          className={styles.controlBtn}
          onClick={resetCamera}
          title="Reset Camera View to Default Perspective"
        >
          <RotateCcw size={14} />
          Reset View
        </button>

        <div className={styles.legendPill}>
          <div className={styles.legendDot} />
          <span>
            {simulationData
              ? `Lattice Track (t = ${currentStep}/${simulationData.max_steps}, p = ${simulationData.noise_strength.toFixed(2)})`
              : '9 Lattice Reference Sites | Hadamard Coin'}
          </span>
        </div>
      </div>

      {/* Floating Contextual Tooltip for Object Selection */}
      {activeHoverMeta && (
        <div
          className={styles.tooltip}
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className={styles.tooltipTitle}>{activeHoverMeta.title}</div>
          <div className={styles.tooltipSub}>{activeHoverMeta.description}</div>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <div className={styles.canvasWrapper}>
        <Canvas
          shadows
          dpr={[1, 2]}
          onPointerMissed={() => {
            onSelect(null)
            onSelectCoord(null)
          }}
          gl={{
            antialias: true,
            toneMappingExposure: 1.20,
          }}
        >
          <PerspectiveCamera
            makeDefault
            position={DEFAULT_CAMERA_POS}
            fov={42}
            near={0.1}
            far={100}
          />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            target={DEFAULT_TARGET_POS}
            minDistance={3.2}
            maxDistance={24}
            maxPolarAngle={Math.PI / 2 - 0.05} // Constrain camera above tabletop
          />

          {/* Balanced studio lighting matching Obsidian & Champagne Gold system */}
          <hemisphereLight args={['#F0E9DB', '#1B1A18', 0.85]} />

          {/* Key Light — Warm studio illumination */}
          <directionalLight
            position={[6, 9, 6]}
            intensity={2.6}
            color="#FFF8EE"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-bias={-0.0001}
          />

          {/* Fill Light — Highlight gold tone from left */}
          <directionalLight
            position={[-7, 6, 5]}
            intensity={1.8}
            color="#D9BD87"
          />

          {/* Rim Light — Champagne gold edge separation from back */}
          <directionalLight
            position={[0, 6, -7]}
            intensity={1.6}
            color="#C6A66B"
          />

          {/* Track Fill Lights */}
          <pointLight
            position={[-3.2, 2.0, 0.6]}
            intensity={1.2}
            color="#D9BD87"
            distance={10}
          />
          <pointLight
            position={[3.2, 2.0, 0.6]}
            intensity={1.2}
            color="#D9BD87"
            distance={10}
          />
          <pointLight
            position={[0, 2.2, 0.6]}
            intensity={1.5}
            color="#F0E9DB"
            distance={8}
          />

          {/* Studio Reflections */}
          <Environment resolution={256}>
            <Lightformer
              form="rect"
              intensity={3.0}
              color="#F0E9DB"
              position={[0, 8, 0]}
              scale={[16, 6, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={2.0}
              color="#C6A66B"
              position={[-8, 4, 3]}
              scale={[8, 3, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={2.0}
              color="#D9BD87"
              position={[8, 4, 3]}
              scale={[8, 3, 1]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="ring"
              intensity={1.2}
              color="#A9A196"
              position={[0, 3, 7]}
              scale={5}
              target={[0, 0, 0]}
            />
          </Environment>

          {/* Blender Workbench Model */}
          <Suspense fallback={null}>
            <WorkbenchModel
              hoveredId={hoveredId}
              selectedId={selectedId}
              onHover={onHover}
              onSelect={onSelect}
            />

            {/* Dynamic 3D Probability Bars */}
            <ProbabilityBars3D
              snapshot={currentSnapshot}
              noiseStrength={noiseStrength}
              selectedCoord={selectedCoord}
              hoveredCoord={hoveredCoord}
              onHoverCoord={onHoverCoord}
              onSelectCoord={onSelectCoord}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Floating Timestep Scrubber Docked at Bottom of Viewport */}
      {simulationData && (
        <div className={styles.scrubberDock}>
          <TimestepScrubber
            currentStep={currentStep}
            maxSteps={simulationData.max_steps}
            onStepChange={onStepChange}
          />
        </div>
      )}
    </div>
  )
}
