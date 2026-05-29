import { useState, useEffect, useCallback, useRef } from 'react'
import Scene from './components/Scene'
import HandTracker from './components/HandTracker'
import './App.css'

const messages = [
  '在万千粒子中，我只看到你',
  '心跳的节奏，因你而动',
  'Every particle beats for you',
  '伸手触碰，即是永恒',
  '你是我最想留住的幸运',
]

function App() {
  const [gestureData, setGestureData] = useState({
    tension: 0, isClosed: false, rotation: { x: 0, y: 0 },
    fingerHeart: false, twoHandHeart: false, velocity: 0, handsDetected: 0
  })
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraStatus, setCameraStatus] = useState('idle') // idle | loading | ready | error
  const [showMessage, setShowMessage] = useState(false)
  const [msgIdx, setMsgIdx] = useState(0)
  const [sparkleBurst, setSparkleBurst] = useState(null) // timestamp of last burst
  const prevFingerHeart = useRef(false)
  const prevTwoHandHeart = useRef(false)

  const handleGesture = useCallback((data) => {
    setGestureData(data)
  }, [])

  // Cycling romantic messages
  useEffect(() => {
    const t = setInterval(() => {
      setShowMessage(false)
      setTimeout(() => {
        setMsgIdx(i => (i + 1) % messages.length)
        setShowMessage(true)
      }, 700)
    }, 4500)
    setShowMessage(true)
    return () => clearInterval(t)
  }, [])

  // Sparkle burst on finger heart
  useEffect(() => {
    if (gestureData.fingerHeart && !prevFingerHeart.current) {
      setSparkleBurst(Date.now())
    }
    if (gestureData.twoHandHeart && !prevTwoHandHeart.current) {
      setSparkleBurst(Date.now())
    }
    prevFingerHeart.current = gestureData.fingerHeart
    prevTwoHandHeart.current = gestureData.twoHandHeart
  }, [gestureData.fingerHeart, gestureData.twoHandHeart])

  return (
    <div className="app-container">
      <Scene gestureData={gestureData} sparkleBurst={sparkleBurst} />

      {/* ── Tap to Start overlay ── */}
      {!cameraActive && (
        <div className="start-overlay">
          <div className="start-card" onClick={() => setCameraActive(true)}>
            <div className="start-heart">❤️</div>
            <h2 className="start-title">轻触开始</h2>
            <p className="start-desc">允许摄像头，用手势创造魔法</p>
            <div className="start-hints">
              <span>🖐️ 张开</span>
              <span>✊ 握拳</span>
              <span>🤌 比心</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {cameraActive && cameraStatus === 'loading' && (
        <div className="status-overlay">
          <div className="loading-spinner" />
          <span className="status-text">正在加载手势模型...</span>
        </div>
      )}

      {/* ── Error ── */}
      {cameraStatus === 'error' && (
        <div className="status-overlay">
          <span className="status-text error">摄像头不可用</span>
          <span className="status-sub">但爱心仍在为你跳动</span>
        </div>
      )}

      <HandTracker
        active={cameraActive}
        onGestureUpdate={handleGesture}
        onStatus={setCameraStatus}
      />

      {/* ── Romantic message ── */}
      <div className={`love-message ${showMessage ? 'visible' : ''}`}>
        <span className="message-text">{messages[msgIdx]}</span>
      </div>

      {/* ── Title ── */}
      <div className="title-area">
        <h1 className="main-title">For You</h1>
      </div>

      {/* ── Gesture feedback ── */}
      {gestureData.fingerHeart && (
        <div className="gesture-feedback" key="fh">比心!</div>
      )}
      {gestureData.twoHandHeart && (
        <div className="gesture-feedback big" key="th">双手比心!</div>
      )}

      {/* ── Gesture guide ── */}
      <div className={`gesture-guide ${gestureData.handsDetected === 0 && cameraStatus === 'ready' ? 'visible' : ''}`}>
        <div className="guide-card"><span className="guide-icon">🖐️</span><span className="guide-label">张开手掌</span></div>
        <div className="guide-card"><span className="guide-icon">✊</span><span className="guide-label">握紧拳头</span></div>
        <div className="guide-card"><span className="guide-icon">🤌</span><span className="guide-label">拇指食指</span></div>
      </div>

      {/* ── Bottom hint ── */}
      <div className="gesture-hints">
        <span>移动手掌 · 旋转视角</span>
      </div>
    </div>
  )
}

export default App
