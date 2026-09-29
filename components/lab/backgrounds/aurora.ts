/**
 * 03 · Aurora from Orbit — curtains of green (oxygen, 557.7 nm) fading to violet and red at
 * altitude, rising off the photo's limb the way the ISS sees an aurora. The curtain base
 * wanders, rays shimmer, and brightness moves in patches along the arc. Screen-blended over a
 * darkened copy of your horizon photo; outputs black where there is no light.
 */
import { createShaderSurface, GLSL_NOISE } from '../lib/gl'
import { runLoop } from '../lib/surface'
import { horizonMap } from '../lib/horizon'
import type { BgMount } from '../lib/types'

const FRAG = `
uniform vec2 u_res;
uniform float u_time;
uniform float u_scale;
uniform vec3 u_limb; // apexY, curvature, cx  (css px)
${GLSL_NOISE}

float limbY(float x){ float d = x - u_limb.z; return u_limb.x + u_limb.y * d * d; }

void main(){
  vec2 frag = gl_FragCoord.xy / u_scale;
  float H = u_res.y / u_scale;
  float x = frag.x;
  float y = H - frag.y;
  float hgt = limbY(x) - y;
  float t = u_time;
  vec3 col = vec3(0.0);

  for (int L = 0; L < 2; L++) {
    float fl = float(L);
    float xs = x * 0.0021 * (1.0 + fl * 0.7);
    float base = 8.0 + 30.0 * fbm4(vec2(xs * 1.2 + t * 0.028 + fl * 7.0, t * 0.018)) + fl * 22.0;
    float fold = fbm4(vec2(xs * 2.2 - t * 0.045, fl * 3.0 + t * 0.012));
    float rx = x * (0.05 + fl * 0.025) + fold * 7.0;
    float rays = vnoise(vec2(rx, t * 0.32 + fl * 10.0));
    rays = pow(rays, 2.0) * 1.7 + 0.12;
    float hh = hgt - base;
    float decay = mix(55.0, 150.0, fbm4(vec2(xs * 0.8 + 3.0, t * 0.01 + fl)));
    float lower = smoothstep(-5.0, 7.0, hh);
    float prof = lower * exp(-max(hh, 0.0) / decay);
    float patchy = smoothstep(0.38, 0.78, fbm4(vec2(xs * 0.85 - t * 0.022, 5.0 + fl * 2.0)));
    float I = prof * rays * patchy * mix(1.0, 0.55, fl);
    float up = clamp(hh / (decay * 1.7), 0.0, 1.0);
    vec3 c = mix(vec3(0.26, 1.0, 0.52), vec3(0.55, 0.3, 1.0), smoothstep(0.3, 0.95, up));
    c = mix(c, vec3(1.0, 0.28, 0.42), smoothstep(0.8, 1.0, up) * 0.5);
    col += c * I * 1.0;
  }

  // a faint green wash scattered onto the night side just under the limb
  float under = smoothstep(0.0, -60.0, hgt) * smoothstep(-160.0, -10.0, hgt);
  float wash = smoothstep(0.3, 0.8, fbm4(vec2(x * 0.0025 - t * 0.02, 9.0)));
  col += vec3(0.1, 0.35, 0.18) * under * wash * 0.35;
  col *= smoothstep(-6.0, 6.0, hgt) * 0.92 + 0.08;

  // stars in the dark upper sky (hash grid, twinkling)
  vec2 cell = floor(frag / 5.0);
  float h = hash12(cell);
  if (h > 0.9965 && hgt > 60.0) {
    vec2 o = hash22(cell) * 5.0;
    float d = length(frag - (cell * 5.0 + o));
    float tw = 0.6 + 0.4 * sin(t * (1.0 + h * 40.0) + h * 300.0);
    float fade = 1.0 - smoothstep(u_limb.x * 0.25, u_limb.x * 0.8, y);
    col += vec3(0.9, 0.93, 1.0) * exp(-d * d * 1.4) * tw * fade * (h - 0.9965) * 300.0;
  }

  gl_FragColor = vec4(col, 1.0);
}
`

export const mount: BgMount = (host, { thumb }) => {
  const surf = createShaderSurface(host, FRAG, { scale: thumb ? 0.5 : 0.55 })
  if (!surf) return { destroy() {}, setPaused() {} }
  host.style.mixBlendMode = 'screen'

  const loop = runLoop(
    (t) => {
      const hz = horizonMap(surf.w, surf.h)
      const scale = surf.canvas.width / surf.w
      surf.render({ u_time: t + 40, u_scale: scale, u_limb: [hz.apexY, hz.curv, hz.cx] })
    },
    { host, fps: thumb ? 30 : 60 },
  )
  return {
    destroy() {
      loop.stop()
      surf.destroy()
    },
    setPaused: (p) => loop.setPaused(p),
  }
}
