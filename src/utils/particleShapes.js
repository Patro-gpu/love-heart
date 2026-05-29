function heartParametric(t, scale = 1) {
  const x = scale * 16 * Math.pow(Math.sin(t), 3)
  const y = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
  return { x, y }
}

export const generateHeartParticles = (count = 25000) => {
  const restPositions = new Float32Array(count * 3)
  const explodeOffsets = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const speeds = new Float32Array(count)

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

    // Distance from center — used to determine color zone
    const dist = Math.sqrt(rx * rx + ry * ry + rz * rz)

    // Explode offset: push radially outward
    const strength = 0.8 + Math.random() * 3.2
    explodeOffsets[i3]     = (rx / (dist + 0.001)) * strength
    explodeOffsets[i3 + 1] = (ry / (dist + 0.001)) * strength
    explodeOffsets[i3 + 2] = (rz / (dist + 0.001)) * strength

    speeds[i] = 0.3 + Math.random() * 0.7

    // ── Multi-color palette: pink/red core + blue/cyan edge + gold accents ──
    const rand = Math.random()
    const edgeFactor = Math.min(dist / 4.5, 1.0) // 0 = core, 1 = edge

    let cr, cg, cb

    if (rand < 0.30) {
      // Hot pink / magenta (core)
      cr = 0.95 + Math.random() * 0.05
      cg = 0.06 + Math.random() * 0.2
      cb = 0.35 + Math.random() * 0.35
    } else if (rand < 0.52) {
      // Deep red / rose
      cr = 0.78 + Math.random() * 0.22
      cg = 0.02 + Math.random() * 0.08
      cb = 0.05 + Math.random() * 0.2
    } else if (rand < 0.70) {
      // Cyan / electric blue (edge accent)
      cr = 0.05 + Math.random() * 0.2
      cg = 0.6 + Math.random() * 0.35
      cb = 0.8 + Math.random() * 0.2
    } else if (rand < 0.84) {
      // Purple / violet
      cr = 0.5 + Math.random() * 0.3
      cg = 0.05 + Math.random() * 0.15
      cb = 0.6 + Math.random() * 0.4
    } else if (rand < 0.93) {
      // Gold / amber spark (accent)
      cr = 0.9 + Math.random() * 0.1
      cg = 0.55 + Math.random() * 0.3
      cb = 0.05 + Math.random() * 0.15
    } else {
      // Soft white / blush
      cr = 0.85 + Math.random() * 0.15
      cg = 0.55 + Math.random() * 0.35
      cb = 0.6 + Math.random() * 0.35
    }

    // Slightly boost blue on edges, pink in core
    colors[i3]     = cr
    colors[i3 + 1] = cg
    colors[i3 + 2] = cb
  }

  return { restPositions, explodeOffsets, colors, speeds }
}

export const generateStars = (count = 2000) => {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const rad = 10 + Math.random() * 15
    positions[i3]     = rad * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = rad * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = rad * Math.cos(phi)

    // Colorful stars: blues, cyans, purples, pinks
    const r = Math.random()
    if (r < 0.3) {
      colors[i3] = 0.2 + Math.random() * 0.3; colors[i3 + 1] = 0.5 + Math.random() * 0.4; colors[i3 + 2] = 0.7 + Math.random() * 0.3
    } else if (r < 0.55) {
      colors[i3] = 0.6 + Math.random() * 0.4; colors[i3 + 1] = 0.3 + Math.random() * 0.4; colors[i3 + 2] = 0.6 + Math.random() * 0.4
    } else if (r < 0.75) {
      colors[i3] = 0.7 + Math.random() * 0.3; colors[i3 + 1] = 0.2 + Math.random() * 0.3; colors[i3 + 2] = 0.3 + Math.random() * 0.3
    } else {
      colors[i3] = 0.5 + Math.random() * 0.5; colors[i3 + 1] = 0.5 + Math.random() * 0.5; colors[i3 + 2] = 0.5 + Math.random() * 0.5
    }
  }

  return { positions, colors }
}
