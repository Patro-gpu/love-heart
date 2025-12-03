import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

export default function HandTracker({ onGestureUpdate }) {
  const videoRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let handLandmarker = null
    let animationFrameId = null

    const setupMediaPipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      )

      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      })

      setIsLoaded(true)
      startWebcam()
    }

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720
          }
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.addEventListener("loadeddata", predictWebcam)
        }
      }
    }

    const predictWebcam = () => {
      if (videoRef.current && handLandmarker) {
        let startTimeMs = performance.now()
        const results = handLandmarker.detectForVideo(videoRef.current, startTimeMs)

        if (results.landmarks && results.landmarks.length > 0) {
          // Process landmarks for the first detected hand
          const landmarks = results.landmarks[0]

          // Calculate Tension: Average distance from palm (wrist) to fingertips
          // Wrist is index 0. Fingertips are 4, 8, 12, 16, 20
          const wrist = landmarks[0]
          const fingertips = [4, 8, 12, 16, 20]

          let totalDist = 0
          fingertips.forEach(idx => {
            const tip = landmarks[idx]
            const dist = Math.sqrt(
              Math.pow(tip.x - wrist.x, 2) +
              Math.pow(tip.y - wrist.y, 2) +
              Math.pow(tip.z - wrist.z, 2)
            )
            totalDist += dist
          })

          // Normalize tension roughly (0.2 is closed, 0.5 is open)
          // We map 0.2 -> 0 and 0.5 -> 1
          const rawTension = totalDist / 5
          const tension = Math.min(Math.max((rawTension - 0.2) / 0.3, 0), 1)

          // Calculate Closing: Check if fingertips are close to palm base
          // Simple heuristic: if tension is very low
          const isClosed = tension < 0.2

          // Calculate Rotation based on Hand Position in frame
          // wrist.x and wrist.y are normalized [0, 1]
          // Center is 0.5, 0.5
          // Map x to Yaw (rotate around Y axis)
          // Map y to Pitch (rotate around X axis)

          // Sensitivity factor
          const sensitivity = 1.5
          const rotation = {
            y: (wrist.x - 0.5) * sensitivity * Math.PI, // Yaw
            x: 0 // Pitch restricted
          }

          onGestureUpdate({ tension, isClosed, rotation })
        } else {
          // No hand detected, reset to neutral
          onGestureUpdate({ tension: 0.5, isClosed: false, rotation: { x: 0, y: 0 } })
        }

        animationFrameId = requestAnimationFrame(predictWebcam)
      }
    }

    setupMediaPipe()

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (handLandmarker) handLandmarker.close()
      // Stop webcam stream
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      }
    }
  }, [onGestureUpdate])

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, opacity: 0.3, pointerEvents: 'none', zIndex: 10 }}>
      {!isLoaded && <div style={{ color: 'white', padding: '10px' }}>Loading Hand Tracking...</div>}
      <video ref={videoRef} style={{ width: '320px', height: 'auto', transform: 'scaleX(-1)' }} autoPlay playsInline muted />
    </div>
  )
}
