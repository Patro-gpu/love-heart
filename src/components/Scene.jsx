import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import ParticleSystem from './ParticleSystem'

export default function Scene({ gestureData, config }) {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      <ParticleSystem gestureData={gestureData} config={config} />

      <OrbitControls />
    </Canvas>
  )
}
