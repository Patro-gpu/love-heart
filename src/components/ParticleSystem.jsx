import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateHeartParticles, generateStars } from '../utils/particleShapes'

const vShader = /* glsl */ `
  attribute float size;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (280.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const fShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = 1.0 - smoothstep(0.2, 0.5, d);
    gl_FragColor = vec4(vColor, a);
  }
`

const COUNT = 25000
const STAR_COUNT = 2000
const MINI_COUNT = 600

function miniHeartPositions(count) {
  const pos = new Float32Array(count * 3)
  const cols = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    // Random sphere shell placement around center
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const rad = 3.5 + Math.random() * 2.5
    pos[i3]     = rad * Math.sin(phi) * Math.cos(theta)
    pos[i3 + 1] = rad * Math.sin(phi) * Math.sin(theta)
    pos[i3 + 2] = rad * Math.cos(phi)
    cols[i3] = 0.7 + Math.random() * 0.3
    cols[i3 + 1] = 0.2 + Math.random() * 0.3
    cols[i3 + 2] = 0.4 + Math.random() * 0.5
  }
  return { pos, cols }
}

export default function ParticleSystem({ gestureData, sparkleBurst }) {
  const pointsRef = useRef()
  const starsRef = useRef()
  const miniRef = useRef()
  const burstRef = useRef()
  const burstPhase = useRef(0)

  const { restPositions, explodeOffsets, colors, speeds } = useMemo(() => generateHeartParticles(COUNT), [])
  const { positions: starPos, colors: starCols } = useMemo(() => generateStars(STAR_COUNT), [])
  const { pos: miniPos, cols: miniCols } = useMemo(() => miniHeartPositions(MINI_COUNT), [])
  const currentPos = useMemo(() => new Float32Array(restPositions), [restPositions])

  const sizes = useMemo(() => {
    const a = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) a[i] = 0.025 + Math.random() * 0.045
    return a
  }, [])
  const starSizes = useMemo(() => {
    const a = new Float32Array(STAR_COUNT)
    for (let i = 0; i < STAR_COUNT; i++) a[i] = 0.006 + Math.random() * 0.018
    return a
  }, [])
  const miniSizes = useMemo(() => {
    const a = new Float32Array(MINI_COUNT)
    for (let i = 0; i < MINI_COUNT; i++) a[i] = 0.015 + Math.random() * 0.03
    return a
  }, [])

  // Sparkle burst particles
  const burstData = useMemo(() => {
    const count = 800
    const pos = new Float32Array(count * 3)
    const cols = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0
      cols[i * 3] = 1; cols[i * 3 + 1] = 0.8; cols[i * 3 + 2] = 0.3
    }
    return { pos, cols }
  }, [])
  const burstVelocities = useMemo(() => {
    const v = new Float32Array(800 * 3)
    for (let i = 0; i < 800; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 2 + Math.random() * 6
      v[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      v[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      v[i * 3 + 2] = Math.cos(phi) * speed
    }
    return v
  }, [])

  // Trigger burst
  const burstTimer = useRef(0)
  if (sparkleBurst) burstTimer.current = 1.5

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const dt = Math.min(delta, 0.1)
    const time = state.clock.elapsedTime

    const { tension, isClosed, fingerHeart, twoHandHeart, velocity, rotation } = gestureData
    const posArr = pointsRef.current.geometry.attributes.position.array
    const sizeArr = pointsRef.current.geometry.attributes.size.array

    // Heartbeat
    const beat = Math.sin(time * Math.PI * 2 * 1.2)
    const beatSharp = Math.pow(Math.abs(beat), 0.25) * Math.sign(beat)
    const heartbeat = 1 + beatSharp * 0.05

    // Burst
    const wasBursting = burstPhase.current > 0
    if (fingerHeart || twoHandHeart) {
      burstPhase.current = Math.min(burstPhase.current + dt * 3, 1.5)
    } else {
      burstPhase.current = Math.max(burstPhase.current - dt * 2, 0)
    }
    const burst = burstPhase.current
    const burstExplode = Math.sin(burst * Math.PI) * 2.5

    // Morph
    const morph = isClosed ? -0.4 : tension * 1.0

    // Hand magnet
    const hasHand = tension > 0.03
    const handX = hasHand ? (rotation?.y || 0) / (Math.PI * 2.5) : 0
    const handY = hasHand ? (rotation?.x || 0) / (Math.PI * 1.2) : 0
    const mx = handX * 3.0, my = -handY * 2.5

    // Rotation
    if (hasHand && rotation) {
      const s = 3.0 * dt
      pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, rotation.x * 0.5, s)
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, rotation.y, s)
    } else {
      pointsRef.current.rotation.y += dt * 0.15
      pointsRef.current.rotation.x += dt * 0.02
    }

    const windStr = velocity * 2.5 * tension
    const magnetStr = tension * 0.7

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const rx = restPositions[i3], ry = restPositions[i3 + 1], rz = restPositions[i3 + 2]
      const ex = rx + explodeOffsets[i3] * (morph + burstExplode)
      const ey = ry + explodeOffsets[i3 + 1] * (morph + burstExplode)
      const ez = rz + explodeOffsets[i3 + 2] * (morph + burstExplode)

      const dx = ex - mx, dy = ey - my, dz = ez
      const dh = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.05
      const mf = magnetStr / (dh * dh)
      const px = ex - dx * mf * 0.5
      const py = ey - dy * mf * 0.5
      const pz = ez - dz * mf * 0.5

      const swx = Math.sin(time * 3 + i * 0.04) * windStr * 0.15
      const swy = Math.cos(time * 3.5 + i * 0.03) * windStr * 0.15
      const swz = Math.sin(time * 2.5 + i * 0.05) * windStr * 0.1

      const tx = px + swx, ty = py + swy, tz = pz + swz
      const spd = speeds[i] * (5.0 + tension * 3.0 + burst * 8.0)
      const lerp = spd * dt

      posArr[i3]     += (tx - posArr[i3]) * lerp
      posArr[i3 + 1] += (ty - posArr[i3 + 1]) * lerp
      posArr[i3 + 2] += (tz - posArr[i3 + 2]) * lerp

      const sparkle = 0.5 + 0.5 * Math.abs(Math.sin(time * 4.5 + i * 0.11))
      const bSize = 1 + burst * 4.0
      sizeArr[i] = isClosed ? 0.006 : sizes[i] * sparkle * (0.6 + tension * 0.7) * heartbeat * bSize
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.size.needsUpdate = true

    // Mini hearts orbit
    if (miniRef.current) {
      miniRef.current.rotation.y += dt * 0.4
      miniRef.current.rotation.x += dt * 0.15
    }

    // Stars
    if (starsRef.current) {
      starsRef.current.rotation.y += dt * 0.015
      starsRef.current.rotation.x += dt * 0.003
    }

    // Burst particles
    if (burstRef.current && burstTimer.current > 0) {
      burstTimer.current -= dt
      const bArr = burstRef.current.geometry.attributes.position.array
      for (let i = 0; i < 800; i++) {
        const i3 = i * 3
        const t = Math.max(burstTimer.current, 0)
        const friction = Math.exp(-t * 3)
        bArr[i3] += burstVelocities[i3] * dt * friction
        bArr[i3 + 1] += burstVelocities[i3 + 1] * dt * friction
        bArr[i3 + 2] += burstVelocities[i3 + 2] * dt * friction
      }
      burstRef.current.geometry.attributes.position.needsUpdate = true
      burstRef.current.material.opacity = Math.max(0, burstTimer.current / 1.5)
    }
    // Reset burst particles
    if (burstRef.current && burstTimer.current <= 0 && burstRef.current.geometry.attributes.position.array[0] !== 0) {
      const bArr = burstRef.current.geometry.attributes.position.array
      for (let i = 0; i < 2400; i++) bArr[i] = 0
      burstRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={starPos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={STAR_COUNT} array={starCols} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={STAR_COUNT} array={starSizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial vertexShader={vShader} fragmentShader={fShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Mini orbiting hearts */}
      <points ref={miniRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={MINI_COUNT} array={miniPos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={MINI_COUNT} array={miniCols} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={MINI_COUNT} array={miniSizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial vertexShader={vShader} fragmentShader={fShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Main heart */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={COUNT} array={currentPos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={COUNT} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={COUNT} array={sizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial vertexShader={vShader} fragmentShader={fShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Sparkle burst ring */}
      <points ref={burstRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={800} array={burstData.pos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={800} array={burstData.cols} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={800} array={new Float32Array(800).fill(0.04)} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial vertexShader={vShader} fragmentShader={fShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} />
      </points>
    </group>
  )
}
