import { useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { DecoherenceTimestepSnapshot } from '../api/client'

interface ProbabilityBars3DProps {
  snapshot: DecoherenceTimestepSnapshot | null
  noiseStrength: number
  selectedCoord: number | null
  hoveredCoord: number | null
  onHoverCoord: (coord: number | null) => void
  onSelectCoord: (coord: number | null) => void
}

const LATTICE_SPACING = 1.15
const BASE_Y = 0.18
const PROBABILITY_HEIGHT_SCALE = 3.6 // Documented vertical scaling: height = P(x) * 3.6 units
const PROB_THRESHOLD = 0.0001

export function ProbabilityBars3D({
  snapshot,
  noiseStrength,
  selectedCoord,
  hoveredCoord,
  onHoverCoord,
  onSelectCoord,
}: ProbabilityBars3DProps) {
  // Reusable materials adhering to Obsidian & Champagne Gold system
  const goldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#C6A66B'),
        emissive: new THREE.Color('#C6A66B'),
        emissiveIntensity: 0.35,
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  )

  const hoveredMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#D9BD87'),
        emissive: new THREE.Color('#D9BD87'),
        emissiveIntensity: 0.70,
        metalness: 0.88,
        roughness: 0.18,
      }),
    []
  )

  const selectedMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#F0E9DB'),
        emissive: new THREE.Color('#F0E9DB'),
        emissiveIntensity: 0.85,
        metalness: 0.90,
        roughness: 0.12,
      }),
    []
  )

  const classicalGhostMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#4A463F'),
        emissive: new THREE.Color('#272625'),
        emissiveIntensity: 0.2,
        metalness: 0.5,
        roughness: 0.6,
        transparent: true,
        opacity: 0.55,
      }),
    []
  )

  if (!snapshot) return null

  const currentStep = snapshot.step
  const noisyDistMap = new Map(snapshot.noisy.distribution.map((p) => [p.x, p.probability]))
  const idealDistMap = new Map(snapshot.ideal.distribution.map((p) => [p.x, p.probability]))
  const classicalDistMap = new Map(snapshot.classical.distribution.map((p) => [p.x, p.probability]))

  // Range of coordinates to render: all reachable integer coordinates [-currentStep, +currentStep]
  const coordinates: number[] = []
  for (let x = -currentStep; x <= currentStep; x++) {
    coordinates.push(x)
  }

  // Adjust bar width based on number of active sites to prevent visual crowding
  const totalSites = coordinates.length
  const barWidth =
    totalSites > 50 ? 0.18 : totalSites > 25 ? 0.28 : totalSites > 12 ? 0.42 : 0.55
  const barDepth = totalSites > 25 ? 0.18 : 0.24

  return (
    <group name="ProbabilityBars_Group">
      {coordinates.map((x) => {
        const pNoisy = noisyDistMap.get(x) ?? 0
        const pIdeal = idealDistMap.get(x) ?? 0
        const pClassical = classicalDistMap.get(x) ?? 0

        const isHovered = hoveredCoord === x
        const isSelected = selectedCoord === x
        const hasParity = (currentStep + x) % 2 === 0
        const isOrigin = x === 0

        const hasPositiveProb = pNoisy >= PROB_THRESHOLD
        const hasPositiveClassical = pClassical >= PROB_THRESHOLD

        // Exact height strictly proportional to probability (no artificial minimum on zero sites)
        const barHeight = pNoisy * PROBABILITY_HEIGHT_SCALE
        const posX = x * LATTICE_SPACING
        const posY = BASE_Y + barHeight / 2

        // Classical ghost bar height
        const clHeight = pClassical * PROBABILITY_HEIGHT_SCALE
        const clPosY = BASE_Y + clHeight / 2

        const activeMaterial = isSelected
          ? selectedMaterial
          : isHovered
          ? hoveredMaterial
          : goldMaterial

        return (
          <group key={`site_bar_${x}`} position={[posX, 0, 0]}>
            {/* 1. Primary Quantum Probability Bar: Rendered ONLY if probability > 0 */}
            {hasPositiveProb && (
              <mesh
                position={[0, posY, 0]}
                material={activeMaterial}
                castShadow
                receiveShadow
                onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                  e.stopPropagation()
                  document.body.style.cursor = 'pointer'
                  if (hoveredCoord !== x) {
                    onHoverCoord(x)
                  }
                }}
                onPointerLeave={(e: ThreeEvent<PointerEvent>) => {
                  e.stopPropagation()
                  document.body.style.cursor = 'default'
                  onHoverCoord(null)
                }}
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation()
                  onSelectCoord(isSelected ? null : x)
                }}
              >
                <boxGeometry args={[barWidth, barHeight, barDepth]} />
              </mesh>
            )}

            {/* 2. Classical Reference Bar: Rendered ONLY if classical probability > 0 */}
            {hasPositiveClassical && currentStep > 0 && (
              <mesh position={[0, clPosY, -0.26]} material={classicalGhostMaterial}>
                <boxGeometry args={[barWidth * 0.75, clHeight, barDepth * 0.6]} />
              </mesh>
            )}

            {/* 3. Flat Lattice Marker Pad: Always present to indicate site position */}
            <mesh
              position={[0, BASE_Y - 0.012, 0]}
              onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
                if (hoveredCoord !== x) {
                  onHoverCoord(x)
                }
              }}
              onPointerLeave={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation()
                document.body.style.cursor = 'default'
                onHoverCoord(null)
              }}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation()
                onSelectCoord(isSelected ? null : x)
              }}
            >
              <cylinderGeometry args={[barWidth * 0.55, barWidth * 0.65, 0.024, 16]} />
              <meshStandardMaterial
                color={
                  isSelected
                    ? '#F0E9DB'
                    : isHovered
                    ? '#D9BD87'
                    : isOrigin
                    ? '#C6A66B'
                    : hasPositiveProb
                    ? '#3A3835'
                    : '#1B1A18'
                }
                emissive={isSelected ? '#F0E9DB' : isHovered ? '#D9BD87' : isOrigin ? '#C6A66B' : '#000000'}
                emissiveIntensity={isSelected ? 0.7 : isHovered ? 0.5 : isOrigin ? 0.3 : 0}
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>

            {/* 4. Floating Tooltip Badge on Hover */}
            {isHovered && (
              <group position={[0, posY + (hasPositiveProb ? barHeight / 2 : 0) + 0.35, 0]}>
                <Html
                  center
                  distanceFactor={11}
                  style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '11px',
                      padding: '7px 11px',
                      borderRadius: '4px',
                      background: 'rgba(16, 17, 18, 0.95)',
                      border: '1px solid #D9BD87',
                      color: '#F0E9DB',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.7)',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#D9BD87',
                        borderBottom: '1px solid rgba(198,166,107,0.3)',
                        paddingBottom: '3px',
                      }}
                    >
                      Position x = {x > 0 ? `+${x}` : x} (t = {currentStep})
                    </div>
                    <div>
                      <span style={{ color: '#A9A196' }}>P_noisy(x): </span>
                      <strong style={{ color: '#F0E9DB' }}>
                        {pNoisy.toFixed(6)}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#A9A196' }}>P_ideal(x): </span>
                      <span style={{ color: '#D9BD87' }}>{pIdeal.toFixed(6)}</span>
                    </div>
                    <div>
                      <span style={{ color: '#A9A196' }}>P_classical(x): </span>
                      <span style={{ color: '#A9A196' }}>{pClassical.toFixed(6)}</span>
                    </div>
                    <div style={{ fontSize: '9px', color: '#C6A66B', marginTop: '2px' }}>
                      p = {noiseStrength.toFixed(2)} | Register: {64 + x} | {!hasParity ? 'Parity Zero' : 'Reachable'}
                    </div>
                  </div>
                </Html>
              </group>
            )}
          </group>
        )
      })}
    </group>
  )
}
