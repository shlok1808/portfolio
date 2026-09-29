/**
 * Minimal full-screen fragment-shader runner (WebGL1, no dependencies).
 * Renders at a fraction of CSS resolution (soft effects don't need full res) and upsamples.
 */

export interface ShaderSurface {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  w: number
  h: number
  render(uniforms: Record<string, number | number[]>): void
  texture(name: string, src: string): Promise<{ w: number; h: number }>
  destroy(): void
}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

export function createShaderSurface(
  host: HTMLElement,
  frag: string,
  opts: { scale?: number; className?: string; premultiplied?: boolean; pixelSize?: number } = {},
): ShaderSurface | null {
  const canvas = document.createElement('canvas')
  canvas.className = opts.className ?? 'lab-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: opts.premultiplied ?? true,
    antialias: false,
    preserveDrawingBuffer: false,
  }) as WebGLRenderingContext | null
  if (!gl) {
    canvas.remove()
    return null
  }

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('[lab shader]', gl.getShaderInfoLog(sh))
    }
    return sh
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `precision highp float;\n${frag}`))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.error('[lab shader]', gl.getProgramInfoLog(prog))
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const uniformCache = new Map<string, WebGLUniformLocation | null>()
  const u = (name: string) => {
    if (!uniformCache.has(name)) uniformCache.set(name, gl.getUniformLocation(prog, name))
    return uniformCache.get(name)!
  }

  const textures: { unit: number; tex: WebGLTexture; name: string }[] = []
  const scale = opts.scale ?? 0.6

  const surf: ShaderSurface = {
    canvas,
    gl,
    w: 1,
    h: 1,
    render(uniforms) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      const res = u('u_res')
      if (res) gl.uniform2f(res, canvas.width, canvas.height)
      for (const t of textures) {
        gl.activeTexture(gl.TEXTURE0 + t.unit)
        gl.bindTexture(gl.TEXTURE_2D, t.tex)
        const l = u(t.name)
        if (l) gl.uniform1i(l, t.unit)
      }
      for (const [name, val] of Object.entries(uniforms)) {
        const l = u(name)
        if (!l) continue
        if (typeof val === 'number') gl.uniform1f(l, val)
        else if (val.length === 2) gl.uniform2f(l, val[0], val[1])
        else if (val.length === 3) gl.uniform3f(l, val[0], val[1], val[2])
        else if (val.length === 4) gl.uniform4f(l, val[0], val[1], val[2], val[3])
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    texture(name, src) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => {
          const tex = gl.createTexture()!
          const unit = textures.length
          gl.activeTexture(gl.TEXTURE0 + unit)
          gl.bindTexture(gl.TEXTURE_2D, tex)
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
          textures.push({ unit, tex, name })
          resolve({ w: img.naturalWidth, h: img.naturalHeight })
        }
        img.onerror = reject
        img.src = src
      })
    },
    destroy() {
      ro.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
      canvas.remove()
    },
  }

  const resize = () => {
    const r = host.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    surf.w = Math.max(1, r.width)
    surf.h = Math.max(1, r.height)
    if (opts.pixelSize) {
      // one canvas pixel per "art pixel", upscaled crisply by CSS (image-rendering: pixelated)
      canvas.width = Math.max(1, Math.ceil(surf.w / opts.pixelSize))
      canvas.height = Math.max(1, Math.ceil(surf.h / opts.pixelSize))
      canvas.style.imageRendering = 'pixelated'
    } else {
      canvas.width = Math.max(1, Math.round(surf.w * dpr * scale))
      canvas.height = Math.max(1, Math.round(surf.h * dpr * scale))
    }
    canvas.style.width = `${surf.w}px`
    canvas.style.height = `${surf.h}px`
  }
  const ro = new ResizeObserver(resize)
  ro.observe(host)
  resize()
  return surf
}

/** GLSL snippets shared by the shader backgrounds. */
export const GLSL_NOISE = `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1.0,0.0)), u.x), mix(hash12(i+vec2(0.0,1.0)), hash12(i+vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float s = 0.0; float a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 6; i++){ s += a * vnoise(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
  return s;
}
float fbm4(vec2 p){
  float s = 0.0; float a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
  return s;
}
`
