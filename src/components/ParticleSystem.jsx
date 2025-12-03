import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateParticles } from '../utils/particleShapes'

export default function ParticleSystem({ gestureData, config }) {
  const pointsRef = useRef()
  const count = 10000 // Number of particles

  // Generate initial positions based on template
  const positions = useMemo(() => {
    return generateParticles(config.template, count)
  }, [config.template])

  // Create a buffer attribute for the positions
  // We need two buffers: current positions and target positions to interpolate
  const targetPositions = useMemo(() => new Float32Array(positions), [positions])
  const currentPositions = useRef(new Float32Array(positions))

  // Update geometry when template changes
  useEffect(() => {
    const newPositions = generateParticles(config.template, count)
    targetPositions.set(newPositions)
  }, [config.template, targetPositions])

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    const { tension, isClosed } = gestureData
    const positionsAttribute = pointsRef.current.geometry.attributes.position
    const array = positionsAttribute.array

    // Animation / Interaction Logic
    // 1. Interpolate towards target shape
    // 2. Apply tension (expansion)
    // 3. Apply closing (contraction/implosion)

    const lerpSpeed = 2.0 * delta

    // Base scale based on tension
    // Tension 0 -> Scale 1
    // Tension 1 -> Scale 2 (Expansion)
    const targetScale = 1 + tension * 1.5

    // If closed, scale shrinks to 0.1
    const finalScale = isClosed ? 0.1 : targetScale

    // Apply Rotation from Gesture
    if (gestureData.rotation) {
      // Smooth rotation using lerp to reduce jitter
      // Factor of 2.0 * delta gives a smooth weighted average
      const smoothing = 2.0 * delta
      pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, gestureData.rotation.x, smoothing)
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, gestureData.rotation.y, smoothing)
    } else {
      pointsRef.current.rotation.y += delta * 0.1
    }

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      let tx = targetPositions[i3]
      let ty = targetPositions[i3 + 1]
      let tz = targetPositions[i3 + 2]

      // Special Logic for F1 Road
      if (config.template === 'f1' && ty <= -0.9 && ty >= -1.1) {
        const speed = 20.0 * delta
        array[i3 + 2] += speed
        if (array[i3 + 2] > 10) array[i3 + 2] = -10

        tx *= finalScale
        ty *= finalScale

        array[i3] += (tx - array[i3]) * lerpSpeed
        array[i3 + 1] += (ty - array[i3 + 1]) * lerpSpeed
        continue
      }

      // Apply scale
      tx *= finalScale
      ty *= finalScale
      tz *= finalScale

      // Add some noise/movement based on time
      const time = state.clock.elapsedTime
      const noise = Math.sin(time + i) * 0.05 * tension // More jitter with tension

      array[i3] += (tx - array[i3]) * lerpSpeed + noise
      array[i3 + 1] += (ty - array[i3 + 1]) * lerpSpeed + noise
      array[i3 + 2] += (tz - array[i3 + 2]) * lerpSpeed + noise
    }

    positionsAttribute.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={currentPositions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={config.color}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
        opacity={0.8}
      />
    </points>
  )
}
