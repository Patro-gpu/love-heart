import * as THREE from 'three'

export const generateParticles = (template, count = 5000) => {
  const positions = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    let x, y, z
    const i3 = i * 3

    switch (template) {
      case 'hearts':
        // Heart shape
        const t = Math.random() * Math.PI * 2
        // A simple 2D heart extruded or 3D heart approximation
        // (16sin^3(t), 13cos(t)-5cos(2t)-2cos(3t)-cos(4t))
        // Let's add some depth
        const r = Math.sqrt(Math.random()) // Uniform distribution in circle
        const phi = Math.random() * Math.PI * 2
        
        // 3D Heart approximation
        // x = 16sin^3(u)sin^2(v)
        // y = (13cos(u)-5cos(2u)-2cos(3u)-cos(4u))sin^2(v)
        // z = ... let's keep it simpler. 
        
        // Let's use a simpler random distribution inside a heart volume
        // Rejection sampling or just mapping
        
        // Using a known parametric heart
        const u = Math.random() * Math.PI * 2
        const v = Math.random() * Math.PI
        
        // Scale factor
        const s = 0.1
        
        x = s * 16 * Math.pow(Math.sin(u), 3) * Math.sin(v)
        y = s * (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * Math.sin(v)
        z = s * 6 * Math.cos(v) // Thickness
        break

      case 'flowers':
        // Phyllotaxis
        const angle = i * 137.5 * (Math.PI / 180)
        const radius = 0.1 * Math.sqrt(i)
        // Add some 3D curvature to make it look like a flower bowl
        const curve = Math.pow(radius, 2) * 0.5
        
        x = radius * Math.cos(angle)
        z = radius * Math.sin(angle)
        y = -curve + 2 // Lift it up
        break

      case 'saturn':
        // Planet + Ring
        if (i < count * 0.3) {
          // Planet (Sphere)
          const theta = Math.random() * Math.PI * 2
          const phi2 = Math.acos(2 * Math.random() - 1)
          const rad = 1.5
          x = rad * Math.sin(phi2) * Math.cos(theta)
          y = rad * Math.sin(phi2) * Math.sin(theta)
          z = rad * Math.cos(phi2)
        } else {
          // Ring (Disc)
          const theta = Math.random() * Math.PI * 2
          const rad = 2.5 + Math.random() * 1.5
          x = rad * Math.cos(theta)
          z = rad * Math.sin(theta)
          y = (Math.random() - 0.5) * 0.1 // Thin
        }
        break

      case 'buddha':
        // Simplified "Meditating Figure" (Stacked Spheres/Ovals)
        // Head, Body, Base
        const part = Math.random()
        if (part < 0.2) {
          // Head
          const theta = Math.random() * Math.PI * 2
          const phi2 = Math.acos(2 * Math.random() - 1)
          const rad = 0.6
          x = rad * Math.sin(phi2) * Math.cos(theta)
          y = rad * Math.sin(phi2) * Math.sin(theta) + 1.8
          z = rad * Math.cos(phi2)
        } else if (part < 0.6) {
          // Body
          const theta = Math.random() * Math.PI * 2
          const phi2 = Math.acos(2 * Math.random() - 1)
          const rad = 1.0
          // Stretch y
          x = rad * Math.sin(phi2) * Math.cos(theta) * 1.2
          y = rad * Math.sin(phi2) * Math.sin(theta) * 1.2 + 0.5
          z = rad * Math.cos(phi2) * 0.8
        } else {
          // Base (Legs crossed)
          const theta = Math.random() * Math.PI * 2
          const rad = 1.5 * Math.sqrt(Math.random())
          x = rad * Math.cos(theta)
          z = rad * Math.sin(theta)
          y = -0.5 + Math.random() * 0.5
        }
        break

      case 'fireworks':
        // Explosion from center
        const theta2 = Math.random() * Math.PI * 2
        const phi3 = Math.acos(2 * Math.random() - 1)
        const rad2 = Math.random() * 4
        x = rad2 * Math.sin(phi3) * Math.cos(theta2)
        y = rad2 * Math.sin(phi3) * Math.sin(theta2)
        z = rad2 * Math.cos(phi3)
        break

      case 'f1':
        // F1 Car Approximation
        const p = Math.random()
        
        if (p < 0.4) {
          // Body (Main Fuselage)
          // Elongated along Z axis
          x = (Math.random() - 0.5) * 0.8
          y = (Math.random() - 0.5) * 0.5
          z = (Math.random() - 0.5) * 4.0
        } else if (p < 0.6) {
          // Wheels (4 Cylinders)
          const wheelPos = Math.random()
          const wx = wheelPos < 0.5 ? -1.0 : 1.0 // Left/Right
          const wz = Math.random() < 0.5 ? -1.5 : 1.5 // Front/Back
          
          // Wheel shape (Cylinder on X axis)
          const wTheta = Math.random() * Math.PI * 2
          const wRad = 0.4 * Math.sqrt(Math.random())
          const wWidth = (Math.random() - 0.5) * 0.4
          
          x = wx + wWidth
          y = wRad * Math.sin(wTheta) - 0.2
          z = wz + wRad * Math.cos(wTheta)
        } else if (p < 0.7) {
           // Front Wing
           x = (Math.random() - 0.5) * 2.5
           y = (Math.random() - 0.5) * 0.1 - 0.2
           z = 2.2 + (Math.random() - 0.5) * 0.5
        } else if (p < 0.8) {
           // Rear Wing
           x = (Math.random() - 0.5) * 2.0
           y = 0.5 + (Math.random() - 0.5) * 0.1
           z = -2.0 + (Math.random() - 0.5) * 0.5
        } else {
           // Road (Moving backwards simulation handled in animation loop, here just initial placement)
           // Place them below the car
           x = (Math.random() - 0.5) * 10
           y = -1.0
           z = (Math.random() - 0.5) * 20
        }
        break

      case 'dinosaur':
        // T-Rex Approximation
        const pd = Math.random()
        if (pd < 0.3) {
           // Body
           x = (Math.random() - 0.5) * 1.0
           y = (Math.random() - 0.5) * 1.5
           z = (Math.random() - 0.5) * 2.5
        } else if (pd < 0.5) {
           // Head
           x = (Math.random() - 0.5) * 0.8
           y = 1.0 + (Math.random() - 0.5) * 0.8
           z = 1.5 + (Math.random() - 0.5) * 1.0
        } else if (pd < 0.7) {
           // Tail
           const t = Math.random()
           x = (Math.random() - 0.5) * (0.5 * (1-t))
           y = -0.5 + t * 0.5
           z = -1.5 - t * 2.0
        } else {
           // Legs
           const leg = Math.random() > 0.5 ? 0.5 : -0.5
           x = leg + (Math.random() - 0.5) * 0.4
           y = -1.5 + (Math.random() - 0.5) * 1.0
           z = (Math.random() - 0.5) * 0.8
        }
        break

      case 'starship':
        // Enterprise-ish shape
        const ps = Math.random()
        if (ps < 0.4) {
           // Saucer
           const r = Math.sqrt(Math.random()) * 1.5
           const theta = Math.random() * Math.PI * 2
           x = r * Math.cos(theta)
           z = r * Math.sin(theta) + 1.0
           y = (Math.random() - 0.5) * 0.2
        } else if (ps < 0.6) {
           // Engineering Hull
           x = (Math.random() - 0.5) * 0.4
           y = -0.5 + (Math.random() - 0.5) * 0.4
           z = -1.0 + (Math.random() - 0.5) * 2.0
        } else {
           // Nacelles
           const side = Math.random() > 0.5 ? 1.2 : -1.2
           x = side + (Math.random() - 0.5) * 0.2
           y = 0.5 + (Math.random() - 0.5) * 0.2
           z = -1.0 + (Math.random() - 0.5) * 2.5
        }
        break

      case 'engine':
        // V8 Engine Block
        // Cylinders
        const cyl = Math.floor(Math.random() * 8)
        const side = cyl % 2 === 0 ? 1 : -1
        const row = Math.floor(cyl / 2)
        
        // V shape
        const angleV = side * 0.5 // Radians tilt
        
        // Local cylinder coords
        const cr = Math.sqrt(Math.random()) * 0.3
        const cth = Math.random() * Math.PI * 2
        const ch = (Math.random() - 0.5) * 0.8
        
        // Transform to V8 position
        const cx = cr * Math.cos(cth)
        const cy = ch
        const cz = cr * Math.sin(cth)
        
        // Rotate by V angle
        const rx = cx * Math.cos(angleV) - cy * Math.sin(angleV)
        const ry = cx * Math.sin(angleV) + cy * Math.cos(angleV)
        
        x = rx + side * 0.2
        y = ry
        z = row * 0.6 - 1.2 + cz
        break

      case 'galaxy':
        // Spiral Galaxy
        const arms = 4
        const armAngle = (Math.random() * Math.PI * 2)
        const dist = Math.random()
        const spiral = 3.0 * dist
        const arm = Math.floor(Math.random() * arms)
        const armOffset = (Math.PI * 2 / arms) * arm
        
        const finalAngle = spiral + armOffset + (Math.random() - 0.5) * 0.5
        const rGalaxy = dist * 4.0
        
        x = rGalaxy * Math.cos(finalAngle)
        z = rGalaxy * Math.sin(finalAngle)
        y = (Math.random() - 0.5) * (0.5 * (1 - dist)) // Bulge in center
        break

      default:
        x = (Math.random() - 0.5) * 5
        y = (Math.random() - 0.5) * 5
        z = (Math.random() - 0.5) * 5
    }

    positions[i3] = x
    positions[i3 + 1] = y
    positions[i3 + 2] = z
  }

  return positions
}
