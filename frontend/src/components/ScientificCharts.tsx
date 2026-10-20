import { useMemo, useState } from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'
import type { DecoherenceTimestepSnapshot, DecoherenceWalkResponse } from '../api/client'
import styles from '../styles/ScientificCharts.module.css'

interface ScientificChartsProps {
  simulationData: DecoherenceWalkResponse | null
  currentStep: number
}

export function ScientificCharts({ simulationData, currentStep }: ScientificChartsProps) {
  const [hoveredPointX, setHoveredPointX] = useState<number | null>(null)

  if (!simulationData || simulationData.timesteps.length === 0) {
    return null
  }

  const currentSnapshot: DecoherenceTimestepSnapshot =
    simulationData.timesteps[currentStep] || simulationData.timesteps[0]

  // Dimensions for SVG charts
  const width = 500
  const height = 160
  const padL = 45
  const padR = 20
  const padT = 15
  const padB = 25
  const plotW = width - padL - padR
  const plotH = height - padT - padB

  // Chart 1: Spatial Distribution curves
  const curStep = currentSnapshot.step

  const distributionData = useMemo(() => {
    const t = curStep
    const nDist = currentSnapshot.noisy.distribution
    const iDist = currentSnapshot.ideal.distribution
    const cDist = currentSnapshot.classical.distribution

    if (t === 0) {
      return {
        noisyPath: `M ${padL + plotW / 2} ${padT + plotH} L ${padL + plotW / 2} ${padT}`,
        idealPath: `M ${padL + plotW / 2} ${padT + plotH} L ${padL + plotW / 2} ${padT}`,
        classicalPath: `M ${padL + plotW / 2} ${padT + plotH} L ${padL + plotW / 2} ${padT}`,
        maxP: 1.0,
        mapX: () => padL + plotW / 2,
        mapY: (p: number) => padT + plotH - p * plotH,
      }
    }

    const maxP = Math.max(
      ...nDist.map((d) => d.probability),
      ...iDist.map((d) => d.probability),
      ...cDist.map((d) => d.probability),
      0.05
    )

    const mapX = (x: number) => padL + ((x - (-t)) / (2 * t)) * plotW
    const mapY = (p: number) => padT + plotH - (p / maxP) * plotH

    const makePath = (dist: { x: number; probability: number }[]) => {
      return dist
        .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(pt.x).toFixed(1)} ${mapY(pt.probability).toFixed(1)}`)
        .join(' ')
    }

    return {
      noisyPath: makePath(nDist),
      idealPath: makePath(iDist),
      classicalPath: makePath(cDist),
      maxP,
      mapX,
      mapY,
    }
  }, [currentSnapshot, curStep, plotW, plotH, padL, padT])

  // X-axis ticks calculated cleanly based on t
  const xTicks = useMemo(() => {
    if (curStep === 0) return [0]
    if (curStep <= 5) {
      const ticks: number[] = []
      for (let x = -curStep; x <= curStep; x++) ticks.push(x)
      return ticks
    }
    const half = Math.round(curStep / 2)
    return [-curStep, -half, 0, half, curStep]
  }, [curStep])

  // Chart 2: Standard Deviation vs Timestep
  const stdDevChartData = useMemo(() => {
    const allSnaps = simulationData.timesteps
    const maxT = simulationData.max_steps
    if (maxT === 0) return { noisyPath: '', idealPath: '', classicalPath: '', maxSigma: 1, currentX: padL }

    const maxSigma = Math.max(
      ...allSnaps.map((s) => s.ideal.std_dev),
      ...allSnaps.map((s) => s.noisy.std_dev),
      1.0
    )

    const mapX = (step: number) => padL + (step / maxT) * plotW
    const mapY = (s: number) => padT + plotH - (s / maxSigma) * plotH

    const noisyPath = allSnaps
      .map((snap, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(snap.step).toFixed(1)} ${mapY(snap.noisy.std_dev).toFixed(1)}`)
      .join(' ')

    const idealPath = allSnaps
      .map((snap, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(snap.step).toFixed(1)} ${mapY(snap.ideal.std_dev).toFixed(1)}`)
      .join(' ')

    const classicalPath = allSnaps
      .map((snap, idx) => `${idx === 0 ? 'M' : 'L'} ${mapX(snap.step).toFixed(1)} ${mapY(snap.classical.std_dev).toFixed(1)}`)
      .join(' ')

    const currentX = mapX(curStep)

    return { noisyPath, idealPath, classicalPath, maxSigma, currentX }
  }, [simulationData, curStep, plotW, plotH, padL, padT])

  // Handle hover crosshair on distribution chart
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseSvgX = ((e.clientX - rect.left) / rect.width) * width
    if (mouseSvgX < padL || mouseSvgX > padL + plotW || curStep === 0) {
      setHoveredPointX(null)
      return
    }
    // Calculate nearest coordinate x in [-curStep, +curStep]
    const rel = (mouseSvgX - padL) / plotW
    const coord = Math.round(-curStep + rel * (2 * curStep))
    setHoveredPointX(Math.max(-curStep, Math.min(curStep, coord)))
  }

  const hoveredNoisyProb =
    hoveredPointX !== null
      ? currentSnapshot.noisy.distribution.find((d) => d.x === hoveredPointX)?.probability ?? 0
      : null
  const hoveredIdealProb =
    hoveredPointX !== null
      ? currentSnapshot.ideal.distribution.find((d) => d.x === hoveredPointX)?.probability ?? 0
      : null
  const hoveredClassicalProb =
    hoveredPointX !== null
      ? currentSnapshot.classical.distribution.find((d) => d.x === hoveredPointX)?.probability ?? 0
      : null

  return (
    <div className={styles.chartsContainer}>
      {/* Chart 1: Position Distribution Comparison */}
      <div className={styles.chartCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <BarChart3 size={15} style={{ color: 'var(--champagne-gold)' }} />
            <span>Spatial Probability Distribution P(x, t = {curStep})</span>
          </div>

          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <div className={styles.legendLineNoisy} />
              <span>Noisy (p={simulationData.noise_strength.toFixed(2)})</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendLineIdeal} />
              <span>Ideal (p=0)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendLineClassical} />
              <span>Classical (Binomial)</span>
            </div>
          </div>
        </div>

        <div className={styles.svgWrapper}>
          <svg
            className={styles.svg}
            viewBox={`0 0 ${width} ${height}`}
            onMouseMove={handleSvgMouseMove}
            onMouseLeave={() => setHoveredPointX(null)}
          >
            {/* Gridlines */}
            <line
              x1={padL}
              y1={padT + plotH}
              x2={padL + plotW}
              y2={padT + plotH}
              stroke="#272625"
              strokeWidth="1"
            />
            <line
              x1={padL}
              y1={padT + plotH / 2}
              x2={padL + plotW}
              y2={padT + plotH / 2}
              stroke="#272625"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <line
              x1={padL}
              y1={padT}
              x2={padL + plotW}
              y2={padT}
              stroke="#272625"
              strokeWidth="1"
            />

            {/* Y-axis labels */}
            <text x={padL - 6} y={padT + 4} fill="#A9A196" fontSize="9" textAnchor="end" fontFamily="monospace">
              {distributionData.maxP.toFixed(2)}
            </text>
            <text x={padL - 6} y={padT + plotH / 2 + 3} fill="#A9A196" fontSize="9" textAnchor="end" fontFamily="monospace">
              {(distributionData.maxP / 2).toFixed(2)}
            </text>
            <text x={padL - 6} y={padT + plotH} fill="#A9A196" fontSize="9" textAnchor="end" fontFamily="monospace">
              0.00
            </text>

            {/* X-axis tick labels */}
            {xTicks.map((x) => {
              const xPos = distributionData.mapX(x)
              return (
                <text
                  key={`xtick_${x}`}
                  x={xPos}
                  y={height - 6}
                  fill={x === 0 ? '#C6A66B' : '#A9A196'}
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {x > 0 ? `+${x}` : x}
                </text>
              )
            })}

            {/* Curves */}
            {/* Classical reference */}
            <path
              d={distributionData.classicalPath}
              fill="none"
              stroke="#A9A196"
              strokeWidth="1.5"
              strokeDasharray="2 3"
            />

            {/* Ideal quantum baseline */}
            <path
              d={distributionData.idealPath}
              fill="none"
              stroke="#D9BD87"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Noisy walk */}
            <path
              d={distributionData.noisyPath}
              fill="none"
              stroke="#C6A66B"
              strokeWidth="2.2"
            />

            {/* Interactive hover crosshair line */}
            {hoveredPointX !== null && curStep > 0 && (
              <>
                <line
                  x1={distributionData.mapX(hoveredPointX)}
                  y1={padT}
                  x2={distributionData.mapX(hoveredPointX)}
                  y2={padT + plotH}
                  stroke="#F0E9DB"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                {hoveredNoisyProb !== null && (
                  <circle
                    cx={distributionData.mapX(hoveredPointX)}
                    cy={distributionData.mapY(hoveredNoisyProb)}
                    r="3.5"
                    fill="#C6A66B"
                    stroke="#F0E9DB"
                    strokeWidth="1"
                  />
                )}
              </>
            )}
          </svg>
        </div>

        {/* Hover readout below chart */}
        {hoveredPointX !== null && (
          <div
            style={{
              display: 'flex',
              gap: '12px',
              fontSize: '0.70rem',
              fontFamily: 'monospace',
              marginTop: '4px',
              padding: '2px 6px',
              background: 'rgba(16, 17, 18, 0.6)',
              borderRadius: '3px',
              border: '1px solid rgba(198, 166, 107, 0.2)',
            }}
          >
            <span style={{ color: '#D9BD87', fontWeight: 600 }}>x = {hoveredPointX > 0 ? `+${hoveredPointX}` : hoveredPointX}:</span>
            <span>P_noisy = {hoveredNoisyProb?.toFixed(5)}</span>
            <span style={{ color: '#D9BD87' }}>P_ideal = {hoveredIdealProb?.toFixed(5)}</span>
            <span style={{ color: '#A9A196' }}>P_class = {hoveredClassicalProb?.toFixed(5)}</span>
          </div>
        )}

        <div style={{ fontSize: '0.68rem', color: '#A9A196', marginTop: '6px', lineHeight: '1.4' }}>
          <em>Note:</em> The classical reference is an unbiased discrete random walk with variance σ² = t. Under complete coin dephasing (p = 1.0), the noisy distribution matches this exact binomial curve.
        </div>
      </div>

      {/* Chart 2: Standard Deviation vs Timestep */}
      <div className={styles.chartCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <TrendingUp size={15} style={{ color: 'var(--champagne-gold)' }} />
            <span>Spreading Dynamics: σ(t) vs. Timestep</span>
          </div>

          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <div className={styles.legendLineNoisy} />
              <span>Noisy σ(t)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendLineIdeal} />
              <span>Ideal (Ballistic σ ∝ t)</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendLineClassical} />
              <span>Classical (Diffusive σ = √t)</span>
            </div>
          </div>
        </div>

        <div className={styles.svgWrapper}>
          <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`}>
            {/* Axes */}
            <line
              x1={padL}
              y1={padT + plotH}
              x2={padL + plotW}
              y2={padT + plotH}
              stroke="#272625"
              strokeWidth="1"
            />
            <line
              x1={padL}
              y1={padT}
              x2={padL + plotW}
              y2={padT}
              stroke="#272625"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Y-axis labels */}
            <text x={padL - 6} y={padT + 4} fill="#A9A196" fontSize="9" textAnchor="end" fontFamily="monospace">
              {stdDevChartData.maxSigma.toFixed(1)}
            </text>
            <text x={padL - 6} y={padT + plotH} fill="#A9A196" fontSize="9" textAnchor="end" fontFamily="monospace">
              0
            </text>

            {/* X-axis labels */}
            <text x={padL} y={height - 6} fill="#A9A196" fontSize="9" textAnchor="start" fontFamily="monospace">
              t = 0
            </text>
            <text x={padL + plotW / 2} y={height - 6} fill="#A9A196" fontSize="9" textAnchor="middle" fontFamily="monospace">
              t = {Math.round(simulationData.max_steps / 2)}
            </text>
            <text x={padL + plotW} y={height - 6} fill="#A9A196" fontSize="9" textAnchor="end" fontFamily="monospace">
              t = {simulationData.max_steps}
            </text>

            {/* Classical curve (sqrt(t)) */}
            <path
              d={stdDevChartData.classicalPath}
              fill="none"
              stroke="#A9A196"
              strokeWidth="1.5"
              strokeDasharray="2 3"
            />

            {/* Ideal curve (ballistic ~ 0.54 * t) */}
            <path
              d={stdDevChartData.idealPath}
              fill="none"
              stroke="#D9BD87"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Noisy curve */}
            <path
              d={stdDevChartData.noisyPath}
              fill="none"
              stroke="#C6A66B"
              strokeWidth="2.2"
            />

            {/* Current timestep cursor vertical line */}
            <line
              x1={stdDevChartData.currentX}
              y1={padT}
              x2={stdDevChartData.currentX}
              y2={padT + plotH}
              stroke="#F0E9DB"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <circle
              cx={stdDevChartData.currentX}
              cy={padT + plotH - (currentSnapshot.noisy.std_dev / stdDevChartData.maxSigma) * plotH}
              r="3.5"
              fill="#F0E9DB"
            />
          </svg>
        </div>

        <div style={{ fontSize: '0.68rem', color: '#A9A196', marginTop: '6px', lineHeight: '1.4' }}>
          Ballistic spreading (ideal quantum walk) scales linearly as σ ∝ t, whereas diffusive spreading (classical random walk) scales as σ ∝ √t.
        </div>
      </div>
    </div>
  )
}
