/**
 * Geometry of the horizon wallpaper (public/horizon/*.webp) as it is laid out by .sky in
 * globals.css: object-fit: cover, object-position 50% 53% (landscape, aspect ≥ 1) or 50% 63%
 * (portrait). The planet's limb was measured from the photos: it is a parabola in image space,
 *   landscape: v(u) = 0.5278 + 0.1836 (u − ½)²   (1920 × 1241)
 *   portrait:  v(u) = 0.6292 + 0.1172 (u − ½)²   (880 × 1912)
 * Overlays use this to hug the real edge of the Earth.
 */

export interface HorizonMap {
  /** screen y of the limb at screen x (px, relative to the sky box) */
  limbY(x: number): number
  /** apex (highest point) of the limb */
  apexY: number
  /** image → box mapping */
  toBox(u: number, v: number): [number, number]
  landscape: boolean
  /** limbY(x) = apexY + curv · (x − cx)², for shaders */
  curv: number
  cx: number
}

export function horizonMap(boxW: number, boxH: number): HorizonMap {
  const landscape = boxW / boxH >= 1
  const [iw, ih, posY, v0, k] = landscape
    ? [1920, 1241, 0.53, 0.5278, 0.1836]
    : [880, 1912, 0.63, 0.6292, 0.1172]
  const s = Math.max(boxW / iw, boxH / ih)
  const dw = iw * s
  const dh = ih * s
  const ox = (boxW - dw) * 0.5
  const oy = (boxH - dh) * posY
  const toBox = (u: number, v: number): [number, number] => [ox + u * dw, oy + v * dh]
  const limbY = (x: number) => {
    const u = (x - ox) / dw
    return oy + (v0 + k * (u - 0.5) * (u - 0.5)) * dh
  }
  return { limbY, apexY: oy + v0 * dh, toBox, landscape, curv: (k * dh) / (dw * dw), cx: ox + dw / 2 }
}
