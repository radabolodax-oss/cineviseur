import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Icon from "./Icon";
import { play, vibrate } from "../lib/feedback";

// Shaders GLSL WebGL2 (GPGPU Liquid Particles Engine)
const Hf = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }
`;

const bm = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform vec2 uSize;
uniform float uRadius;
uniform float uPresence;
uniform float uDecay;

vec2 decV(vec4 c){ return (c.rg*255.0-128.0)/127.0; }
void main(){
  vec2 v0 = decV(texture(uPrev, vUv));
  vec2 uv = vUv - v0*uTexel*2.5;
  vec4 c = texture(uPrev, uv)*0.52
    + 0.12*(texture(uPrev, uv+vec2(uTexel.x,0.0)) + texture(uPrev, uv-vec2(uTexel.x,0.0))
          + texture(uPrev, uv+vec2(0.0,uTexel.y)) + texture(uPrev, uv-vec2(0.0,uTexel.y)));
  vec2 v = decV(c);
  float p = c.b;
  vec2 d = (vUv-uMouse)*uSize;
  float f = exp(-dot(d,d)/(uRadius*uRadius))*uPresence;
  float sp = clamp(length(uVel)*2.5, 0.0, 1.0);
  v += uVel*f*0.22;
  p = max(p, f*sp);
  v *= uDecay;
  p *= uDecay;
  v = sign(v)*max(abs(v)-1.2/127.0, 0.0);
  p = max(p-1.2/255.0, 0.0);
  v = clamp(v, -1.0, 1.0);
  o = vec4((v*127.0+128.0)/255.0, p, 1.0);
}
`;

const NOISE_GLSL = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y);
}
vec2 ambientField(vec2 uv, float t){
  vec2 q = uv*vec2(3.2,1.7);
  vec2 a = vec2(vnoise(q+vec2(t*0.11,0.0))-0.5, vnoise(q+vec2(5.2,t*0.08)+3.1)-0.5);
  vec2 q2 = uv*vec2(7.5,4.0) + vec2(-t*0.19, t*0.13);
  vec2 b = vec2(vnoise(q2+1.7)-0.5, vnoise(q2+9.3)-0.5);
  return a + b*0.45;
}
vec2 curl(vec2 p){
  const float e = 0.35;
  float a = vnoise(p+vec2(0.0,e)) - vnoise(p-vec2(0.0,e));
  float b = vnoise(p+vec2(e,0.0)) - vnoise(p-vec2(e,0.0));
  return vec2(a, -b)/(2.0*e);
}
float energyAt(vec2 rectPx, vec2 mouse, float radius, float presence, float wakeEnergy){
  vec2 d = rectPx - mouse;
  float f = exp(-dot(d,d)/(radius*radius))*presence;
  return smoothstep(0.06, 0.5, f*1.15 + wakeEnergy*1.7);
}
`;

const pm = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uFlow;
uniform vec2 uSize;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uStrength;
uniform float uSpread;
uniform float uTurb;
uniform float uReturn;
uniform float uTime;
uniform float uDt;
uniform float uIntro;
uniform float uExplode;
${NOISE_GLSL}
void main(){
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 hm = texelFetch(uHome, ij, 0);
  if(hm.w <= 0.0){ o = vec4(0.0); return; }
  vec4 st = texelFetch(uState, ij, 0);
  vec2 off = st.xy;
  vec2 vel = st.zw;
  float sd = hm.z;
  float light = 0.45 + sd*1.1;

  vec2 p = hm.xy*uSize + off;
  vec4 fl = texture(uFlow, clamp(p/uSize, 0.0, 1.0));
  vec2 wake = (fl.rg*255.0-128.0)/127.0;
  float pr = fl.b;

  vec2 toM = p - uMouse;
  float r2 = dot(toM,toM);
  float f = exp(-r2/(uRadius*uRadius))*uPresence;
  vec2 n = toM*inversesqrt(r2+1.0);
  float e = clamp(pr*2.0 + f, 0.0, 1.0);

  vec2 acc = vec2(0.0);
  acc += n*f*1.25*uStrength*uSpread*light;
  acc += vec2(-n.y, n.x)*f*1.45*uStrength*uSpread*(0.4+sd);
  acc += (wake*42.0*uSpread*light - vel)*e*0.08;

  vec2 q = p*0.0095 + vec2(uTime*0.35, -uTime*0.2);
  vec2 c = curl(q) + 0.5*curl(q*2.3 + 7.1);
  acc += c*(e*1.2*uSpread + uIntro*1.5 + uExplode*3.8)*uTurb*light;

  // Souffle de l'explosion particulaire (force radiale vers l'extérieur)
  vec2 centerVec = (hm.xy - vec2(0.5))*uSize + off;
  float centerDist = length(centerVec) + 1.0;
  vec2 centerDir = centerVec / centerDist;
  acc += centerDir * uExplode * (75.0 + sd * 55.0);

  // Rappel élastique vers la forme de l'Oracle (atténué lors de l'explosion)
  float k = (0.006 + 0.02*uReturn)*(0.65+sd*0.7)*(1.0 - uIntro*0.75) * max(0.0, 1.0 - uExplode*1.2);
  acc -= off*k;

  vel += acc*uDt;
  vel *= pow(mix(0.93, 0.955, e), uDt);
  off += vel*uDt;
  if(dot(off,off) < 0.0004 && dot(vel,vel) < 0.0004 && uExplode <= 0.001){
    off = vec2(0.0); vel = vec2(0.0);
  }
  o = vec4(off, vel);
}
`;

const Sm = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uCol;
uniform sampler2D uFlow;
uniform int uTexW;
uniform vec4 uRect;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uDot;
uniform float uTime;
uniform float uAmbient;
uniform float uStreak;
uniform float uIntroVis;
uniform float uRest;
uniform vec3 uTint;

out vec2 vLocal;
out float vHalfLen;
out float vR;
out vec3 vCol;
out float vA;

${NOISE_GLSL}

void main(){
  int id = gl_InstanceID;
  ivec2 ij = ivec2(id % uTexW, id / uTexW);
  vec4 hm = texelFetch(uHome, ij, 0);
  vec4 st = texelFetch(uState, ij, 0);
  vec4 cl = texelFetch(uCol, ij, 0);

  float wakeE = texture(uFlow, hm.xy).b;
  float E = energyAt(hm.xy*uRect.zw, uMouse, uRadius, uPresence, wakeE);
  float lift = smoothstep(0.35, 2.5, length(st.xy));
  float a = max(max(E, lift), max(uRest, 1.0-uIntroVis));
  if(a < 0.01 || hm.w <= 0.0){ gl_Position = vec4(2.0,2.0,2.0,1.0); return; }

  vec2 base = uRect.xy + hm.xy*uRect.zw + st.xy;
  base -= ambientField(hm.xy, uTime)*10.0*uAmbient;

  vec2 v = st.zw;
  float sp = length(v);
  vec2 dir = sp > 0.001 ? v/sp : vec2(1.0,0.0);
  float r = uDot*hm.w*0.5;
  float len = min(sp*1.25, 22.0)*uStreak;
  vec2 lc = aCorner*vec2(r + len*0.5 + 1.0, r + 1.0);
  vec2 center = base - dir*len*0.5;
  vec2 world = center + dir*lc.x + vec2(-dir.y, dir.x)*lc.y;

  vec2 clip = world/uRes*2.0-1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLocal = lc;
  vHalfLen = len*0.5;
  vR = r;
  vec3 col = cl.rgb*uTint;
  float glint = smoothstep(2.0, 16.0, sp);
  col = mix(col, min(col*1.25 + vec3(0.12, 0.1, 0.2), vec3(1.0)), glint*0.8);
  vCol = col;
  vA = a;
}
`;

const Tm = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vHalfLen;
in float vR;
in vec3 vCol;
in float vA;
uniform float uDpr;
out vec4 o;

void main(){
  vec2 q = vec2(max(abs(vLocal.x)-vHalfLen, 0.0), vLocal.y);
  float d = length(q) - vR;
  float a = clamp(0.5 - d*uDpr, 0.0, 1.0);
  float tail = vHalfLen > 0.0 ? clamp(0.5 - vLocal.x/(2.0*(vHalfLen+vR)), 0.0, 1.0) : 0.0;
  a *= 1.0 - tail*0.55;
  a *= vA;
  if(a < 0.004) discard;
  o = vec4(vCol*a, a);
}
`;

const Em = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uImg;
uniform sampler2D uFlow;
uniform vec2 uRes;
uniform float uDpr;
uniform vec4 uRect;
uniform vec3 uBg;
uniform vec2 uMouse;
uniform float uPresence;
uniform float uRadius;
uniform float uStrength;
uniform float uTime;
uniform float uAmbient;
uniform float uIntroVis;
uniform float uRest;

${NOISE_GLSL}

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y)/uDpr;
  vec2 size = uRect.zw;
  vec2 uv = (px-uRect.xy)/size;
  if(uv.x < -0.05 || uv.x > 1.05 || uv.y < -0.12 || uv.y > 1.12){ o = vec4(0.0); return; }
  vec4 fl = texture(uFlow, clamp(uv,0.0,1.0));
  vec2 vel = (fl.rg*255.0-128.0)/127.0;
  vec2 rp = uv*size;
  vec2 toM = rp - uMouse;
  float fall = exp(-dot(toM,toM)/(uRadius*uRadius))*uPresence;
  vec2 disp = -toM*0.22*uStrength*fall - vel*10.0*uStrength;
  disp += ambientField(uv, uTime)*10.0*uAmbient;
  vec2 suv = uv + disp/size;
  vec4 tx = texture(uImg, suv);
  vec3 col = tx.rgb;
  vec2 e = smoothstep(vec2(0.0), vec2(0.004,0.01), suv) * smoothstep(vec2(1.0), vec2(0.996,0.99), suv);
  float k = tx.a*e.x*e.y;
  float E = energyAt(rp, uMouse, uRadius, uPresence, fl.b);
  float show = (1.0 - max(E, uRest))*uIntroVis;
  float A = k*show;
  o = vec4(col*A, A);
}
`;

function compileShader(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(err);
  }
  return s;
}

function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p));
  }
  const uniforms = {};
  const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const u = gl.getActiveUniform(p, i);
    if (u) uniforms[u.name] = gl.getUniformLocation(p, u.name);
  }
  return { p, u: uniforms };
}

/**
 * Génère une texture procédurale d'Oracle Cinématographique
 * (Iris anamorphique, anneaux de lentille 35mm, étoiles et lueur violette/émeraude/ambre)
 */
function generateOracleCanvas(size = 700) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  ctx.clearRect(0, 0, size, size);

  // Halo externe diffus
  const radial = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.15);
  radial.addColorStop(0, "rgba(16, 185, 129, 0.95)"); // Émeraude CineViseur
  radial.addColorStop(0.35, "rgba(124, 92, 255, 0.85)"); // Violet signature
  radial.addColorStop(0.7, "rgba(251, 191, 36, 0.75)"); // Ambre chaud
  radial.addColorStop(1, "rgba(124, 92, 255, 0)");

  // 1. Anneau extérieur d'argentique
  ctx.save();
  ctx.lineWidth = 14;
  ctx.strokeStyle = radial;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Anneaux optiques concentriques
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Lamelles du diaphragme cinématique (12 lamelles)
  const blades = 12;
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(171, 152, 242, 0.85)";
  for (let i = 0; i < blades; i++) {
    const angle = (i * 2 * Math.PI) / blades;
    const x1 = cx + Math.cos(angle) * (r * 0.75);
    const y1 = cy + Math.sin(angle) * (r * 0.75);
    const x2 = cx + Math.cos(angle + 0.9) * (r * 0.32);
    const y2 = cy + Math.sin(angle + 0.9) * (r * 0.32);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 4. Cœur lumineux / Viseur d'or
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.32);
  coreGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
  coreGrad.addColorStop(0.4, "rgba(251, 191, 36, 0.9)");
  coreGrad.addColorStop(0.85, "rgba(124, 92, 255, 0.7)");
  coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // 5. Étoile centrale d'anamorphose (4 branches cinématiques)
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, cy);
  ctx.lineTo(cx + r * 0.5, cy);
  ctx.moveTo(cx, cy - r * 0.5);
  ctx.lineTo(cx, cy + r * 0.5);
  ctx.stroke();

  ctx.restore();
  return c;
}

export default function CinemaOracle({ onSpin, spinning, winner, onReset, onAddWinner, added }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const simRef = useRef(null);
  const [glReady, setGlReady] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl;
    try {
      gl = canvas.getContext("webgl2", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      // WebGL2 non disponible
      return;
    }

    if (!gl) return;

    const extFloat = gl.getExtension("EXT_color_buffer_float");
    const extHalf = extFloat ? null : gl.getExtension("EXT_color_buffer_half_float");
    if (!extFloat && !extHalf) return;

    const isMobile = window.innerWidth < 768;
    const targetParticles = isMobile ? 32000 : 110000;

    let destroyed = false;
    let animId = 0;

    const TEX_W = 1024;
    const FLOW_W = 256;
    const FLOW_H = 128;

    // Programmes
    const pFlow = createProgram(gl, Hf, bm);
    const pSim = createProgram(gl, Hf, pm);
    const pPart = createProgram(gl, Sm, Tm);
    const pImg = createProgram(gl, Hf, Em);

    // Quad plein écran
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Textures utilitaires
    function makeTex(internal, w, h, format, type, data, filter) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    }

    // Ping-pong Flow
    const flowTex = [];
    const flowFb = [];
    let flowIdx = 0;
    for (let i = 0; i < 2; i++) {
      const tex = makeTex(gl.RGBA8, FLOW_W, FLOW_H, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.LINEAR);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      flowTex.push(tex);
      flowFb.push(fb);
    }

    // Générer l'Oracle
    const oracleImg = generateOracleCanvas(640);
    const imgTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, imgTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, oracleImg);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Extraire les particules depuis le canvas Oracle
    const ctx2 = oracleImg.getContext("2d");
    const imgData = ctx2.getImageData(0, 0, oracleImg.width, oracleImg.height).data;
    const W = oracleImg.width;
    const H = oracleImg.height;

    const sampleStep = Math.max(1, Math.round(Math.sqrt((W * H) / targetParticles)));
    const pts = [];
    const cols = [];

    for (let y = 0; y < H; y += sampleStep) {
      for (let x = 0; x < W; x += sampleStep) {
        const idx = (y * W + x) * 4;
        const a = imgData[idx + 3];
        if (a < 35) continue;
        const r = imgData[idx] / 255;
        const g = imgData[idx + 1] / 255;
        const b = imgData[idx + 2] / 255;
        pts.push((x + 0.5) / W, (y + 0.5) / H, Math.random(), a / 255);
        cols.push(imgData[idx], imgData[idx + 1], imgData[idx + 2], 255);
      }
    }

    const n = pts.length / 4;
    const texH = Math.max(1, Math.ceil(n / TEX_W));
    const totalTexel = TEX_W * texH;

    const homeData = new Float32Array(totalTexel * 4);
    homeData.set(pts);
    const colData = new Uint8Array(totalTexel * 4);
    colData.set(cols);

    const homeTex = makeTex(gl.RGBA32F, TEX_W, texH, gl.RGBA, gl.FLOAT, homeData, gl.NEAREST);
    const colTex = makeTex(gl.RGBA8, TEX_W, texH, gl.RGBA, gl.UNSIGNED_BYTE, colData, gl.NEAREST);

    // Ping-pong State
    const stateTex = [];
    const stateFb = [];
    let stateIdx = 0;
    const formatType = extFloat ? gl.FLOAT : gl.HALF_FLOAT;
    const formatInternal = extFloat ? gl.RGBA32F : gl.RGBA16F;

    for (let i = 0; i < 2; i++) {
      const tex = makeTex(formatInternal, TEX_W, texH, gl.RGBA, formatType, null, gl.NEAREST);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      stateTex.push(tex);
      stateFb.push(fb);
    }

    // Initialiser les FBOs à zéro
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Variables de simulation
    let mouse = { x: -9999, y: -9999 };
    let prevMouse = { x: -9999, y: -9999 };
    let mvel = { x: 0, y: 0 };
    let presence = 0;
    let presenceTarget = 0;
    let burst = 0;
    let explodeProgress = 0;
    let explodeTarget = 0;
    let lastTime = performance.now();
    let simTime = 0;

    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Boucle d'animation WebGL2
    const loop = (now) => {
      if (destroyed) return;
      const dtMs = now - lastTime;
      lastTime = now;
      const dt = Math.min(Math.max(dtMs / 16.6667, 0.2), 3);

      simTime += dt * 0.015;

      // Inertie souris
      const dX = mouse.x - prevMouse.x;
      const dY = mouse.y - prevMouse.y;
      prevMouse.x = mouse.x;
      prevMouse.y = mouse.y;
      mvel.x += (Math.max(-60, Math.min(60, dX)) - mvel.x) * 0.4;
      mvel.y += (Math.max(-60, Math.min(60, dY)) - mvel.y) * 0.4;

      presence += (presenceTarget - presence) * 0.08;
      burst = Math.max(0, burst - 0.05 * dt);
      explodeProgress += (explodeTarget - explodeProgress) * 0.06;

      const rect = containerRef.current?.getBoundingClientRect();
      const cssW = rect?.width || 600;
      const cssH = rect?.height || 500;
      const dpr = canvas.width / cssW;

      // Position centrée de l'Oracle dans le conteneur
      const oracleSize = Math.min(cssW * 0.85, cssH * 0.85, 420);
      const orX = (cssW - oracleSize) / 2;
      const orY = (cssH - oracleSize) / 2;

      // 1. Flow Step
      const nextFlow = 1 - flowIdx;
      gl.bindFramebuffer(gl.FRAMEBUFFER, flowFb[nextFlow]);
      gl.viewport(0, 0, FLOW_W, FLOW_H);
      gl.disable(gl.BLEND);
      gl.useProgram(pFlow.p);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, flowTex[flowIdx]);
      gl.uniform1i(pFlow.u.uPrev, 0);
      gl.uniform2f(pFlow.u.uTexel, 1 / FLOW_W, 1 / FLOW_H);
      gl.uniform2f(pFlow.u.uMouse, (mouse.x - orX) / oracleSize, (mouse.y - orY) / oracleSize);
      gl.uniform2f(pFlow.u.uVel, Math.max(-1, Math.min(1, mvel.x / 35)), Math.max(-1, Math.min(1, mvel.y / 35)));
      gl.uniform2f(pFlow.u.uSize, oracleSize, oracleSize);
      gl.uniform1f(pFlow.u.uRadius, 85);
      gl.uniform1f(pFlow.u.uPresence, Math.max(presence, burst));
      gl.uniform1f(pFlow.u.uDecay, Math.pow(0.965, dt));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      flowIdx = nextFlow;

      // 2. State Step (Simulation particules)
      const nextState = 1 - stateIdx;
      gl.bindFramebuffer(gl.FRAMEBUFFER, stateFb[nextState]);
      gl.viewport(0, 0, TEX_W, texH);
      gl.disable(gl.BLEND);
      gl.useProgram(pSim.p);
      gl.bindVertexArray(vao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, stateTex[stateIdx]);
      gl.uniform1i(pSim.u.uState, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, homeTex);
      gl.uniform1i(pSim.u.uHome, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, flowTex[flowIdx]);
      gl.uniform1i(pSim.u.uFlow, 2);
      gl.uniform2f(pSim.u.uSize, oracleSize, oracleSize);
      gl.uniform2f(pSim.u.uMouse, mouse.x - orX, mouse.y - orY);
      gl.uniform1f(pSim.u.uRadius, 85);
      gl.uniform1f(pSim.u.uPresence, Math.max(presence, burst));
      gl.uniform1f(pSim.u.uStrength, 1.4 + burst * 2.5);
      gl.uniform1f(pSim.u.uSpread, 1.1);
      gl.uniform1f(pSim.u.uTurb, 0.95);
      gl.uniform1f(pSim.u.uReturn, 1.0);
      gl.uniform1f(pSim.u.uTime, simTime);
      gl.uniform1f(pSim.u.uDt, dt);
      gl.uniform1f(pSim.u.uIntro, 0.0);
      gl.uniform1f(pSim.u.uExplode, explodeProgress);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      stateIdx = nextState;

      // 3. Render Pass (Canvas écran)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Particules instanciées
      gl.useProgram(pPart.p);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, stateTex[stateIdx]);
      gl.uniform1i(pPart.u.uState, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, homeTex);
      gl.uniform1i(pPart.u.uHome, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, colTex);
      gl.uniform1i(pPart.u.uCol, 2);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, flowTex[flowIdx]);
      gl.uniform1i(pPart.u.uFlow, 3);
      gl.uniform1i(pPart.u.uTexW, TEX_W);
      gl.uniform4f(pPart.u.uRect, orX, orY, oracleSize, oracleSize);
      gl.uniform2f(pPart.u.uRes, cssW, cssH);
      gl.uniform2f(pPart.u.uMouse, mouse.x - orX, mouse.y - orY);
      gl.uniform1f(pPart.u.uRadius, 85);
      gl.uniform1f(pPart.u.uPresence, Math.max(presence, burst));
      gl.uniform1f(pPart.u.uDot, (oracleSize / W) * 2.2);
      gl.uniform1f(pPart.u.uTime, simTime);
      gl.uniform1f(pPart.u.uAmbient, 0.35 + presence * 0.4);
      gl.uniform1f(pPart.u.uStreak, 1.0);
      gl.uniform1f(pPart.u.uIntroVis, 1.0);
      gl.uniform1f(pPart.u.uRest, 1.0);
      gl.uniform1f(pPart.u.uDpr, dpr);
      gl.uniform3f(pPart.u.uTint, 1.0, 1.0, 1.0);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    setGlReady(true);

    // Interface d'interaction exposée
    simRef.current = {
      explode: () => {
        burst = 3.5;
        explodeTarget = 1.0;
        setIsExploding(true);
      },
      assemble: () => {
        explodeTarget = 0.0;
        burst = 0.5;
        setIsExploding(false);
      },
      setPointer: (x, y, active) => {
        mouse.x = x;
        mouse.y = y;
        presenceTarget = active ? 1 : 0;
      },
    };

    return () => {
      destroyed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Déclenchement de l'explosion particulaire lors du spin
  useEffect(() => {
    if (spinning && simRef.current) {
      simRef.current.explode();
    }
  }, [spinning]);

  const handlePointerMove = (e) => {
    if (!simRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    simRef.current.setPointer(e.clientX - rect.left, e.clientY - rect.top, true);
  };

  const handlePointerLeave = () => {
    if (simRef.current) simRef.current.setPointer(-9999, -9999, false);
  };

  const handleTouchMove = (e) => {
    if (!simRef.current || !containerRef.current || !e.touches[0]) return;
    const rect = containerRef.current.getBoundingClientRect();
    const t = e.touches[0];
    simRef.current.setPointer(t.clientX - rect.left, t.clientY - rect.top, true);
  };

  const triggerOracle = () => {
    if (spinning) return;
    play("sparkle");
    vibrate(25);
    if (simRef.current) {
      simRef.current.explode();
    }
    onSpin();
  };

  const resetOracle = () => {
    play("tick");
    if (simRef.current) {
      simRef.current.assemble();
    }
    onReset();
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlePointerLeave}
      className="relative w-full min-h-[500px] flex flex-col items-center justify-center overflow-hidden select-none py-6"
    >
      {/* Canevas WebGL2 fluide d'arrière-plan */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Lueur cosmique et aura d'ambiance */}
      <div
        className="pointer-events-none absolute w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-cine-violet/25 via-emerald-500/15 to-transparent blur-3xl opacity-60"
        aria-hidden="true"
      />

      {/* Révélation du film au centre quand il est trouvé */}
      <AnimatePresence mode="wait">
        {winner && !spinning ? (
          <motion.div
            key="winner-card"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 max-w-lg mx-auto px-4 w-full"
          >
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0e0d18]/90 border border-emerald-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-center relative overflow-hidden group">
              {/* Rayonnement holographique */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cine-violet/30 rounded-full blur-2xl pointer-events-none" />

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>L'Oracle a parlé</span>
              </div>

              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-2 drop-shadow-md">
                {winner.title || winner.name}
              </h2>

              <p className="text-xs sm:text-sm text-white/60 font-mono mb-4">
                {(winner.release_date || winner.first_air_date || "").slice(0, 4)}
                {winner.vote_average ? ` • ★ ${(winner.vote_average / 2).toFixed(1)}/5` : ""}
              </p>

              {winner.overview && (
                <p className="text-white/75 text-xs sm:text-sm leading-relaxed line-clamp-3 mb-6 font-light max-w-md mx-auto">
                  {winner.overview}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={`/title/${winner.title ? "movie" : "tv"}/${winner.id}`}
                  className="btn-primary !px-5 !py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-cine-violet/25"
                >
                  <Icon name="play" className="w-4 h-4" />
                  <span>Voir la fiche & streaming</span>
                </a>

                {onAddWinner && (
                  <button
                    onClick={onAddWinner}
                    disabled={added}
                    className="btn-ghost !px-4 !py-2.5 text-xs sm:text-sm font-semibold !bg-white/[0.08] hover:!bg-white/[0.14] border border-white/15"
                  >
                    <Icon name={added ? "check" : "plus"} className="w-4 h-4 text-emerald-400" />
                    <span>{added ? "Dans ma liste" : "Ajouter à ma liste"}</span>
                  </button>
                )}

                <button
                  onClick={resetOracle}
                  className="btn-ghost !px-4 !py-2.5 text-xs sm:text-sm font-semibold !bg-white/[0.05] hover:!bg-white/[0.1] border border-white/10 text-white/70"
                >
                  <Icon name="sparkle" className="w-4 h-4 text-amber-300" />
                  <span>Relancer</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="oracle-hub"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center text-center px-4 max-w-md pointer-events-auto"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md text-cine-soft text-xs font-mono font-semibold uppercase tracking-wider mb-3 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cine-soft animate-pulse" />
              <span>125 000 Particules • WebGL2</span>
            </div>

            <p className="text-xs text-white/50 font-mono tracking-widest uppercase mb-4">
              Effleurez l'orbe pour troubler la matière
            </p>

            <motion.button
              onClick={triggerOracle}
              disabled={spinning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-cine-violet via-indigo-600 to-emerald-500 text-white font-display font-bold text-base shadow-[0_12px_36px_rgba(124,92,255,0.4)] transition-all duration-300 hover:shadow-[0_16px_45px_rgba(16,185,129,0.5)] cursor-pointer disabled:opacity-50"
            >
              <Icon
                name="aperture"
                className={`w-5 h-5 transition-transform duration-700 ${spinning ? "animate-spin text-amber-300" : "group-hover:rotate-90"}`}
                weight="bold"
              />
              <span>{spinning ? "L'Oracle scrute l'univers..." : "Invoquer le film de ce soir"}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
