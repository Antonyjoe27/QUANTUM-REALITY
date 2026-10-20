import { useEffect, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react'
import styles from '../styles/TimestepScrubber.module.css'

interface TimestepScrubberProps {
  currentStep: number
  maxSteps: number
  onStepChange: (step: number) => void
  disabled?: boolean
}

export function TimestepScrubber({
  currentStep,
  maxSteps,
  onStepChange,
  disabled = false,
}: TimestepScrubberProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  // Autoplay effect
  useEffect(() => {
    if (!isPlaying || disabled) return

    const interval = setInterval(() => {
      if (currentStep >= maxSteps) {
        setIsPlaying(false)
      } else {
        onStepChange(currentStep + 1)
      }
    }, 380)

    return () => clearInterval(interval)
  }, [isPlaying, currentStep, maxSteps, onStepChange, disabled])

  // Stop playback if step reaches max
  useEffect(() => {
    if (currentStep >= maxSteps && isPlaying) {
      setIsPlaying(false)
    }
  }, [currentStep, maxSteps, isPlaying])

  const handleStepBack = () => {
    setIsPlaying(false)
    if (currentStep > 0) {
      onStepChange(currentStep - 1)
    }
  }

  const handleStepForward = () => {
    setIsPlaying(false)
    if (currentStep < maxSteps) {
      onStepChange(currentStep + 1)
    }
  }

  const handleReset = () => {
    setIsPlaying(false)
    onStepChange(0)
  }

  const togglePlay = () => {
    if (currentStep >= maxSteps) {
      onStepChange(0)
      setIsPlaying(true)
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className={styles.scrubberContainer}>
      <div className={styles.topRow}>
        <div className={styles.labelGroup}>
          <span className={styles.title}>Timestep Scrubber</span>
          <span className={styles.badge}>
            t = {currentStep} / {maxSteps}
          </span>
        </div>

        <div className={styles.buttonGroup}>
          <button
            className={styles.iconBtn}
            onClick={handleReset}
            disabled={disabled}
            title="Reset to Initial State (t = 0)"
          >
            <RotateCcw size={13} />
          </button>

          <button
            className={styles.iconBtn}
            onClick={handleStepBack}
            disabled={disabled || currentStep <= 0}
            title="Previous Step"
          >
            <SkipBack size={13} />
          </button>

          <button
            className={`${styles.iconBtn} ${styles.playBtn}`}
            onClick={togglePlay}
            disabled={disabled}
            title={isPlaying ? 'Pause Playback' : 'Play Simulation Evolution'}
          >
            {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
          </button>

          <button
            className={styles.iconBtn}
            onClick={handleStepForward}
            disabled={disabled || currentStep >= maxSteps}
            title="Next Step"
          >
            <SkipForward size={13} />
          </button>
        </div>
      </div>

      <div className={styles.sliderTrack}>
        <input
          type="range"
          min={0}
          max={maxSteps}
          step={1}
          value={currentStep}
          onChange={(e) => {
            setIsPlaying(false)
            onStepChange(parseInt(e.target.value, 10))
          }}
          disabled={disabled}
          className={styles.slider}
        />
      </div>

      <div className={styles.stepTicks}>
        <span>t = 0 (Origin)</span>
        <span>t = {Math.round(maxSteps / 2)}</span>
        <span>t = {maxSteps} (Max)</span>
      </div>
    </div>
  )
}
