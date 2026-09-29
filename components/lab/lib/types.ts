export interface BgOptions {
  /** small preview tile in the lab index: fewer particles, no DOM chrome */
  thumb?: boolean
}

export interface BgController {
  destroy(): void
  setPaused(p: boolean): void
}

export type BgMount = (host: HTMLElement, opts: BgOptions) => BgController

/** Pre-rendered soft glow (radial gradient) for cheap drawImage-based bloom. */
export function glowSprite(rgb: [number, number, number], size = 64, core = 0.18) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  const [r, gg, b] = rgb
  grad.addColorStop(0, `rgba(${r},${gg},${b},1)`)
  grad.addColorStop(core, `rgba(${r},${gg},${b},0.55)`)
  grad.addColorStop(0.45, `rgba(${r},${gg},${b},0.12)`)
  grad.addColorStop(1, `rgba(${r},${gg},${b},0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return c
}
