/**
 * Sunset — the sky from a plane window at dusk: deep navy overhead, a pale blue band, a thin
 * lavender-to-orange glow on a slightly curved horizon, and the dark ground below.
 *
 * Drawn at one canvas pixel per CSS pixel (crisp 2×2 dots on retina) and quantised to a small
 * number of levels with a blue-noise dither, so the gradient reads as a fine, even grain rather
 * than banding or a Bayer cross-hatch. The scene is static; it only redraws on scroll (the sun
 * sinks a little as you read down the page), resize and when the reading column moves.
 */
import type { ArtController, Lane } from './types'

const LEVELS = 11 // per channel; lower = more visible dither
const BN = 64 // blue-noise tile size

// sky stops: offset from the horizon in viewport heights (negative = above), sRGB hex
const STOPS: [number, string][] = [
  [-0.62, '#081226'],
  [-0.46, '#132d55'],
  [-0.31, '#2f5f9c'],
  [-0.19, '#5b8ed2'],
  [-0.115, '#8399d1'],
  [-0.07, '#ad95bd'],
  [-0.042, '#dc9a8b'],
  [-0.024, '#f6984d'],
  [-0.01, '#f2672a'],
  [0.0, '#c63c18'],
  [0.012, '#4d2018'],
  [0.05, '#241715'],
  [0.2, '#171211'],
  [0.5, '#100d0d'],
]
const N = STOPS.length

const VERT = `#version 300 es
in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uSize;     // canvas px (= CSS px)
uniform vec2 uLane;     // reading column, CSS px
uniform float uProg;    // 0 at the top of the page, 1 at the bottom
uniform float uStop[${N}];
uniform vec3 uCol[${N}]; // linear RGB
uniform highp sampler2D uNoise;
out vec4 o;

vec3 ramp(float d){
  if (d <= uStop[0]) return uCol[0];
  for (int i = 1; i < ${N}; i++) {
    if (d < uStop[i]) return mix(uCol[i - 1], uCol[i], (d - uStop[i - 1]) / (uStop[i] - uStop[i - 1]));
  }
  return uCol[${N - 1}];
}
// a few taps smooth out the kinks at each stop (no Mach bands)
vec3 sky(float d, float w){
  return (ramp(d - w) + 2.0 * ramp(d - 0.5 * w) + 2.0 * ramp(d) + 2.0 * ramp(d + 0.5 * w) + ramp(d + w)) / 8.0;
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
vec3 toSrgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(max(c, vec3(1e-6)), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }

void main(){
  vec2 px = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec2 uv = px / uSize;
  float aspect = uSize.x / uSize.y;

  // the horizon bows up in the middle, and sinks a little as the page is read
  float xc = (uv.x - 0.5) * min(aspect, 1.6);
  float yh = 0.585 + 0.035 * uProg + 0.07 * xc * xc;
  float d = uv.y - yh;

  // the glow band is thin; widen the smoothing away from it
  float w = mix(0.006, 0.05, smoothstep(0.02, 0.25, abs(d)));
  vec3 c = sky(d, w);

  // dusk deepens down the page: the sky dims, the glow keeps a little more of its warmth
  float dim = 1.0 - 0.32 * uProg * (1.0 - smoothstep(-0.3, 0.0, d));
  c *= dim;

  // a faint brightening of the glow toward the middle of the horizon, and darker edges
  float gd = d / 0.03, gx = xc / 0.9;
  float glow = exp(-gd * gd) * exp(-gx * gx);
  c += vec3(0.30, 0.10, 0.02) * glow * 0.35;
  float edge = abs(uv.x - 0.5) * 2.0;
  c *= 1.0 - 0.18 * edge * edge;

  // the ground: barely-there texture so it isn't a flat black
  float g = smoothstep(0.0, 0.03, d);
  c *= 1.0 + g * 0.25 * (noise(px * vec2(0.004, 0.012)) - 0.5);

  // keep the reading column quieter: darken bright sky behind the text, feathered wide
  float inLane = smoothstep(uLane.x - 220.0, uLane.x + 40.0, px.x) * (1.0 - smoothstep(uLane.y - 40.0, uLane.y + 220.0, px.x));
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c *= mix(1.0, 0.5, inLane * smoothstep(0.02, 0.25, lum));

  // blue-noise dither to a few levels per channel
  vec3 s = toSrgb(clamp(c, 0.0, 1.0));
  float t = texelFetch(uNoise, ivec2(mod(px, ${BN}.0)), 0).r;
  s = floor(s * ${LEVELS - 1}.0 + t) / ${LEVELS - 1}.0;
  o = vec4(s, 1.0);
}`

/** A tileable blue-noise threshold map (void-and-cluster style, built once, ~50 ms). */
function blueNoise(size: number): Uint8Array {
  const n = size * size
  const sigma = 1.6
  const R = 6
  const k: number[] = []
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) k.push(Math.exp(-(x * x + y * y) / (2 * sigma * sigma)))
  const energy = new Float32Array(n)
  for (let i = 0; i < n; i++) energy[i] = Math.random() * 1e-4
  const taken = new Uint8Array(n)
  const out = new Uint8Array(n)
  for (let r = 0; r < n; r++) {
    let best = -1
    let min = Infinity
    for (let i = 0; i < n; i++) if (!taken[i] && energy[i] < min) { min = energy[i]; best = i }
    taken[best] = 1
    out[best] = Math.floor(((r + 0.5) / n) * 256)
    const bx = best % size
    const by = (best / size) | 0
    let j = 0
    for (let y = -R; y <= R; y++) {
      const yy = ((by + y + size) % size) * size
      for (let x = -R; x <= R; x++) energy[yy + ((bx + x + size) % size)] += k[j++]
    }
  }
  return out
}

const lin = (hex: string) => {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
}

export const mount = (host: HTMLElement): ArtController => {
  const noop = { destroy() {}, setPaused() {}, setLane() {} }
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const gl = canvas.getContext('webgl2', { alpha: false, depth: false, stencil: false, antialias: false })
  if (!gl) {
    canvas.remove()
    host.style.background = 'linear-gradient(#081226, #2f5f9c 35%, #8399d1 50%, #f6984d 56%, #c63c18 58.5%, #241715 62%, #100d0d)'
    return noop
  }

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error('[sunset]', gl.getShaderInfoLog(sh))
    return sh
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.bindAttribLocation(prog, 0, 'aPos')
  gl.linkProgram(prog)
  gl.useProgram(prog)
  gl.bindVertexArray(gl.createVertexArray())
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const tex = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, BN, BN, 0, gl.RED, gl.UNSIGNED_BYTE, blueNoise(BN))
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  const U = (n: string) => gl.getUniformLocation(prog, n)
  const u = { size: U('uSize'), lane: U('uLane'), prog: U('uProg') }
  gl.uniform1i(U('uNoise'), 0)
  gl.uniform1fv(U('uStop'), STOPS.map((s) => s[0]))
  gl.uniform3fv(U('uCol'), STOPS.flatMap((s) => lin(s[1])))

  let lane: Lane = { left: 0, right: 0 }
  const build = () => {
    canvas.width = Math.ceil(host.clientWidth || window.innerWidth)
    canvas.height = Math.ceil(host.clientHeight || window.innerHeight)
    canvas.style.width = `${canvas.width}px`
    canvas.style.height = `${canvas.height}px`
  }
  const progress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  }
  const draw = () => {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u.size, canvas.width, canvas.height)
    gl.uniform2f(u.lane, lane.left, lane.right)
    gl.uniform1f(u.prog, progress())
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  let raf = 0
  const queue = () => {
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw() })
  }
  let rt = 0
  const ro = new ResizeObserver(() => {
    clearTimeout(rt)
    rt = window.setTimeout(() => { build(); draw() }, 120)
  })

  build()
  draw()
  window.addEventListener('scroll', queue, { passive: true })
  ro.observe(host)

  return {
    destroy() {
      cancelAnimationFrame(raf)
      clearTimeout(rt)
      window.removeEventListener('scroll', queue)
      ro.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    },
    setPaused() {},
    setLane(l) { lane = l; queue() },
  }
}
