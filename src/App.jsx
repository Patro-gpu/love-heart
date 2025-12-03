import { useState } from 'react'
import Scene from './components/Scene'
import HandTracker from './components/HandTracker'
import ControlPanel from './components/UI/ControlPanel'

function App() {
  const [gestureData, setGestureData] = useState({ tension: 0, isClosed: false, rotation: { x: 0, y: 0 } })
  const [config, setConfig] = useState({ template: 'hearts', color: '#ff0055' })

  return (
    <>
      <Scene gestureData={gestureData} config={config} />
      <HandTracker onGestureUpdate={setGestureData} />
      <ControlPanel config={config} setConfig={setConfig} gestureData={gestureData} />
    </>
  )
}

export default App
