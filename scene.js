/* Escena 3D (Three.js): sombra, halo, disco, gas, chorros, estrellas y cámara orbital. */
(function (BH) {
  'use strict';

  var VIEWS = {edge: 1.5, tilt: 1.12, top: 0.1};
  var HOME = {phi: 1.4, r: 24};

  BH.createScene = function (stage, canvas) {
    if (typeof THREE === 'undefined') return null;
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true, powerPreference: 'high-performance'});
    } catch (err) {
      return null;
    }

    var reduceMotion = false;
    try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var PR = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(PR);
    renderer.setClearColor(0x000000, 1);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    var cam = {theta: 0, thetaT: 0, phi: HOME.phi, phiT: HOME.phi, r: HOME.r, rT: HOME.r, fit: 1};

    var state = {
      M: 4.3e6, rh: 1, rhT: 1, sizeMul: 1,
      tilt: 8 * Math.PI / 180, tiltT: 8 * Math.PI / 180,
      speed: reduceMotion ? 0.25 : 1, bright: 1,
      particles: 1, lens: true, jets: false, stars: true, auto: false
    };
    state.rh = state.rhT = BH.physics.rhFromM(state.M);

    /* Uniformes compartidos entre materiales */
    var U = {
      uTime: {value: 0}, uSpeed: {value: state.speed}, uBright: {value: state.bright},
      uCold: {value: new THREE.Color()}, uMid: {value: new THREE.Color()}, uHot: {value: new THREE.Color()},
      uAxis: {value: new THREE.Vector3(0, 1, 0)}
    };
    var SH = BH.shaders;

    /* Sombra: círculo negro que siempre mira a la cámara */
    var shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshBasicMaterial({color: 0x000000}));
    scene.add(shadow);

    /* Halo */
    var haloMat = new THREE.ShaderMaterial({
      uniforms: {
        uCold: U.uCold, uMid: U.uMid, uHot: U.uHot, uBright: U.uBright, uTime: U.uTime,
        uAx: {value: new THREE.Vector2(0, 1)}, uEdge: {value: 1}, uS: {value: 12}, uLens: {value: 1}
      },
      vertexShader: SH.halo.vertex, fragmentShader: SH.halo.fragment,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
    });
    var halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), haloMat);
    halo.renderOrder = 5;
    scene.add(halo);

    /* Grupo escalado por el radio visual del horizonte */
    var bh = new THREE.Group();
    scene.add(bh);
    var diskGroup = new THREE.Group();
    bh.add(diskGroup);

    var diskMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: U.uTime, uSpeed: U.uSpeed, uBright: U.uBright, uCold: U.uCold, uMid: U.uMid, uHot: U.uHot, uAxis: U.uAxis,
        uInner: {value: 3}, uOuter: {value: 8}
      },
      vertexShader: SH.disk.vertex, fragmentShader: SH.disk.fragment,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    var disk = new THREE.Mesh(new THREE.RingGeometry(3, 8, 192, 1), diskMat);
    disk.rotation.x = -Math.PI / 2;
    diskGroup.add(disk);

    /* Gas en espiral */
    var NP = 2400;
    var pr = new Float32Array(NP), pt = new Float32Array(NP), py = new Float32Array(NP);
    var ppos = new Float32Array(NP * 3), pseed = new Float32Array(NP);
    var pCount = NP;
    function respawn(i, anywhere) {
      pr[i] = anywhere ? 3.05 + Math.pow(Math.random(), 0.8) * 4.9 : 7.4 + Math.random() * 0.6;
      pt[i] = Math.random() * Math.PI * 2;
      py[i] = (Math.random() + Math.random() - 1) * 0.1 * pr[i];
      pseed[i] = Math.random();
    }
    for (var i = 0; i < NP; i++) respawn(i, true);
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
    pGeo.setAttribute('aSeed', new THREE.BufferAttribute(pseed, 1));
    var pMat = new THREE.ShaderMaterial({
      uniforms: {uMid: U.uMid, uHot: U.uHot, uBright: U.uBright, uPR: {value: PR}, uTime: U.uTime},
      vertexShader: SH.particles.vertex, fragmentShader: SH.particles.fragment,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    var parts = new THREE.Points(pGeo, pMat);
    parts.frustumCulled = false;
    diskGroup.add(parts);

    /* Chorros */
    var jetMat = new THREE.ShaderMaterial({
      uniforms: {uMid: U.uMid, uHot: U.uHot, uBright: U.uBright, uTime: U.uTime},
      vertexShader: SH.jets.vertex, fragmentShader: SH.jets.fragment,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    });
    var jetGeo = new THREE.CylinderGeometry(1.0, 0.1, 14, 48, 1, true);
    var jets = new THREE.Group();
    var jetUp = new THREE.Mesh(jetGeo, jetMat); jetUp.position.y = 8.6;
    var jetDn = new THREE.Mesh(jetGeo, jetMat); jetDn.position.y = -8.6; jetDn.rotation.x = Math.PI;
    jets.add(jetUp); jets.add(jetDn);
    jets.visible = false;
    diskGroup.add(jets);

    /* Estrellas */
    var NS = 3600;
    var sPos = new Float32Array(NS * 3), sSize = new Float32Array(NS), sPh = new Float32Array(NS), sCol = new Float32Array(NS * 3);
    var palette = [[0.80, 0.88, 1.0], [1.0, 0.97, 0.9], [1.0, 0.84, 0.66], [0.9, 0.93, 1.0]];
    for (var k = 0; k < NS; k++) {
      var u1 = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rad = 140 + Math.random() * 160;
      var sq = Math.sqrt(1 - u1 * u1);
      sPos[k * 3] = rad * sq * Math.cos(th); sPos[k * 3 + 1] = rad * u1; sPos[k * 3 + 2] = rad * sq * Math.sin(th);
      var big = Math.random() < 0.04;
      sSize[k] = big ? 2.6 + Math.random() * 1.4 : 0.9 + Math.random() * 1.2;
      sPh[k] = Math.random();
      var pc = palette[Math.floor(Math.random() * palette.length)], br = 0.35 + Math.random() * 0.65;
      sCol[k * 3] = pc[0] * br; sCol[k * 3 + 1] = pc[1] * br; sCol[k * 3 + 2] = pc[2] * br;
    }
    var sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
    sGeo.setAttribute('aPh', new THREE.BufferAttribute(sPh, 1));
    sGeo.setAttribute('aCol', new THREE.BufferAttribute(sCol, 3));
    var starMat = new THREE.ShaderMaterial({
      uniforms: {uPR: {value: PR}, uTime: U.uTime, uTE: {value: 0.1}, uLens: {value: 1}, uTwinkle: {value: reduceMotion ? 0 : 1}},
      vertexShader: SH.stars.vertex, fragmentShader: SH.stars.fragment,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    var stars = new THREE.Points(sGeo, starMat);
    stars.frustumCulled = false;
    scene.add(stars);

    /* ---------- Cámara e interacción ---------- */
    var api = {
      state: state, camera: camera, diskGroup: diskGroup, cam: cam, stage: stage,
      onUserCamera: null, frameHooks: [],
      /** Radio visual efectivo del horizonte (masa × escala elegida). */
      rhEff: function () { return state.rh * state.sizeMul; }
    };

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      cam.fit = Math.max(1, 1.25 / camera.aspect);
      camera.updateProjectionMatrix();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);
    resize();

    function touched() { if (api.onUserCamera) api.onUserCamera(); }
    function clampPhi(p) { return Math.min(Math.PI - 0.05, Math.max(0.05, p)); }
    var pointers = new Map(), pinchD = 0;
    canvas.addEventListener('pointerdown', function (e) {
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
      if (pointers.size === 2) {
        var a = Array.from(pointers.values());
        pinchD = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      }
      touched();
    });
    canvas.addEventListener('pointermove', function (e) {
      var p = pointers.get(e.pointerId);
      if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pointers.size === 1) {
        cam.thetaT -= dx * 0.006;
        cam.phiT = clampPhi(cam.phiT - dy * 0.006);
      } else if (pointers.size === 2) {
        var a = Array.from(pointers.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        if (pinchD > 0) cam.rT = Math.min(60, Math.max(9, cam.rT * pinchD / d));
        pinchD = d;
      }
    });
    function endPointer(e) { pointers.delete(e.pointerId); pinchD = 0; }
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      cam.rT = Math.min(60, Math.max(9, cam.rT * Math.exp(e.deltaY * 0.0012)));
    }, {passive: false});
    canvas.addEventListener('keydown', function (e) {
      var h = true;
      if (e.key === 'ArrowLeft') cam.thetaT -= 0.12;
      else if (e.key === 'ArrowRight') cam.thetaT += 0.12;
      else if (e.key === 'ArrowUp') cam.phiT = clampPhi(cam.phiT - 0.08);
      else if (e.key === 'ArrowDown') cam.phiT = clampPhi(cam.phiT + 0.08);
      else if (e.key === '+' || e.key === '=') cam.rT = Math.max(9, cam.rT * 0.9);
      else if (e.key === '-') cam.rT = Math.min(60, cam.rT * 1.1);
      else h = false;
      if (h) { e.preventDefault(); touched(); }
    });

    /* ---------- API pública ---------- */
    api.setMass = function (M) { state.M = M; state.rhT = BH.physics.rhFromM(M); };
    api.setSize = function (mul) { state.sizeMul = mul; };
    api.setTilt = function (deg) { state.tiltT = deg * Math.PI / 180; };
    api.setSpeed = function (v) { state.speed = v; U.uSpeed.value = v; };
    api.setBright = function (v) { state.bright = v; U.uBright.value = v; };
    api.setParticles = function (frac) {
      state.particles = frac;
      pCount = Math.round(NP * frac);
      pGeo.setDrawRange(0, pCount);
      parts.visible = pCount > 0;
    };
    api.setJets = function (on) { state.jets = on; jets.visible = on; };
    api.setLens = function (on) { state.lens = on; };
    api.setStars = function (on) { state.stars = on; stars.visible = on; };
    api.setAuto = function (on) { state.auto = on; };
    api.setPhi = function (phi) { cam.phiT = clampPhi(phi); };
    api.setView = function (name) { if (VIEWS[name] !== undefined) cam.phiT = VIEWS[name]; };
    api.resetView = function () {
      cam.thetaT = Math.round(cam.thetaT / (Math.PI * 2)) * Math.PI * 2;
      cam.phiT = HOME.phi; cam.rT = HOME.r;
    };
    /** Aplica el color base al disco. Devuelve colores CSS para la interfaz. */
    api.setColor = function (hex) {
      var c = new THREE.Color(hex), hsl = {};
      c.getHSL(hsl);
      var l = Math.min(Math.max(hsl.l, 0.5), 0.95);
      U.uMid.value.setHSL(hsl.h, hsl.s, l);
      U.uHot.value.copy(U.uMid.value).lerp(new THREE.Color(1, 1, 1), 0.65);
      U.uCold.value.setHSL((hsl.h + 0.96) % 1, Math.min(1, hsl.s + 0.1), l * 0.38);
      return {
        mid: '#' + U.uMid.value.getHexString(),
        hot: '#' + U.uHot.value.getHexString(),
        cold: '#' + U.uCold.value.getHexString()
      };
    };

    /* ---------- Bucle ---------- */
    var time = 0, last = performance.now();
    var axisW = new THREE.Vector3(), camRight = new THREE.Vector3(), camUp = new THREE.Vector3();

    function frame(now) {
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time += dt;
      U.uTime.value = reduceMotion ? time * 0.2 : time;

      var k1 = 1 - Math.exp(-dt * 10), k2 = 1 - Math.exp(-dt * 5);
      if (state.auto && pointers.size === 0) cam.thetaT += dt * 0.14;
      cam.theta += (cam.thetaT - cam.theta) * k1;
      cam.phi += (cam.phiT - cam.phi) * k1;
      cam.r += (cam.rT - cam.r) * k1;
      state.rh += (state.rhT - state.rh) * k2;
      state.tilt += (state.tiltT - state.tilt) * k2;

      var rhE = api.rhEff();
      var dist = cam.r * cam.fit;
      camera.position.set(
        dist * Math.sin(cam.phi) * Math.sin(cam.theta),
        dist * Math.cos(cam.phi),
        dist * Math.sin(cam.phi) * Math.cos(cam.theta)
      );
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();

      bh.scale.setScalar(rhE);
      diskGroup.rotation.x = state.tilt;
      diskGroup.updateMatrixWorld(true);
      axisW.set(0, 1, 0).applyQuaternion(diskGroup.quaternion);
      U.uAxis.value.copy(axisW);

      shadow.quaternion.copy(camera.quaternion);
      shadow.scale.setScalar(2.6 * rhE);
      halo.quaternion.copy(camera.quaternion);
      halo.scale.setScalar(12 * rhE);

      camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
      var ax = axisW.dot(camRight), ay = axisW.dot(camUp), al = Math.hypot(ax, ay);
      haloMat.uniforms.uAx.value.set(al > 1e-3 ? ax / al : 0, al > 1e-3 ? ay / al : 1);
      var ed = Math.min(1, Math.max(0, (al - 0.1) / 0.8));
      haloMat.uniforms.uEdge.value = ed * ed * (3 - 2 * ed);
      haloMat.uniforms.uLens.value = state.lens ? 1 : 0;

      starMat.uniforms.uLens.value = state.lens ? 1 : 0;
      starMat.uniforms.uTE.value = Math.atan(2.6 * rhE / dist) * 1.12;
      stars.rotation.y += dt * 0.004;

      if (pCount > 0) {
        var sp = dt * state.speed;
        for (var i = 0; i < pCount; i++) {
          var r = pr[i];
          pt[i] += 0.9 / (r * Math.sqrt(r)) * sp * 3.0;
          pr[i] = r - dt * 0.03 * (0.4 + state.speed * 0.6);
          if (pr[i] < 3.05) respawn(i, false);
          r = pr[i];
          ppos[i * 3] = r * Math.sin(pt[i]); ppos[i * 3 + 1] = py[i]; ppos[i * 3 + 2] = r * Math.cos(pt[i]);
        }
        pGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
      for (var h = 0; h < api.frameHooks.length; h++) api.frameHooks[h]();
    }
    api.start = function () { requestAnimationFrame(function (t) { last = t; frame(t); }); };

    return api;
  };
})(window.BH = window.BH || {});
