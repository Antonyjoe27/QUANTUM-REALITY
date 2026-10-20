import { useRef, useMemo, useEffect } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { OBJECT_METADATA, resolveTargetId } from '../types/workbench'

interface WorkbenchModelProps {
  hoveredId: string | null
  selectedId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string | null) => void
}

const SITE_COORDINATES: { id: string; coord: number; label: string; x: number }[] = [
  { id: 'Site_N4', coord: -4, label: 'x = -4', x: -4 * 1.15 },
  { id: 'Site_N3', coord: -3, label: 'x = -3', x: -3 * 1.15 },
  { id: 'Site_N2', coord: -2, label: 'x = -2', x: -2 * 1.15 },
  { id: 'Site_N1', coord: -1, label: 'x = -1', x: -1 * 1.15 },
  { id: 'Site_Center', coord: 0, label: 'x = 0', x: 0 },
  { id: 'Site_P1', coord: 1, label: 'x = +1', x: 1 * 1.15 },
  { id: 'Site_P2', coord: 2, label: 'x = +2', x: 2 * 1.15 },
  { id: 'Site_P3', coord: 3, label: 'x = +3', x: 3 * 1.15 },
  { id: 'Site_P4', coord: 4, label: 'x = +4', x: 4 * 1.15 },
]

export function WorkbenchModel({
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: WorkbenchModelProps) {
  const { scene } = useGLTF('/workbench.glb')
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Store original materials mapped by mesh UUID
  const originalMaterialsRef = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map())

  // Restrained champagne-gold highlight for hovered object
  const highlightMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#D9BD87'), // Highlight gold
      emissive: new THREE.Color('#C6A66B'),
      emissiveIntensity: 0.45,
      metalness: 0.85,
      roughness: 0.22,
    })
  }, [])

  // Distinct luminous warm-ivory / gold for selected object
  const selectedMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#F0E9DB'), // Warm ivory
      emissive: new THREE.Color('#D9BD87'),
      emissiveIntensity: 0.70,
      metalness: 0.88,
      roughness: 0.16,
    })
  }, [])

  // Cache initial materials once
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (!originalMaterialsRef.current.has(mesh.uuid)) {
          originalMaterialsRef.current.set(mesh.uuid, mesh.material)
        }
      }
    })
  }, [clonedScene])

  // Apply materials on hover / selection updates
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const original = originalMaterialsRef.current.get(mesh.uuid)
        if (!original) return

        // Resolve target ID for this mesh (handles sub-parts like Site_N2_Pip, Coin_Gate_H)
        const parentName = mesh.parent?.name || ''
        const targetId = resolveTargetId(mesh.name) || resolveTargetId(parentName)

        if (!targetId || !(targetId in OBJECT_METADATA)) {
          mesh.material = original
          return
        }

        const isSelected = targetId === selectedId
        const isHovered = targetId === hoveredId

        if (isSelected) {
          mesh.material = selectedMaterial
        } else if (isHovered) {
          mesh.material = highlightMaterial
        } else {
          mesh.material = original
        }
      }
    })
  }, [clonedScene, hoveredId, selectedId, highlightMaterial, selectedMaterial])

  const resolveEventTarget = (e: ThreeEvent<PointerEvent | MouseEvent>): string | null => {
    let current: THREE.Object3D | null = e.object
    while (current && current !== clonedScene) {
      const resolved = resolveTargetId(current.name)
      if (resolved && resolved in OBJECT_METADATA) {
        return resolved
      }
      current = current.parent
    }
    return null
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const targetId = resolveEventTarget(e)
    if (targetId) {
      document.body.style.cursor = 'pointer'
      if (hoveredId !== targetId) {
        onHover(targetId)
      }
    } else {
      document.body.style.cursor = 'default'
      if (hoveredId !== null) {
        onHover(null)
      }
    }
  }

  const handlePointerLeave = () => {
    document.body.style.cursor = 'default'
    onHover(null)
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const targetId = resolveEventTarget(e)
    if (targetId) {
      onSelect(selectedId === targetId ? null : targetId)
    } else {
      onSelect(null)
    }
  }

  const isCoinSelected = selectedId === 'Coin_Module'
  const isCoinHovered = hoveredId === 'Coin_Module'

  return (
    <group>
      <primitive
        object={clonedScene}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      />

      {/* Floating 3D coordinate badges along the track */}
      {SITE_COORDINATES.map((site) => {
        const isSelected = selectedId === site.id
        const isHovered = hoveredId === site.id
        const isCenter = site.coord === 0

        return (
          <group key={site.id} position={[site.x, 0.28, 0.42]}>
            <Html
              center
              distanceFactor={11}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(isSelected ? null : site.id)
                }}
                onPointerEnter={() => onHover(site.id)}
                onPointerLeave={() => onHover(null)}
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '11px',
                  fontWeight: isSelected || isCenter ? 700 : 500,
                  letterSpacing: '0.06em',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  background: isSelected
                    ? '#F0E9DB'
                    : isHovered
                    ? '#D9BD87'
                    : isCenter
                    ? 'rgba(198, 166, 107, 0.25)'
                    : 'rgba(27, 26, 24, 0.85)',
                  color: isSelected
                    ? '#101112'
                    : isHovered
                    ? '#101112'
                    : isCenter
                    ? '#D9BD87'
                    : '#A9A196',
                  border: isSelected
                    ? '1px solid #F0E9DB'
                    : isHovered
                    ? '1px solid #D9BD87'
                    : isCenter
                    ? '1px solid #C6A66B'
                    : '1px solid rgba(198, 166, 107, 0.20)',
                  boxShadow: isSelected
                    ? '0 0 10px rgba(240, 233, 219, 0.4)'
                    : isHovered
                    ? '0 0 8px rgba(217, 189, 135, 0.35)'
                    : 'none',
                }}
              >
                {site.label}
              </div>
            </Html>
          </group>
        )
      })}

      {/* Floating 3D Badge over the Quantum Coin Qubit Module */}
      <group position={[0, 0.72, -1.10]}>
        <Html
          center
          distanceFactor={11}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation()
              onSelect(isCoinSelected ? null : 'Coin_Module')
            }}
            onPointerEnter={() => onHover('Coin_Module')}
            onPointerLeave={() => onHover(null)}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              padding: '3px 8px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              background: isCoinSelected
                ? '#F0E9DB'
                : isCoinHovered
                ? '#D9BD87'
                : 'rgba(27, 26, 24, 0.90)',
              color: isCoinSelected || isCoinHovered ? '#101112' : '#D9BD87',
              border: isCoinSelected
                ? '1px solid #F0E9DB'
                : isCoinHovered
                ? '1px solid #D9BD87'
                : '1px solid #C6A66B',
              boxShadow: isCoinSelected
                ? '0 0 12px rgba(240, 233, 219, 0.5)'
                : isCoinHovered
                ? '0 0 10px rgba(217, 189, 135, 0.4)'
                : '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ fontWeight: 800, color: isCoinSelected || isCoinHovered ? '#101112' : '#F0E9DB' }}>[ H ]</span>
            <span>Coin Qubit Module (q_c)</span>
          </div>
        </Html>
      </group>

      {/* Conditional Shift Direction Indicators */}
      <group position={[-0.72, 0.35, -1.10]}>
        <Html center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '9px',
            color: '#D9BD87',
            background: 'rgba(16, 17, 18, 0.85)',
            border: '1px solid rgba(198, 166, 107, 0.3)',
            padding: '1px 5px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
          }}>
            |1⟩ → Left (x - 1)
          </div>
        </Html>
      </group>

      <group position={[0.72, 0.35, -1.10]}>
        <Html center distanceFactor={12} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '9px',
            color: '#D9BD87',
            background: 'rgba(16, 17, 18, 0.85)',
            border: '1px solid rgba(198, 166, 107, 0.3)',
            padding: '1px 5px',
            borderRadius: '2px',
            whiteSpace: 'nowrap',
          }}>
            |0⟩ → Right (x + 1)
          </div>
        </Html>
      </group>
    </group>
  )
}

useGLTF.preload('/workbench.glb')
