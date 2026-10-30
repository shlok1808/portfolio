/**
 * Dither — the whole page as a faint 1-bit print, like an old Mac screen.
 *
 * A soft tonal field (slowly drifting, domain-warped noise) is drawn with an 8×8 Bayer ordered
 * dither in 3 px dots of faint ink, so dense and empty patches wander across the paper. The
 * cursor leaves only a small, brief trace of dots behind it.
 */
import { readTheme, onThemeChange, type RGB, type Theme } from '../../lab/lib/theme'
import type { ArtMount, Lane } from './types'

const TRAIL = 8

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes, uLane;
uniform float uDpr, uTime, uStrength, uLaneFloor;
uniform vec3 uGround, uInk;
uniform vec3 uTrail[${TRAIL}]; // x, y (css px), weight
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

void main(){
  // one dot = 3 CSS px, evaluated at its centre so the dots stay crisp
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 cell = floor(fc / 3.0);
  vec2 p = (cell + 0.5) * 3.0;

  vec2 q = p * 0.0019;
  float t = uTime;
  vec2 w = vec2(fbm(q + vec2(0.0, t * 0.025)), fbm(q + vec2(5.2, 1.3) - t * 0.02));
  float v = smoothstep(0.32, 0.78, fbm(q * 1.2 + 1.7 * w + vec2(t * 0.01, 0.0))) * 0.78;
  for (int i = 0; i < ${TRAIL}; i++) {
    vec3 c = uTrail[i];
    if (c.z <= 0.001) continue;
    vec2 d = p - c.xy;
    v += c.z * 0.12 * exp(-dot(d, d) / 1200.0);
  }

  float on = step(bayer8(cell) + 0.001, clamp(v, 0.0, 1.0));
  float x = gl_FragCoord.x;
  float inLane = smoothstep(uLane.x - 140.0 * uDpr, uLane.x + 40.0 * uDpr, x)
               * (1.0 - smoothstep(uLane.y - 40.0 * uDpr, uLane.y + 140.0 * uDpr, x));
  float k = 1.0 - inLane * (1.0 - uLaneFloor);
  o = vec4(mix(uGround, uInk, on * uStrength * k), 1.0);
}`

export const mount: ArtMount = (host) => {
  const noop = { destroy() {}, setPaused() {}, setLane() {} }
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
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error('[dither]', gl.getShaderInfoLog(sh))
    return sh
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.bindAttribLocation(prog, 0, 'aPos')
  gl.linkProgram(prog)
  gl.useProgram(prog)
  const vao = gl.createVertexArray()!
  gl.bindVertexArray(vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const U = (n: string) => gl.getUniformLocation(prog, n)
  const u = {
    res: U('uRes'),
    lane: U('uLane'),
    dpr: U('uDpr'),
    time: U('uTime'),
    strength: U('uStrength'),
    laneFloor: U('uLaneFloor'),
    ground: U('uGround'),
    ink: U('uInk'),
    trail: U('uTrail'),
  }

  let W = 1
  let H = 1
  let dpr = 1
  const build = () => {
    W = Math.max(1, host.clientWidth)
    H = Math.max(1, host.clientHeight)
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
  }

  let theme: Theme = readTheme()
  let lane: Lane = { left: 0, right: 0 }
  const norm = (c: RGB): [number, number, number] => [c[0] / 255, c[1] / 255, c[2] / 255]

  // the cursor's trace: a few recent positions, each gone within half a second
  const trail = new Float32Array(TRAIL * 3)
  const pts: { x: number; y: number; w: number }[] = []
  let lx = -1
  let ly = -1
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    if (lx >= 0 && Math.hypot(e.clientX - lx, e.clientY - ly) < 24) return
    pts.push({ x: e.clientX, y: e.clientY, w: 1 })
    if (pts.length > TRAIL) pts.shift()
    lx = e.clientX
    ly = e.clientY
  }

  const draw = (t: number) => {
    const dark = theme.mode === 'dark'
    trail.fill(0)
    pts.forEach((p, i) => trail.set([p.x, p.y, p.w], i * 3))
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u.res, canvas.width, canvas.height)
    gl.uniform2f(u.lane, lane.left * dpr, lane.right * dpr)
    gl.uniform1f(u.dpr, dpr)
    gl.uniform1f(u.time, t)
    gl.uniform1f(u.strength, dark ? 0.2 : 0.14)
    gl.uniform1f(u.laneFloor, 0.4)
    gl.uniform3fv(u.ground, norm(theme.ground))
    gl.uniform3fv(u.ink, norm(theme.ink))
    gl.uniform3fv(u.trail, trail)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let paused = false
  let hidden = document.hidden
  let raf = 0
  let prev = performance.now()
  let time = 30
  let last = 0

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    const dt = Math.min((now - prev) / 1000, 0.05)
    prev = now
    if (paused || hidden) return
    time += dt
    for (const p of pts) p.w *= Math.exp(-dt / 0.3)
    while (pts.length && pts[0].w < 0.02) pts.shift()
    // the drift is slow; 30 fps is plenty unless the cursor is moving
    if (!pts.length && now - last < 33) return
    last = now
    draw(time)
  }

  let rt = 0
  const onResize = () => {
    clearTimeout(rt)
    rt = window.setTimeout(() => {
      build()
      draw(time)
    }, 120)
  }
  const onVis = () => {
    hidden = document.hidden
    prev = performance.now()
  }

  build()
  draw(time)
  const offTheme = onThemeChange((th) => {
    theme = th
    draw(time)
  })
  if (!reduced) window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('resize', onResize)
  if (!reduced) raf = requestAnimationFrame(frame)

  return {
    destroy() {
      cancelAnimationFrame(raf)
      clearTimeout(rt)
      offTheme()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    },
    setPaused(p) {
      paused = p
      prev = performance.now()
      if (p) draw(time)
    },
    setLane(l) {
      lane = l
      draw(time)
    },
  }
}
