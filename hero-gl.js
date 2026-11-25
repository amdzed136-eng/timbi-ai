'use strict';

/* ══════════════════════════════════════════════════
   TIMBI AI — hero-gl.js
   Interactive particle sphere in plain WebGL (no library).
   - Fibonacci sphere displaced by 3D simplex noise
   - Pointer pushes particles away, click/tap = "storm" pulse
   - Scroll dissolves the sphere as the hero leaves the screen
   - Static frame with prefers-reduced-motion, CSS fallback without WebGL
   ══════════════════════════════════════════════════ */

(() => {
  const canvas = document.getElementById('heroGL');
  const hero   = document.getElementById('home');
  if (!canvas || !hero) return;

  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) { hero.classList.add('no-gl'); return; }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smallScreen  = window.matchMedia('(max-width: 780px)').matches;
  const weakDevice   = (navigator.hardwareConcurrency || 4) <= 4;
  const COUNT = smallScreen || weakDevice ? 6000 : 14000;

  /* ─── Shaders ─── */
  const VERT = `
    precision highp float;
    attribute vec3 aPos;
    attribute float aSeed;
    uniform float uTime, uAspect, uIntensity, uScroll, uDpr, uPulse;
    uniform vec2 uMouse, uOffset, uRot;
    uniform float uScale;
    varying float vGlow, vAlpha;

    // Ashima Arts 3D simplex noise (MIT)
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }

    mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s, 0.,1.,0., s,0.,c);}
    mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0., 0.,c,s, 0.,-s,c);}

    void main(){
      float n = snoise(aPos * 1.4 + vec3(0.0, uTime * 0.12, uTime * 0.07));
      float amp = uIntensity + uPulse * 0.45 + uScroll * 0.35;
      // Scroll: particles drift outwards along their own direction, at different speeds
      float burst = uScroll * uScroll * (1.2 + aSeed * 2.4);
      vec3 p = aPos * (1.0 + n * amp + burst);

      p = rotX(uRot.y) * rotY(uRot.x) * p;

      vec3 v = p * uScale;
      float w = 3.2 - v.z;
      vec2 ndc = vec2(v.x * 1.9 / uAspect, v.y * 1.9) / w + uOffset;

      // Pointer repulsion in screen space
      vec2 diff = ndc - uMouse;
      diff.x *= uAspect;
      float d = length(diff);
      float push = smoothstep(0.38, 0.0, d) * 0.11;
      ndc += (d > 0.0001 ? normalize(diff) : vec2(0.0)) * push / vec2(uAspect, 1.0);

      gl_Position = vec4(ndc, 0.0, 1.0);

      float facing = smoothstep(-1.0, 1.0, p.z);
      vGlow  = clamp(0.35 + n * 0.9 + push * 4.0 + uPulse * 0.4, 0.0, 1.0);
      vAlpha = (0.35 + 0.65 * facing) * (1.0 - smoothstep(0.55, 1.0, uScroll));
      gl_PointSize = (2.2 + aSeed * 3.0 + facing * 2.4) * uDpr * (0.85 + uScale * 0.25);
    }
  `;

  const FRAG = `
    precision mediump float;
    varying float vGlow, vAlpha;
    uniform vec3 uCold, uHot;
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float r = length(c);
      if (r > 0.5) discard;
      float soft = smoothstep(0.5, 0.0, r);
      soft *= soft * 1.8;
      vec3 col = mix(uCold, uHot, vGlow);
      gl_FragColor = vec4(col * soft, soft * vAlpha);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[hero-gl]', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs) { hero.classList.add('no-gl'); return; }
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { hero.classList.add('no-gl'); return; }
  gl.useProgram(prog);

  /* ─── Geometry: Fibonacci sphere ─── */
  const data = new Float32Array(COUNT * 4);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    data[i * 4]     = Math.cos(t) * r;
    data[i * 4 + 1] = y;
    data[i * 4 + 2] = Math.sin(t) * r;
    data[i * 4 + 3] = Math.random();
  }
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const aPos  = gl.getAttribLocation(prog, 'aPos');
  const aSeed = gl.getAttribLocation(prog, 'aSeed');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(aSeed);
  gl.vertexAttribPointer(aSeed, 1, gl.FLOAT, false, 16, 12);

  const U = {};
  ['uTime','uAspect','uIntensity','uScroll','uDpr','uPulse','uMouse','uOffset','uRot','uScale','uCold','uHot']
    .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });

  // Colours follow the CSS palette (ember on ink)
  const css = getComputedStyle(document.documentElement);
  const hex = (v, fb) => {
    const h = (css.getPropertyValue(v).trim() || fb).replace('#', '');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  };
  gl.uniform3fv(U.uCold, hex('--gold-dark', '#c2410c'));
  gl.uniform3fv(U.uHot,  hex('--gold-light', '#ffc29e'));

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive glow
  gl.clearColor(0, 0, 0, 0);

  /* ─── State ─── */
  let width = 0, height = 0, dpr = 1;
  let layoutOffset = [0, 0], layoutScale = 1;
  const mouse  = { x: 9, y: 9, tx: 9, ty: 9 };   // off-screen until the pointer moves
  const rot    = { x: 0, y: 0.35, ty: 0 };
  let pulse = 0, scroll = 0, time = 0, last = performance.now();
  let visible = true, raf = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, smallScreen ? 1.5 : 2);
    width = canvas.clientWidth; height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Desktop: sphere sits to the right of the headline. Mobile: centred, above the text.
    if (width > 900) { layoutOffset = [0.42, 0.02]; layoutScale = 1.05; }
    else             { layoutOffset = [0.0, 0.5];   layoutScale = 0.66; }
    if (reduceMotion || !raf) draw();
  }

  function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uAspect, width / Math.max(height, 1));
    gl.uniform1f(U.uIntensity, 0.12);
    gl.uniform1f(U.uScroll, scroll);
    gl.uniform1f(U.uDpr, dpr);
    gl.uniform1f(U.uPulse, pulse);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform2f(U.uOffset, layoutOffset[0], layoutOffset[1]);
    gl.uniform2f(U.uRot, rot.x, rot.y);
    gl.uniform1f(U.uScale, layoutScale);
    gl.drawArrays(gl.POINTS, 0, COUNT);
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    // Ease everything in the frame loop, never in event handlers
    mouse.x += (mouse.tx - mouse.x) * Math.min(dt * 6, 1);
    mouse.y += (mouse.ty - mouse.y) * Math.min(dt * 6, 1);
    rot.x += dt * 0.08;  // slow auto-spin
    rot.y += (0.35 + rot.ty - rot.y) * Math.min(dt * 2, 1);
    pulse *= Math.pow(0.12, dt);
    draw();
    if (visible) raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf && visible && !reduceMotion) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  /* ─── Inputs ─── */
  if (!reduceMotion) {
    window.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
      rot.ty = mouse.ty * -0.25;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.tx = 9; mouse.ty = 9; rot.ty = 0; });
    hero.addEventListener('pointerdown', e => {
      if (e.target.closest('a, button')) return;
      pulse = 1;
    });
  }

  window.addEventListener('scroll', () => {
    const s = Math.min(Math.max(window.scrollY / (hero.offsetHeight * 0.9), 0), 1);
    scroll = s;
    if (reduceMotion) draw();
  }, { passive: true });

  window.addEventListener('resize', resize);

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && !document.hidden;
    if (visible) start();
  }).observe(hero);

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible) start();
  });

  resize();
  draw();
  hero.classList.add('gl-ready');
  start();
})();
