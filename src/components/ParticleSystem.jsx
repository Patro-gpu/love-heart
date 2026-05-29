import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateHeartParticles, generateStars } from '../utils/particleShapes'

const vertexShader = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.28, 0.5, dist);
    gl_FragColor = vec4(vColor, alpha);
  }
`

const COUNT = 10000
const STAR_COUNT = 1500

export default function ParticleSystem({ gestureData }) {
  const pointsRef = useRef()
  const starsRef = useRef()

  const { positions, colors } = useMemo(() => generateHeartParticles(COUNT), [])
  const starPositions = useMemo(() => generateStars(STAR_COUNT), [])

  const sizes = useMemo(() => {
    const arr = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) arr[i] = 0.04 + Math.random() * 0.06
    return arr
  }, [])

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    const { tension, isClosed, fingerHeart, twoHandHeart, velocity } = gestureData
    const posArr = pointsRef.current.geometry.attributes.position.array
    const sizeArr = pointsRef.current.geometry.attributes.size.array
    const time = state.clock.elapsedTime

    // ── Heartbeat ──
    const beat = Math.sin(time * Math.PI * 2 * 1.2)
    const beatSharp = Math.pow(Math.abs(beat), 0.3) * Math.sign(beat)
    const heartbeat = 1 + beatSharp * 0.06

    // ── Gesture scaling ──
    // tension 0→closed fist, tension 1→fully open hand
    // Map: closed=0.2x, resting=1x, full-open=2.5x
    const gestureScale = isClosed
      ? 0.18
      : 1.0 + tension * 1.8

    // Special gestures boost
    const specialBoost = fingerHeart || twoHandHeart
      ? 1.5 + Math.sin(time * 10) * 0.3
      : 1.0

    const finalScale = gestureScale * heartbeat * specialBoost

    // ── Rotation ──
    const hasHand = tension > 0.05
    if (hasHand && gestureData.rotation) {
      const s = 4.0 * delta
      pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, gestureData.rotation.x * 0.6, s)
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, gestureData.rotation.y, s)
    } else {
      // Auto-rotate when no hand
      pointsRef.current.rotation.y += delta * 0.2
      pointsRef.current.rotation.x += delta * 0.03
    }

    // ── Apply to each particle ──
    const lerpSpeed = 4.0 * delta
    // Velocity-based extra jitter
    const jitterAmp = velocity * 0.08 * tension

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3

      const tx = positions[i3] * finalScale
      const ty = positions[i3 + 1] * finalScale
      const tz = positions[i3 + 2] * finalScale

      // Jitter from hand velocity
      const jx = Math.sin(time * 10 + i * 0.07) * jitterAmp
      const jy = Math.cos(time * 12 + i * 0.05) * jitterAmp
      const jz = Math.sin(time * 9 + i * 0.06) * jitterAmp * 0.5

      posArr[i3]     += (tx + jx - posArr[i3]) * lerpSpeed
      posArr[i3 + 1] += (ty + jy - posArr[i3 + 1]) * lerpSpeed
      posArr[i3 + 2] += (tz + jz - posArr[i3 + 2]) * lerpSpeed

      // Per-particle sparkle
      const sparkle = 0.6 + 0.4 * Math.abs(Math.sin(time * 5 + i * 0.13))
      const specialSize = (fingerHeart || twoHandHeart) ? 3.0 : 1.0
      sizeArr[i] = isClosed
        ? 0.008
        : sizes[i] * sparkle * (0.7 + tension * 0.6) * specialSize
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.size.needsUpdate = true

    // ── Stars slowly rotate ──
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.015
      starsRef.current.rotation.x += delta * 0.003
    }
  })

  return (
    <group>
      {/* Background stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={STAR_COUNT}
            array={starPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.025}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.45}
          color="#ffe0ec"
        />
      </points>

      {/* Heart particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={COUNT} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={COUNT} array={sizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
