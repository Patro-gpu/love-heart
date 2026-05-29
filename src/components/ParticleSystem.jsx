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
    gl_PointSize = size * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float dist = length(gl_PointCoord - 0.5);
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.25, 0.5, dist);
    gl_FragColor = vec4(vColor, alpha);
  }
`

const COUNT = 25000
const STAR_COUNT = 2000

export default function ParticleSystem({ gestureData }) {
  const pointsRef = useRef()
  const starsRef = useRef()
  const burstPhase = useRef(0) // 0=idle, >0=bursting

  const { restPositions, explodeOffsets, colors, speeds } = useMemo(() => generateHeartParticles(COUNT), [])
  const starPositions = useMemo(() => generateStars(STAR_COUNT), [])
  // Current working positions (start from rest)
  const currentPos = useMemo(() => new Float32Array(restPositions), [restPositions])

  const sizes = useMemo(() => {
    const arr = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) arr[i] = 0.025 + Math.random() * 0.045
    return arr
  }, [])

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    const { tension, isClosed, fingerHeart, twoHandHeart, velocity, rotation } = gestureData
    const posArr = pointsRef.current.geometry.attributes.position.array
    const sizeArr = pointsRef.current.geometry.attributes.size.array
    const time = state.clock.elapsedTime
    const dt = Math.min(delta, 0.1)

    // ── Heartbeat ──
    const beat = Math.sin(time * Math.PI * 2 * 1.2)
    const beatSharp = Math.pow(Math.abs(beat), 0.25) * Math.sign(beat)
    const heartbeat = 1 + beatSharp * 0.05

    // ── Burst state machine ──
    const wasBursting = burstPhase.current > 0
    if (fingerHeart || twoHandHeart) {
      burstPhase.current = Math.min(burstPhase.current + dt * 3, 1.5)
    } else {
      burstPhase.current = Math.max(burstPhase.current - dt * 2, 0)
    }

    // ── Shape morph: 0=rest heart, 1=fully exploded ──
    // tension drives the explosion: open hand = particles spread out
    const morph = isClosed
      ? -0.4 // closed fist = tighter than rest
      : tension * 1.0 // open hand = explode outward

    // Burst adds extra explosion
    const burst = burstPhase.current
    const burstExplode = Math.sin(burst * Math.PI) * 2.5 // pulse up then down

    // ── Hand "magnet" effect ──
    // Hand position in 3D space (rough mapping from normalized coords)
    const hasHand = tension > 0.03
    const handX = hasHand ? (rotation?.y || 0) / (Math.PI * 2.5) : 0 // -1..1
    const handY = hasHand ? (rotation?.x || 0) / (Math.PI * 1.2) : 0
    // Hand acts as a "pull" point offset from center
    const magnetX = handX * 3.0
    const magnetY = -handY * 2.5
    const magnetZ = 0

    // ── Rotation ──
    if (hasHand && rotation) {
      const s = 3.0 * dt
      pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, rotation.x * 0.5, s)
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, rotation.y, s)
    } else {
      pointsRef.current.rotation.y += dt * 0.15
      pointsRef.current.rotation.x += dt * 0.02
    }

    // ── Per-particle update ──
    const windStrength = velocity * 2.5 * tension
    const magnetStrength = tension * 0.7

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3

      // Rest heart position
      const rx = restPositions[i3]
      const ry = restPositions[i3 + 1]
      const rz = restPositions[i3 + 2]

      // Exploded = rest + radial push
      const ex = rx + explodeOffsets[i3] * (morph + burstExplode)
      const ey = ry + explodeOffsets[i3 + 1] * (morph + burstExplode)
      const ez = rz + explodeOffsets[i3 + 2] * (morph + burstExplode)

      // Magnet: particles near hand position get pulled
      const dx = ex - magnetX
      const dy = ey - magnetY
      const dz = ez - magnetZ
      const distToHand = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.05
      const magnetForce = magnetStrength / (distToHand * distToHand)
      const mx = ex - dx * magnetForce * 0.5
      const my = ey - dy * magnetForce * 0.5
      const mz = ez - dz * magnetForce * 0.5

      // Wind: hand velocity pushes particles in a swirl pattern
      const swirlX = Math.sin(time * 3 + i * 0.04) * windStrength * 0.15
      const swirlY = Math.cos(time * 3.5 + i * 0.03) * windStrength * 0.15
      const swirlZ = Math.sin(time * 2.5 + i * 0.05) * windStrength * 0.1

      const tx = mx + swirlX
      const ty = my + swirlY
      const tz = mz + swirlZ

      // Per-particle lerp speed (organic async response)
      const spd = speeds[i] * (5.0 + tension * 3.0 + burst * 8.0)
      const lerp = spd * dt

      posArr[i3]     += (tx - posArr[i3]) * lerp
      posArr[i3 + 1] += (ty - posArr[i3 + 1]) * lerp
      posArr[i3 + 2] += (tz - posArr[i3 + 2]) * lerp

      // Size: sparkle + burst boost
      const sparkle = 0.5 + 0.5 * Math.abs(Math.sin(time * 4.5 + i * 0.11))
      const burstSize = 1 + burst * 4.0 * (1 - Math.abs(burst - 0.75) * 1.3)
      sizeArr[i] = isClosed
        ? 0.006
        : sizes[i] * sparkle * (0.6 + tension * 0.7) * heartbeat * burstSize
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.size.needsUpdate = true

    // Stars
    if (starsRef.current) {
      starsRef.current.rotation.y += dt * 0.015
      starsRef.current.rotation.x += dt * 0.003
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
          size={0.02}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.4}
          color="#ffe0ec"
        />
      </points>

      {/* Heart particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={COUNT} array={currentPos} itemSize={3} />
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
