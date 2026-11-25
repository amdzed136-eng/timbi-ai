'use strict';

/* ══════════════════════════════════════════════════
   TIMBI AI — hero-gl.js
   One particle system in plain WebGL (no library), fixed behind the page.
   It morphs with the section in view (data-gl on each section):
     sphere → hero         flow → services / process
     dim    → work / packages (quiet background)
     logo   → contact (particles form the "T")
   Pointer pushes particles, click/tap sends a pulse.
   Reduced motion: no autonomous movement, states switch without animation.
   No WebGL: the CSS glow (.gl-fallback) stays on its own.
   ══════════════════════════════════════════════════ */

{
  const canvas = document.getElementById('heroGL');
  const body = document.body;
  const gl = canvas && canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });

  if (!gl) {
    body.classList.add('no-gl');
  } else {
    init(gl);
  }

  function init(gl) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallScreen  = window.matchMedia('(max-width: 780px)').matches;
    const weakDevice   = (navigator.hardwareConcurrency || 4) <= 4;
    const COUNT = smallScreen || weakDevice ? 6000 : 14000;

    /* ─── Shaders ─── */
    const VERT = `
      precision highp float;
      attribute vec3 aSphere;
      attribute vec3 aFlow;
      attribute vec3 aLogo;
      attribute float aSeed;
      uniform float uTime, uAspect, uDpr, uPulse, uScatter, uScale, uAlpha;
      uniform float uFlow, uLogo;
      uniform vec2 uMouse, uOffset, uRot;
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
        // Each particle eases at its own pace, so morphs ripple instead of snapping
        float lagF = clamp(uFlow * 1.35 - aSeed * 0.35, 0.0, 1.0);
        float lagL = clamp(uLogo * 1.35 - aSeed * 0.35, 0.0, 1.0);
        lagF = lagF * lagF * (3.0 - 2.0 * lagF);
        lagL = lagL * lagL * (3.0 - 2.0 * lagL);

        // Shape B: a living wave field
        vec3 flow = aFlow;
        flow.y += sin(flow.x * 2.1 + uTime * 0.9) * 0.16 + cos(flow.z * 3.2 + uTime * 0.7) * 0.11;

        vec3 base = mix(mix(aSphere, flow, lagF), aLogo, lagL);
        float n = snoise(base * 1.4 + vec3(0.0, uTime * 0.12, uTime * 0.07));
        float amp = mix(0.12, 0.05, max(lagF, lagL)) + uPulse * 0.4 + uScatter * 0.9;
        vec3 dir = mix(base, vec3(0.0, 1.0, 0.0), lagF);   // wave field breathes vertically
        dir = mix(dir, vec3(0.0, 0.0, 1.0), lagL);          // logo breathes towards the viewer
        vec3 p = base + normalize(dir + 0.0001) * n * amp * (1.0 + aSeed);

        p = rotX(uRot.y) * rotY(uRot.x) * p;

        vec3 v = p * uScale;
        float w = 3.2 - v.z;
        vec2 ndc = vec2(v.x * 1.9 / uAspect, v.y * 1.9) / w + uOffset;

        vec2 diff = ndc - uMouse;
        diff.x *= uAspect;
        float d = length(diff);
        float push = smoothstep(0.36, 0.0, d) * 0.1;
        ndc += (d > 0.0001 ? normalize(diff) : vec2(0.0)) * push / vec2(uAspect, 1.0);

        gl_Position = vec4(ndc, 0.0, 1.0);

        float facing = smoothstep(-1.0, 1.0, p.z);
        vGlow  = clamp(0.35 + n * 0.9 + push * 4.0 + uPulse * 0.4 + lagL * 0.15, 0.0, 1.0);
        vAlpha = (0.35 + 0.65 * facing) * uAlpha;
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
        gl_FragColor = vec4(mix(uCold, uHot, vGlow) * soft, soft * vAlpha);
      }
    `;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('[hero-gl]', gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { body.classList.add('no-gl'); return; }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { body.classList.add('no-gl'); return; }
    gl.useProgram(prog);

    /* ─── Geometry: 3 target shapes per particle ─── */
    const STRIDE = 10;
    const data = new Float32Array(COUNT * STRIDE);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const cols = Math.ceil(Math.sqrt(COUNT * 2));
    const rows = Math.ceil(COUNT / cols);
    // "T" glyph: top bar + stem, given thickness so it reads in 3D
    const BAR  = { x0: -0.95, x1: 0.95, y0: 0.42, y1: 0.82 };
    const STEM = { x0: -0.2,  x1: 0.2,  y0: -0.92, y1: 0.42 };
    const barArea  = (BAR.x1 - BAR.x0) * (BAR.y1 - BAR.y0);
    const stemArea = (STEM.x1 - STEM.x0) * (STEM.y1 - STEM.y0);
    const pBar = barArea / (barArea + stemArea);
    const rand = (a, b) => a + Math.random() * (b - a);

    for (let i = 0; i < COUNT; i++) {
      const o = i * STRIDE;
      // A: Fibonacci sphere
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      data[o] = Math.cos(t) * r; data[o + 1] = y; data[o + 2] = Math.sin(t) * r;
      // B: grid on a plane
      const c = i % cols, rw = Math.floor(i / cols);
      data[o + 3] = (c / (cols - 1) - 0.5) * 3.6;
      data[o + 4] = 0;
      data[o + 5] = (rw / Math.max(rows - 1, 1) - 0.5) * 2.0;
      // C: the T
      const shape = Math.random() < pBar ? BAR : STEM;
      data[o + 6] = rand(shape.x0, shape.x1);
      data[o + 7] = rand(shape.y0, shape.y1);
      data[o + 8] = rand(-0.1, 0.1);
      // seed
      data[o + 9] = Math.random();
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    [['aSphere', 3, 0], ['aFlow', 3, 3], ['aLogo', 3, 6], ['aSeed', 1, 9]].forEach(([name, size, off]) => {
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, off * 4);
    });

    const U = {};
    ['uTime','uAspect','uDpr','uPulse','uScatter','uScale','uAlpha','uFlow','uLogo','uMouse','uOffset','uRot','uCold','uHot']
      .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });

    const css = getComputedStyle(document.documentElement);
    const hex = (v, fb) => {
      const h = (css.getPropertyValue(v).trim() || fb).replace('#', '');
      return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
    };
    gl.uniform3fv(U.uCold, hex('--gold-dark', '#c2410c'));
    gl.uniform3fv(U.uHot,  hex('--gold-light', '#ffc29e'));

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    /* ─── Scene states (desktop / mobile) ─── */
    // flow & logo: morph targets · ox, oy: screen offset · s: scale · a: opacity · tilt: X rotation
    const STATES = {
      desktop: {
        sphere: { flow: 0, logo: 0, ox: 0.5,  oy: 0.02, s: 0.98, a: 1,    tilt: 0.35 },
        flow:   { flow: 1, logo: 0, ox: -0.5, oy: 0.0,  s: 1.0,  a: 0.9,  tilt: 0.55 },
        dim:    { flow: 1, logo: 0, ox: 0.0,  oy: -0.1, s: 1.35, a: 0.16, tilt: 0.6  },
        logo:   { flow: 0, logo: 1, ox: 0.47, oy: 0.0,  s: 0.84,  a: 1,    tilt: 0    },
      },
      mobile: {
        sphere: { flow: 0, logo: 0, ox: 0.0, oy: 0.52, s: 0.56, a: 1,    tilt: 0.35 },
        flow:   { flow: 1, logo: 0, ox: 0.0, oy: 0.55, s: 0.6,  a: 0.4,  tilt: 0.55 },
        dim:    { flow: 1, logo: 0, ox: 0.0, oy: 0.0,  s: 0.9,  a: 0.14, tilt: 0.6  },
        logo:   { flow: 0, logo: 1, ox: 0.0, oy: 0.3,  s: 0.8,  a: 0.22, tilt: 0    },
      },
    };
    const KEYS = ['flow', 'logo', 'ox', 'oy', 's', 'a', 'tilt'];
    let layout = window.innerWidth > 900 ? 'desktop' : 'mobile';
    let targetName = 'sphere';
    const cur = Object.assign({}, STATES[layout].sphere);

    /* ─── Runtime ─── */
    let width = 0, height = 0, dpr = 1;
    const mouse = { x: 9, y: 9, tx: 9, ty: 9 };
    let angle = 0, tiltPointer = 0, tiltTarget = 0;
    let pulse = 0, scatter = 0, time = 0, last = performance.now();
    let running = false;

    const sections = Array.from(document.querySelectorAll('[data-gl]'));
    function pickState() {
      const mid = window.innerHeight * 0.5;
      let name = targetName;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) { name = s.dataset.gl; break; }
      }
      if (name !== targetName) {
        targetName = name;
        if (reduceMotion) { Object.assign(cur, STATES[layout][targetName]); draw(); }
        else start();
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, smallScreen ? 1.5 : 2);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const next = window.innerWidth > 900 ? 'desktop' : 'mobile';
      if (next !== layout) { layout = next; Object.assign(cur, STATES[layout][targetName]); }
      draw();
    }

    function draw() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uAspect, width / Math.max(height, 1));
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform1f(U.uPulse, pulse);
      gl.uniform1f(U.uScatter, scatter);
      gl.uniform1f(U.uScale, cur.s);
      gl.uniform1f(U.uAlpha, cur.a);
      gl.uniform1f(U.uFlow, cur.flow);
      gl.uniform1f(U.uLogo, cur.logo);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform2f(U.uOffset, cur.ox, cur.oy);
      // The T faces the viewer with a gentle sway; other shapes keep spinning
      const sway = Math.sin(time * 0.5) * 0.3 * cur.logo;
      gl.uniform2f(U.uRot, angle + sway, cur.tilt + tiltPointer);
      gl.drawArrays(gl.POINTS, 0, COUNT);
    }

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;

      const target = STATES[layout][targetName];
      let distance = 0;
      const k = Math.min(dt * 1.6, 1);
      for (const key of KEYS) {
        const delta = target[key] - cur[key];
        cur[key] += delta * k;
        if (key === 'flow' || key === 'logo') distance += Math.abs(delta);
      }
      scatter += (Math.min(distance, 1) * 0.35 - scatter) * Math.min(dt * 4, 1);

      // Spin, slowing on the wave field and stopping on the logo (snapped to a full turn)
      angle += dt * 0.08 * (1 - 0.6 * cur.flow) * (1 - cur.logo);
      if (cur.logo > 0.01) {
        const full = Math.round(angle / (Math.PI * 2)) * Math.PI * 2;
        angle += (full - angle) * Math.min(dt * 2.5, 1) * cur.logo;
      }

      mouse.x += (mouse.tx - mouse.x) * Math.min(dt * 6, 1);
      mouse.y += (mouse.ty - mouse.y) * Math.min(dt * 6, 1);
      tiltPointer += (tiltTarget - tiltPointer) * Math.min(dt * 2, 1);
      pulse *= Math.pow(0.12, dt);

      draw();
      if (running) requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduceMotion || document.hidden) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }

    /* ─── Inputs ─── */
    if (!reduceMotion) {
      window.addEventListener('pointermove', e => {
        mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
        tiltTarget = mouse.ty * -0.2;
      }, { passive: true });
      document.addEventListener('pointerleave', () => { mouse.tx = 9; mouse.ty = 9; tiltTarget = 0; });
      document.addEventListener('pointerdown', e => {
        if (e.target.closest('a, button, input, select, textarea, label, .lang-dropdown')) return;
        pulse = 1;
      });
    }

    window.addEventListener('scroll', pickState, { passive: true });
    window.addEventListener('resize', () => { resize(); pickState(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) running = false; else start();
    });

    resize();
    pickState();
    Object.assign(cur, STATES[layout][targetName]);
    draw();
    body.classList.add('gl-ready');
    start();
  }
}
