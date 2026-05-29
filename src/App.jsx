import { useState } from 'react'
import Scene from './components/Scene'
import HandTracker from './components/HandTracker'
import './App.css'

function App() {
  const [gestureData, setGestureData] = useState({
    tension: 0, isClosed: false, rotation: { x: 0, y: 0 },
    fingerHeart: false, twoHandHeart: false, velocity: 0
  })

  return (
    <div className="app-container">
      <Scene gestureData={gestureData} />
      <HandTracker onGestureUpdate={setGestureData} />

      <div className="title-area">
        <h1 className="main-title">For You</h1>
        <div className="subtitle">用手势诉说你的心意</div>
      </div>

      <div className="gesture-hints">
        <span>张开手掌 · 扩散</span>
        <span className="hint-divider">|</span>
        <span>握紧拳头 · 聚合</span>
        <span className="hint-divider">|</span>
        <span>移动手掌 · 旋转</span>
      </div>
    </div>
  )
}

export default App
