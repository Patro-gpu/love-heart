import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import ParticleSystem from './ParticleSystem'

export default function Scene({ gestureData }) {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 8], fov: 55 }}
      gl={{ antialias: true }}
      style={{ position: 'absolute', top: 0, left: 0 }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={['#050008']} />
      <fog attach="fog" args={['#050008', 7, 30]} />

      <ParticleSystem gestureData={gestureData} />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          intensity={1.4}
          radius={0.6}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.15} darkness={1.0} />
      </EffectComposer>
    </Canvas>
  )
}
