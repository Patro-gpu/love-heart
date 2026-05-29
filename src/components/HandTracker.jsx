import { useEffect, useRef, useState, useCallback } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

export default function HandTracker({ onGestureUpdate }) {
  const videoRef = useRef(null)
  const [cameraReady, setCameraReady] = useState(false)
  const prevWrist = useRef({ x: 0.5, y: 0.5 })

  const processGestures = useCallback((landmarks, numHands) => {
    const hand0 = landmarks[0]
    const hand1 = landmarks.length > 1 ? landmarks[1] : null

    // ── Tension: average fingertip-to-wrist distance ──
    const wrist = hand0[0]
    const tips = [4, 8, 12, 16, 20]
    let totalDist = 0
    for (const idx of tips) {
      const t = hand0[idx]
      totalDist += Math.sqrt((t.x - wrist.x) ** 2 + (t.y - wrist.y) ** 2 + (t.z - wrist.z) ** 2)
    }
    const raw = totalDist / 5
    const tension = Math.min(Math.max((raw - 0.22) / 0.28, 0), 1)
    const isClosed = tension < 0.12

    // ── Hand velocity (for jitter effect) ──
    const dx = wrist.x - prevWrist.current.x
    const dy = wrist.y - prevWrist.current.y
    const velocity = Math.sqrt(dx * dx + dy * dy) / 0.016 // per frame ~16ms
    prevWrist.current = { x: wrist.x, y: wrist.y }

    // ── Rotation from hand position ──
    const rotation = {
      y: (wrist.x - 0.5) * Math.PI * 2.5,
      x: (wrist.y - 0.5) * Math.PI * 1.2,
    }

    // ── Finger heart: thumb tip near index tip ──
    const thumbTip = hand0[4]
    const indexTip = hand0[8]
    const fingerDist = Math.sqrt((thumbTip.x - indexTip.x) ** 2 + (thumbTip.y - indexTip.y) ** 2)
    const fingerHeart = fingerDist < 0.035

    // ── Two-hand heart: thumbs close ──
    let twoHandHeart = false
    if (hand1) {
      const h1Thumb = hand1[4]
      const thumbDist = Math.sqrt((thumbTip.x - h1Thumb.x) ** 2 + (thumbTip.y - h1Thumb.y) ** 2)
      twoHandHeart = thumbDist < 0.07
    }

    onGestureUpdate({ tension, isClosed, rotation, fingerHeart, twoHandHeart, velocity, handsDetected: numHands })
  }, [onGestureUpdate])

  useEffect(() => {
    let handLandmarker = null
    let animationFrameId = null
    let lastTime = 0

    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        )
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
        })

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.addEventListener('loadeddata', () => {
            setCameraReady(true)
            lastTime = performance.now()
            loop()
          })
        }
      } catch (err) {
        console.warn('Camera unavailable:', err.message)
        setCameraReady(true) // still render, auto-rotate
      }
    }

    const loop = () => {
      if (videoRef.current && handLandmarker) {
        const now = performance.now()
        // Run detection at ~30fps to save CPU
        if (now - lastTime > 33) {
          lastTime = now
          const results = handLandmarker.detectForVideo(videoRef.current, now)
          if (results.landmarks?.length > 0) {
            processGestures(results.landmarks, results.landmarks.length)
          } else {
            prevWrist.current = { x: 0.5, y: 0.5 }
            onGestureUpdate({ tension: 0, isClosed: false, rotation: { x: 0, y: 0 }, fingerHeart: false, twoHandHeart: false, velocity: 0, handsDetected: 0 })
          }
        }
        animationFrameId = requestAnimationFrame(loop)
      }
    }

    init()
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (handLandmarker) handLandmarker.close()
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      }
    }
  }, [processGestures, onGestureUpdate])

  return (
    <>
      {!cameraReady && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.5)', fontSize: 13, zIndex: 20, fontFamily: '"Noto Sans SC", sans-serif'
        }}>
          正在启动摄像头...
        </div>
      )}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay playsInline muted
      />
    </>
  )
}
