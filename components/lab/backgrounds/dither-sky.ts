/**
 * 08 · Dither Horizon — your horizon photo pushed through a live 8×8 Bayer (ordered) dither at a
 * native 3 px art-pixel, with a five-tone gradient map built from the active palette (so the
 * palette switcher recolours it). Cloud drifts across the night side, the limb glow breathes,
 * stars blink in the upper sky, and the cursor lights up the pattern around it.
 */
import { createShaderSurface, GLSL_NOISE } from '../lib/gl'
import { runLoop, trackPointer } from '../lib/surface'
import { readTheme, onThemeChange, mix, type RGB, type Theme } from '../lib/theme'
import type { BgMount } from '../lib/types'

const PX = 3

const FRAG = `
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_img;
uniform vec2 u_box;
uniform float u_posY;
uniform vec2 u_mouse;
uniform vec3 u_t0; uniform vec3 u_t1; uniform vec3 u_t2; uniform vec3 u_t3; uniform vec3 u_t4;
uniform sampler2D u_tex;
${GLSL_NOISE}

float bayer2(vec2 a){ a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a){ return bayer4(0.5 * a) * 0.25 + bayer2(a); }

vec3 tone(float i){
  if (i < 0.5) return u_t0;
  if (i < 1.5) return u_t1;
  if (i < 2.5) return u_t2;
  if (i < 3.5) return u_t3;
  return u_t4;
}

void main(){
  vec2 cell = floor(gl_FragCoord.xy);
  float px = u_box.x / u_res.x;
  vec2 css = (cell + 0.5) * px;
  css.y = u_box.y - css.y;

  float s = max(u_box.x / u_img.x, u_box.y / u_img.y);
  vec2 dim = u_img * s;
  vec2 off = vec2((u_box.x - dim.x) * 0.5, (u_box.y - dim.y) * u_posY);
  vec2 uv = (css - off) / dim;
  vec3 c = texture2D(u_tex, clamp(uv, 0.001, 0.999)).rgb;

  float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float warm = clamp(c.r - c.b, 0.0, 1.0);
  float t = u_time;

  // drifting cloud over the dark planet, a breathing limb glow
  float ground = smoothstep(0.1, 0.03, L);
  float cloud = fbm4(vec2(css.x * 0.004 - t * 0.02, css.y * 0.012 + t * 0.004));
  L += ground * (cloud - 0.45) * 0.09;
  L += warm * (0.05 + 0.03 * sin(t * 0.6));

  // light from the cursor
  float md = length(css - u_mouse);
  L += 0.28 * exp(-md * md / 16000.0);

  float p = clamp(pow(L, 0.8) * 3.6 - 0.38 + warm * 1.8, 0.0, 4.0);

  // stars in the upper sky
  float h = hash12(cell);
  if (h > 0.9955 && uv.y < 0.3) {
    float tw = step(0.35, fract(h * 97.0 + t * (0.2 + h * 0.6)));
    p = max(p, 3.0 * tw);
  }

  float i = floor(p);
  float f = p - i;
  float thr = bayer8(cell);
  float idx = f > thr ? i + 1.0 : i;
  gl_FragColor = vec4(tone(idx), 1.0);
}
`

function tones(th: Theme): RGB[] {
  const warm: RGB = [244, 199, 154]
  if (th.mode === 'dark') {
    const g: RGB = [19, 17, 15]
    return [g, mix(g, th.accent, 0.3), mix(g, th.accent, 0.68), mix(th.accent, [255, 255, 255], 0.38), mix(th.accent, [255, 250, 240], 0.78)]
  }
  const paper = th.ground
  const deep = mix(th.accentStrong, [0, 0, 0], 0.35)
  return [deep, th.accentStrong, th.accent, mix(th.accent, paper, 0.6), mix(warm, [200, 110, 60], 0.35)]
}

export const mount: BgMount = (host, { thumb }) => {
  const surf = createShaderSurface(host, FRAG, { pixelSize: thumb ? 2 : PX })
  if (!surf) return { destroy() {}, setPaused() {} }
  const pointer = trackPointer(host)
  let th = readTheme()
  let pal = tones(th)
  const unsub = onThemeChange((t) => {
    th = t
    pal = tones(t)
  })
  const landscape = surf.w / surf.h >= 1
  const img = landscape ? [1920, 1241] : [880, 1912]
  let ready = false
  const mx = { x: -1e4, y: -1e4 }
  const draw = (t: number, dt: number) => {
      if (!ready) return
      const ps = pointer.state
      const tx = ps.active ? ps.x : -1e4
      const ty = ps.active ? ps.y : -1e4
      if (mx.x < -1e3 && tx > -1e3) {
        mx.x = tx
        mx.y = ty
      }
      mx.x += (tx - mx.x) * Math.min(1, dt * 10)
      mx.y += (ty - mx.y) * Math.min(1, dt * 10)
      const u = (c: RGB) => [c[0] / 255, c[1] / 255, c[2] / 255]
      surf.render({
        u_time: t,
        u_img: img,
        u_box: [surf.w, surf.h],
        u_posY: landscape ? 0.53 : 0.63,
        u_mouse: [mx.x, mx.y],
        u_t0: u(pal[0]),
        u_t1: u(pal[1]),
        u_t2: u(pal[2]),
        u_t3: u(pal[3]),
        u_t4: u(pal[4]),
      })
  }
  const loop = runLoop(draw, { host, fps: 30 })
  surf.texture('u_tex', landscape ? '/horizon/landscape.webp' : '/horizon/portrait.webp').then(() => {
    ready = true
    draw(loop.time, 0) // first frame even if the loop is paused off-screen
  })
  return {
    destroy() {
      loop.stop()
      surf.destroy()
      pointer.destroy()
      unsub()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
