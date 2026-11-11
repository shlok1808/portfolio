/**
 * Background preview: the original dither plus five new directions, all in the same 3 px
 * Bayer-dithered style, switchable live so they can be compared on the real page.
 *
 *   0 original  — the dither as it was
 *   1 riso      — a second, misregistered ink in the accent colour drifting past the first
 *   2 contour   — a slowly shifting topographic map, with every fourth line heavier
 *   3 sky       — dithered star trails wheeling around a pole just off the top-right corner
 *   4 darkroom  — the print develops as each part of the page scrolls into view
 *   5 flow      — the dots stream on a slow current; the cursor drops ripples into it
 */
import { readTheme, onThemeChange, type RGB, type Theme } from '../../lab/lib/theme'
import type { ArtMount, Lane } from './types'

export const VARIANTS = [
  { id: 'sunset', label: 'Sunset' }, // drawn by ./sunset.ts, not this shader
  { id: 'original', label: 'Original' },
  { id: 'riso', label: 'Riso' },
  { id: 'contour', label: 'Contour' },
  { id: 'sky', label: 'Night sky' },
  { id: 'darkroom', label: 'Darkroom' },
  { id: 'flow', label: 'Flow' },
] as const
export type VariantId = (typeof VARIANTS)[number]['id']
const SHADER_IDS: VariantId[] = VARIANTS.map((v) => v.id).filter((id) => id !== 'sunset')

const TRAIL = 8
const BANDS = 48
const BAND_H = 220 // page px per darkroom band

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uGrid, uLane;
uniform float uTime, uStrength, uLaneFloor, uScroll, uAccentStrength;
uniform int uMode, uSky;
uniform vec3 uGround, uInk, uAccent;
uniform vec4 uTrail[${TRAIL}]; // x, y (css px), weight, age (s)
uniform float uDev[${BANDS}];
out vec4 o;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float a = 0.0, s = 0.5;
  for (int i = 0; i < 4; i++) { a += s * noise(p); p = p * 2.03 + 17.1; s *= 0.5; }
  return a;
}
float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }

// the original drifting field
float field(vec2 p, float t){
  vec2 q = p * 0.0019;
  vec2 w = vec2(fbm(q + vec2(0.0, t * 0.025)), fbm(q + vec2(5.2, 1.3) - t * 0.02));
  return smoothstep(0.32, 0.78, fbm(q * 1.2 + 1.7 * w + vec2(t * 0.01, 0.0))) * 0.78;
}
float cursorTrace(vec2 p){
  float v = 0.0;
  for (int i = 0; i < ${TRAIL}; i++) {
    vec4 c = uTrail[i];
    if (c.z <= 0.001) continue;
    vec2 d = p - c.xy;
    v += c.z * 0.12 * exp(-dot(d, d) / 1200.0);
  }
  return v;
}

void main(){
  vec2 cell = vec2(floor(gl_FragCoord.x), uGrid.y - 1.0 - floor(gl_FragCoord.y));
  vec2 p = (cell + 0.5) * 3.0;
  float t = uTime;
  float v = 0.0;      // ink tone
  float va = 0.0;     // accent tone (riso only)
  float th = bayer8(cell);

  if (uMode == 0) {
    v = field(p, t) + cursorTrace(p);
  } else if (uMode == 1) {
    // riso: ink plus a second, offset layer of accent ink on its own drift
    v = field(p, t) * 0.85 + cursorTrace(p);
    vec2 pa = p + vec2(5.0, -4.0); // misregistration
    vec2 qa = pa * 0.0016;
    vec2 wa = vec2(fbm(qa + vec2(9.1, -t * 0.03)), fbm(qa + vec2(-3.7, t * 0.022)));
    va = smoothstep(0.38, 0.8, fbm(qa * 1.3 + 1.5 * wa - vec2(t * 0.016, 0.0) + 11.0)) * 0.7;
  } else if (uMode == 2) {
    // contour map: iso-lines of a slow field
    vec2 q = p * 0.0013;
    vec2 w = vec2(fbm(q + vec2(0.0, t * 0.012)), fbm(q + vec2(5.2, 1.3) - t * 0.01));
    float f = fbm(q * 1.1 + 0.9 * w) * 11.0;
    float d = abs(fract(f + 0.5) - 0.5);
    float fw = max(fwidth(f), 0.001);
    float line = 1.0 - smoothstep(0.0, fw * 1.1, d);
    float major = mod(floor(f + 0.5), 4.0) < 0.5 ? 1.0 : 0.55;
    v = line * major + cursorTrace(p);
  } else if (uMode == 3) {
    // night sky: star trails wheeling around a pole off the top-right corner
    vec2 size = uGrid * 3.0;
    vec2 pole = vec2(size.x * 0.92, -size.y * 0.18);
    vec2 rel = p - pole;
    float r = length(rel);
    float ang = atan(rel.y, rel.x);
    float ringW = 9.0;
    float ring = floor(r / ringW);
    float inRow = step(abs(r - (ring + 0.5) * ringW), 1.6); // one dot row per ring
    float h = hash(vec2(ring, 3.1));
    float h2 = hash(vec2(ring, 8.7));
    float h3 = hash(vec2(ring, 1.9));
    float lit = step(0.42, h);
    float len = 0.12 + 0.45 * h2;                          // trail length, radians
    float head = h3 * 6.2832 + t * 0.012 * (0.6 + h);      // slow rotation
    float da = mod(head - ang, 6.2832);
    float trail = da < len ? pow(1.0 - da / len, 1.6) : 0.0;
    float glint = da < 0.012 ? 0.4 : 0.0;                 // a brighter head
    v = (trail * (0.55 + 0.45 * h2) + glint) * inRow * lit;
    // a few faint static stars
    float s = hash(cell * 0.37 + 4.0);
    v += step(0.9975, s) * 0.9;
    v += cursorTrace(p) * 0.8;
  } else if (uMode == 4) {
    // darkroom: the print is anchored to the page and develops as it scrolls into view
    float py = p.y + uScroll;
    float b = clamp(py / ${BAND_H}.0 - 0.5, 0.0, ${BANDS}.0 - 1.001);
    int i0 = int(floor(b));
    float dev = mix(uDev[i0], uDev[min(i0 + 1, ${BANDS - 1})], smoothstep(0.0, 1.0, fract(b)));
    vec2 pp = vec2(p.x, py);
    float base = field(pp, t * 0.4);
    // developing: the image comes up from the paper, slightly over-contrasty midway
    float dv = smoothstep(0.0, 1.0, dev);
    v = base * dv * (1.0 + 0.35 * sin(3.1416 * dv)) + cursorTrace(p);
  } else {
    // flow: the dots stream on a slow current; the cursor drops ripples into it
    vec2 q = p * 0.0019;
    vec2 wind = vec2(t * 0.045, -t * 0.012);
    vec2 w = vec2(fbm(q * 0.8 + vec2(0.0, t * 0.02)), fbm(q * 0.8 + vec2(5.2, 1.3) - t * 0.015)) - 0.5;
    vec2 s = (q - wind) * vec2(0.55, 1.6) + 1.4 * w; // stretched along the current
    v = smoothstep(0.34, 0.8, fbm(s)) * 0.8;
    for (int i = 0; i < ${TRAIL}; i++) {
      vec4 c = uTrail[i];
      if (c.z <= 0.001) continue;
      float R = c.w * 220.0;
      float d = length(p - c.xy);
      float band = exp(-pow(d - R, 2.0) / (2.0 * 12.0 * 12.0));
      v += band * c.z * 0.55;
    }
  }

  float on = step(th + 0.001, clamp(v, 0.0, 1.0));
  // no stray dither dots in the empty ground: only the lines themselves are inked
  on *= step(0.02, v);
  float onA = step(bayer8(cell.yx + vec2(3.0, 5.0)) + 0.001, clamp(va, 0.0, 1.0));
  float inLane = smoothstep(uLane.x - 140.0, uLane.x + 40.0, p.x) * (1.0 - smoothstep(uLane.y - 40.0, uLane.y + 140.0, p.x));
  float k = 1.0 - inLane * (1.0 - uLaneFloor);
  // light mode: a sky gradient down the screen (sky blue, then pale blue-green, then a soft butter yellow) in place of the flat ground
  vec3 g = uGround;
  if (uSky == 1) {
    float y = clamp(p.y / (uGrid.y * 3.0), 0.0, 1.0);
    vec3 s0 = vec3(0.561, 0.827, 0.941), s1 = vec3(0.722, 0.886, 0.933);
    vec3 s2 = vec3(0.859, 0.914, 0.847), s3 = vec3(0.957, 0.929, 0.776);
    g = y < 0.4 ? mix(s0, s1, y / 0.4) : y < 0.72 ? mix(s1, s2, (y - 0.4) / 0.32) : mix(s2, s3, (y - 0.72) / 0.28);
  }
  vec3 col = mix(g, uAccent, onA * uAccentStrength * k);
  col = mix(col, uInk, on * uStrength * k);
  o = vec4(col, 1.0);
}`

export type VariantController = ReturnType<ArtMount> & { setMode(id: VariantId): void }

export const mount = (host: HTMLElement, initial: VariantId = 'original'): VariantController => {
  const noop = { destroy() {}, setPaused() {}, setLane() {}, setMode() {} }
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const gl = canvas.getContext('webgl2', { alpha: false, depth: false, stencil: false, antialias: false })
  if (!gl) {
    canvas.remove()
    return noop
  }

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error('[variants]', gl.getShaderInfoLog(sh))
    return sh
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.bindAttribLocation(prog, 0, 'aPos')
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.error('[variants]', gl.getProgramInfoLog(prog))
  gl.useProgram(prog)
  gl.bindVertexArray(gl.createVertexArray())
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const U = (n: string) => gl.getUniformLocation(prog, n)
  const u = {
    grid: U('uGrid'), lane: U('uLane'), time: U('uTime'), strength: U('uStrength'),
    laneFloor: U('uLaneFloor'), scroll: U('uScroll'), accentStrength: U('uAccentStrength'),
    mode: U('uMode'), sky: U('uSky'), ground: U('uGround'), ink: U('uInk'), accent: U('uAccent'),
    trail: U('uTrail'), dev: U('uDev'),
  }

  const build = () => {
    canvas.width = Math.ceil((host.clientWidth || window.innerWidth) / 3)
    canvas.height = Math.ceil((host.clientHeight || window.innerHeight) / 3)
    canvas.style.width = `${canvas.width * 3}px`
    canvas.style.height = `${canvas.height * 3}px`
  }

  let theme: Theme = readTheme()
  let lane: Lane = { left: 0, right: 0 }
  const modeOf = (id: VariantId) => Math.max(0, SHADER_IDS.indexOf(id))
  let mode = modeOf(initial)
  const norm = (c: RGB): [number, number, number] => [c[0] / 255, c[1] / 255, c[2] / 255]

  // cursor: a few recent points; each has a weight (fades) and an age (for ripples)
  const trail = new Float32Array(TRAIL * 4)
  const pts: { x: number; y: number; w: number; age: number }[] = []
  let lx = -1
  let ly = -1
  const push = (x: number, y: number) => {
    pts.push({ x, y, w: 1, age: 0 })
    if (pts.length > TRAIL) pts.shift()
  }
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    const gap = mode === 5 ? 90 : 24
    if (lx >= 0 && Math.hypot(e.clientX - lx, e.clientY - ly) < gap) return
    push(e.clientX, e.clientY)
    lx = e.clientX
    ly = e.clientY
  }
  const onDown = (e: PointerEvent) => push(e.clientX, e.clientY)

  // darkroom: how developed each band of the page is
  const dev = new Float32Array(BANDS)

  const draw = (t: number) => {
    const dark = theme.mode === 'dark'
    trail.fill(0)
    pts.forEach((p, i) => trail.set([p.x, p.y, p.w, p.age], i * 4))
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u.grid, canvas.width, canvas.height)
    gl.uniform2f(u.lane, lane.left, lane.right)
    gl.uniform1f(u.time, t)
    gl.uniform1i(u.mode, mode)
    gl.uniform1i(u.sky, dark ? 0 : 1)
    gl.uniform1f(u.strength, (dark ? 0.2 : 0.14) * (mode === 2 || mode === 3 ? (dark ? 1.15 : 1.5) : 1))
    gl.uniform1f(u.accentStrength, mode === 1 ? (dark ? 0.32 : 0.24) : 0)
    // in dark, light lines on a dark ground pull harder at the eye: keep them fainter behind the text
    gl.uniform1f(u.laneFloor, dark ? 0.22 : 0.4)
    gl.uniform1f(u.scroll, window.scrollY)
    gl.uniform3fv(u.ground, norm(theme.ground))
    gl.uniform3fv(u.ink, norm(theme.ink))
    gl.uniform3fv(u.accent, norm(theme.accent))
    gl.uniform4fv(u.trail, trail)
    gl.uniform1fv(u.dev, dev)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let paused = false
  let hidden = document.hidden
  let raf = 0
  let prev = performance.now()
  let time = 30
  let last = 0

  const step = (dt: number) => {
    time += dt
    const life = mode === 5 ? 2.2 : 0.3
    for (const p of pts) {
      p.age += dt
      p.w *= Math.exp(-dt / life)
    }
    while (pts.length && pts[0].w < 0.02) pts.shift()
    if (mode === 4) {
      const top = window.scrollY
      const bottom = top + window.innerHeight
      for (let i = 0; i < BANDS; i++) {
        const a = (i + 0.5) * BAND_H
        const visible = a + BAND_H > top && a < bottom
        dev[i] = visible ? Math.min(1, dev[i] + dt / 2.2) : Math.max(0, dev[i] - dt / 6)
      }
    }
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    const dt = Math.max(0, Math.min((now - prev) / 1000, 0.05))
    prev = now
    if (paused || hidden) return
    step(dt)
    if (now - last < 33) return
    last = now
    draw(time)
  }

  let rt = 0
  const onResize = () => {
    clearTimeout(rt)
    rt = window.setTimeout(() => { build(); draw(time) }, 120)
  }
  const ro = new ResizeObserver(onResize)
  const onVis = () => { hidden = document.hidden; prev = performance.now() }

  build()
  draw(time)
  const offTheme = onThemeChange((th) => { theme = th; draw(time) })
  if (!reduced) {
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
  }
  document.addEventListener('visibilitychange', onVis)
  ro.observe(host)
  if (!reduced) raf = requestAnimationFrame(frame)
  else dev.fill(1)

  return {
    destroy() {
      cancelAnimationFrame(raf)
      clearTimeout(rt)
      offTheme()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('visibilitychange', onVis)
      ro.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    },
    setPaused(p) { paused = p; prev = performance.now(); if (p) draw(time) },
    setLane(l) { lane = l; draw(time) },
    setMode(id) {
      mode = modeOf(id)
      dev.fill(reduced ? 1 : 0) // darkroom re-develops each time it's picked
      pts.length = 0
      draw(time)
    },
  }
}
