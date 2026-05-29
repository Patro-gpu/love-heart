import { useState, useEffect } from 'react'
import Scene from './components/Scene'
import HandTracker from './components/HandTracker'
import './App.css'

function App() {
  const [gestureData, setGestureData] = useState({
    tension: 0, isClosed: false, rotation: { x: 0, y: 0 },
    fingerHeart: false, twoHandHeart: false, velocity: 0, handsDetected: 0
  })
  const [showGuide, setShowGuide] = useState(true)

  // Show gesture guide when no hand detected for 4 seconds
  useEffect(() => {
    if (gestureData.handsDetected > 0) {
      setShowGuide(false)
    } else {
      const t = setTimeout(() => setShowGuide(true), 4000)
      return () => clearTimeout(t)
    }
  }, [gestureData.handsDetected])

  return (
    <div className="app-container">
      <Scene gestureData={gestureData} />
      <HandTracker onGestureUpdate={setGestureData} />

      {/* Title */}
      <div className="title-area">
        <h1 className="main-title">For You</h1>
        <div className="subtitle">用手势诉说你的心意</div>
      </div>

      {/* Camera status */}
      {gestureData.handsDetected === 0 && (
        <div className="camera-hint">
          <span className="camera-dot" />
          等待手势中...
        </div>
      )}
      {gestureData.fingerHeart && (
        <div className="gesture-feedback">比心!</div>
      )}
      {gestureData.twoHandHeart && (
        <div className="gesture-feedback big">双手比心!</div>
      )}

      {/* Gesture guide cards */}
      <div className={`gesture-guide ${showGuide ? 'visible' : ''}`}>
        <div className="guide-card">
          <span className="guide-icon">🖐️</span>
          <span className="guide-label">张开手掌</span>
          <span className="guide-effect">粒子扩散</span>
        </div>
        <div className="guide-card">
          <span className="guide-icon">✊</span>
          <span className="guide-label">握紧拳头</span>
          <span className="guide-effect">粒子聚合</span>
        </div>
        <div className="guide-card">
          <span className="guide-icon">🤌</span>
          <span className="guide-label">拇指食指比心</span>
          <span className="guide-effect">脉冲爆发</span>
        </div>
      </div>

      {/* Bottom hints */}
      <div className="gesture-hints">
        <span>移动手掌 · 旋转视角</span>
      </div>
    </div>
  )
}

export default App
