import { useEffect, useRef, useCallback } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

export default function HandTracker({ active, onGestureUpdate, onStatus }) {
  const videoRef = useRef(null)
  const lmRef = useRef(null)
  const prevWrist = useRef({ x: 0.5, y: 0.5 })
  const runningRef = useRef(false)

  const process = useCallback((landmarks, numHands) => {
    const h = landmarks[0]
    const h1 = landmarks.length > 1 ? landmarks[1] : null
    const wrist = h[0]
    const tips = [4, 8, 12, 16, 20]

    let d = 0
    for (const i of tips) {
      const t = h[i]
      d += Math.sqrt((t.x - wrist.x) ** 2 + (t.y - wrist.y) ** 2 + (t.z - wrist.z) ** 2)
    }
    const tension = Math.min(Math.max((d / 5 - 0.22) / 0.28, 0), 1)
    const isClosed = tension < 0.12

    const dx = wrist.x - prevWrist.current.x
    const dy = wrist.y - prevWrist.current.y
    const v = Math.sqrt(dx * dx + dy * dy) / 0.016
    prevWrist.current = { x: wrist.x, y: wrist.y }

    const rot = {
      y: (wrist.x - 0.5) * Math.PI * 2.5,
      x: (wrist.y - 0.5) * Math.PI * 1.2,
    }

    const fd = Math.sqrt((h[4].x - h[8].x) ** 2 + (h[4].y - h[8].y) ** 2)
    const fingerHeart = fd < 0.035

    let twoHandHeart = false
    if (h1) {
      const td = Math.sqrt((h[4].x - h1[4].x) ** 2 + (h[4].y - h1[4].y) ** 2)
      twoHandHeart = td < 0.07
    }

    onGestureUpdate({ tension, isClosed, rotation: rot, fingerHeart, twoHandHeart, velocity: v, handsDetected: numHands })
  }, [onGestureUpdate])

  useEffect(() => {
    if (!active || runningRef.current) return
    runningRef.current = true

    const init = async () => {
      try {
        onStatus?.('loading')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        )
        const lm = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: './hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 2,
        })
        lmRef.current = lm

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        onStatus?.('ready')

        const loop = () => {
          if (!lmRef.current || !videoRef.current) return
          const r = lmRef.current.detectForVideo(videoRef.current, performance.now())
          if (r.landmarks?.length > 0) process(r.landmarks, r.landmarks.length)
          else {
            prevWrist.current = { x: 0.5, y: 0.5 }
            onGestureUpdate({ tension: 0, isClosed: false, rotation: { x: 0, y: 0 }, fingerHeart: false, twoHandHeart: false, velocity: 0, handsDetected: 0 })
          }
          requestAnimationFrame(loop)
        }
        loop()
      } catch (err) {
        console.warn('Init failed:', err.message)
        onStatus?.('error')
      }
    }
    init()
  }, [active, onStatus, process, onGestureUpdate])

  useEffect(() => {
    return () => {
      lmRef.current?.close()
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  return (
    <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline muted />
  )
}
