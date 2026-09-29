/**
 * 10 · Orion — a shader nebula tinted from your own Orion Nebula photo: hydrogen-alpha red and
 * pink, a blue reflection nebula to the side (the Running Man), a bright core and dark dust
 * lanes, built from domain-warped fBm. A separate full-resolution star layer (with diffraction
 * spikes on the bright blue ones, like your refractor's) parallaxes against it with the cursor
 * and scroll, so it reads as depth.
 */
import { createShaderSurface, GLSL_NOISE } from '../lib/gl'
import { createSurface, runLoop, trackPointer, clamp } from '../lib/surface'
import { mulberry32 } from '../lib/noise'
import { glowSprite, type BgMount } from '../lib/types'

const FRAG = `
uniform vec2 u_res;
uniform float u_time;
uniform float u_scale;
uniform vec2 u_off;
${GLSL_NOISE}
void main(){
  vec2 frag = gl_FragCoord.xy / u_scale + u_off;
  vec2 R = u_res / u_scale;
  float aspect = R.x / R.y;
  vec2 p = frag / R.y;
  float t = u_time * 0.01;

  vec2 q = vec2(fbm(p * 2.1 + vec2(0.0, t)), fbm(p * 2.1 + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(fbm(p * 2.1 + 3.4 * q + vec2(1.7, 9.2) + t * 0.6), fbm(p * 2.1 + 3.4 * q + vec2(8.3, 2.8)));
  float n = fbm(p * 1.9 + 3.0 * r);

  vec2 c1 = vec2(aspect * 0.7, 0.6);
  float d1 = length(p - c1 + 0.06 * (q - 0.5));
  float mass = exp(-d1 * d1 * 3.4);
  vec2 c2 = vec2(aspect * 0.93, 0.8);
  float d2 = length(p - c2 + 0.05 * (r - 0.5));
  float mass2 = exp(-d2 * d2 * 16.0) * 0.8;

  float dens = clamp(n * 1.75 - 0.42, 0.0, 1.2) * (mass + mass2);

  vec3 ha = vec3(0.74, 0.14, 0.24);
  vec3 pink = vec3(0.98, 0.52, 0.6);
  vec3 blue = vec3(0.32, 0.5, 0.98);
  vec3 core = vec3(1.0, 0.94, 0.93);
  float hue = fbm(p * 1.3 + r * 1.4 + 7.0);
  vec3 col = mix(ha, blue, clamp(smoothstep(0.42, 0.78, hue) * 0.7 + mass2 * 0.9, 0.0, 1.0));
  col = mix(col, pink, smoothstep(0.5, 0.95, dens) * mass);
  col = mix(col, core, smoothstep(0.85, 1.15, dens) * mass);

  float dust = smoothstep(0.5, 0.74, fbm(p * 3.3 + q * 2.2 + 13.0));
  dens *= 1.0 - dust * 0.8;

  vec3 ground = vec3(0.075, 0.067, 0.059);
  vec3 outc = ground + col * dens * 1.05;
  outc += vec3(0.05, 0.035, 0.09) * smoothstep(0.3, 0.8, fbm(p * 1.1 + 20.0)) * 0.7;
  gl_FragColor = vec4(outc, 1.0);
}
`

interface Star { x: number; y: number; z: number; b: number; c: [number, number, number]; ph: number; spike: boolean }

export const mount: BgMount = (host, { thumb }) => {
  const neb = createShaderSurface(host, FRAG, { scale: thumb ? 0.35 : 0.42 })
  const stars = createSurface(host)
  const pointer = trackPointer(host)
  const rand = mulberry32(42)
  const blueGlow = glowSprite([170, 200, 255], 64)
  const whiteGlow = glowSprite([255, 244, 236], 64)

  let list: Star[] = []
  const build = () => {
    const { w, h } = stars
    const n = thumb ? 160 : Math.round((w * h) / 2300)
    list = []
    for (let i = 0; i < n; i++) {
      const b = Math.pow(rand(), 3.2)
      const u = rand()
      const c: [number, number, number] = u < 0.35 ? [176, 204, 255] : u < 0.85 ? [255, 250, 244] : [255, 222, 190]
      list.push({ x: rand() * (w + 80) - 40, y: rand() * (h + 80) - 40, z: 0.2 + rand() * 0.8, b, c, ph: rand() * 6.28, spike: b > 0.9 && u < 0.5 })
    }
  }
  build()
  stars.onResize = build

  const cam = { x: 0, y: 0 }
  const loop = runLoop(
    (t, dt) => {
      const ps = pointer.state
      const sc = window.scrollY
      const tx = (ps.active ? ps.x / stars.w - 0.5 : 0) * 40
      const ty = (ps.active ? ps.y / stars.h - 0.5 : 0) * 30 + sc * 0.06
      cam.x += (tx - cam.x) * Math.min(1, dt * 2.5)
      cam.y += (ty - cam.y) * Math.min(1, dt * 2.5)

      if (neb) {
        const s = neb.canvas.width / neb.w
        neb.render({ u_time: t + 30, u_scale: s, u_off: [cam.x * 0.35, -cam.y * 0.35] })
      }
      const { ctx, w, h } = stars
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (const st of list) {
        const x = (((st.x - cam.x * st.z) % (w + 80)) + w + 80) % (w + 80) - 40
        const y = (((st.y - cam.y * st.z) % (h + 80)) + h + 80) % (h + 80) - 40
        const tw = 0.7 + 0.3 * Math.sin(t * (0.6 + st.z * 2) + st.ph)
        const a = clamp((0.25 + 0.75 * st.b) * tw)
        const s = 0.5 + st.b * 1.6
        ctx.fillStyle = `rgba(${st.c[0]},${st.c[1]},${st.c[2]},${a})`
        ctx.fillRect(x - s / 2, y - s / 2, s, s)
        if (st.b > 0.45) {
          const r = 8 + st.b * 22
          ctx.globalAlpha = a * 0.6
          ctx.drawImage(st.c[2] > 250 && st.c[0] < 200 ? blueGlow : whiteGlow, x - r / 2, y - r / 2, r, r)
          ctx.globalAlpha = 1
        }
        if (st.spike && !thumb) {
          const L = 6 + st.b * 16
          ctx.strokeStyle = `rgba(${st.c[0]},${st.c[1]},${st.c[2]},${a * 0.32})`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(x - L, y)
          ctx.lineTo(x + L, y)
          ctx.moveTo(x, y - L)
          ctx.lineTo(x, y + L)
          ctx.stroke()
        }
      }
      ctx.globalCompositeOperation = 'source-over'
    },
    { host, fps: 30 },
  )
  return {
    destroy() {
      loop.stop()
      neb?.destroy()
      stars.destroy()
      pointer.destroy()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
