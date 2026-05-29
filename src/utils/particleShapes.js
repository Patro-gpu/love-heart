function heartParametric(t, scale = 1) {
  const x = scale * 16 * Math.pow(Math.sin(t), 3)
  const y = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
  return { x, y }
}

export const generateHeartParticles = (count = 25000) => {
  // restPositions: the tight heart shape
  // explodeOffsets: radial push outward for each particle
  const restPositions = new Float32Array(count * 3)
  const explodeOffsets = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const speeds = new Float32Array(count) // per-particle lerp speed

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const u = Math.random() * Math.PI * 2
    const v = Math.random() * Math.PI
    const s = 0.12

    const shell = heartParametric(u, s)
    const thickness = 0.7 + Math.random() * 0.3

    const rx = shell.x * Math.sin(v) * thickness
    const ry = shell.y * Math.sin(v) * thickness
    const rz = s * 6 * Math.cos(v) * thickness

    restPositions[i3]     = rx
    restPositions[i3 + 1] = ry
    restPositions[i3 + 2] = rz

    // Explode offset: push radially outward
    const dist = Math.sqrt(rx * rx + ry * ry + rz * rz) + 0.001
    const strength = 0.8 + Math.random() * 3.2 // varied push amounts
    explodeOffsets[i3]     = (rx / dist) * strength
    explodeOffsets[i3 + 1] = (ry / dist) * strength
    explodeOffsets[i3 + 2] = (rz / dist) * strength

    // Per-particle response speed: some slow (0.3), some fast (1.0)
    speeds[i] = 0.3 + Math.random() * 0.7

    // Pink → red → purple gradient
    const r = Math.random()
    if (r < 0.35) {
      colors[i3] = 1.0; colors[i3 + 1] = 0.08 + Math.random() * 0.18; colors[i3 + 2] = 0.4 + Math.random() * 0.3
    } else if (r < 0.65) {
      colors[i3] = 0.82 + Math.random() * 0.18; colors[i3 + 1] = 0.02 + Math.random() * 0.06; colors[i3 + 2] = 0.08 + Math.random() * 0.14
    } else if (r < 0.85) {
      colors[i3] = 0.6 + Math.random() * 0.3; colors[i3 + 1] = 0.04 + Math.random() * 0.08; colors[i3 + 2] = 0.6 + Math.random() * 0.4
    } else {
      colors[i3] = 0.9 + Math.random() * 0.1; colors[i3 + 1] = 0.55 + Math.random() * 0.3; colors[i3 + 2] = 0.65 + Math.random() * 0.3
    }
  }

  return { restPositions, explodeOffsets, colors, speeds }
}

export const generateStars = (count = 2000) => {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const rad = 10 + Math.random() * 15
    positions[i3]     = rad * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = rad * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = rad * Math.cos(phi)
  }
  return positions
}
