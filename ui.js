/* Interfaz: modelos, ajustes, información y paneles laterales. */
(function (BH) {
  'use strict';

  var P = BH.physics;
  var $ = function (id) { return document.getElementById(id); };

  BH.initUI = function (scene, labels) {
    /* Sin WebGL, un doble sin efecto mantiene viva la parte informativa. */
    var noop = function () {};
    var S = scene || {
      setMass: noop, setSize: noop, setTilt: noop, setSpeed: noop, setBright: noop, setParticles: noop,
      setJets: noop, setLens: noop, setStars: noop, setAuto: noop, setPhi: noop, setView: noop, resetView: noop,
      setColor: function (hex) { return {mid: hex, hot: '#ffffff', cold: '#33200f'}; }
    };
    var L = labels || {setVisible: noop};

    var current = null;          // modelo activo (null = personalizado)
    var lastId = 'sgra';
    var M = 4.3e6;

    var massEl = $('mass'), chipsBox = $('models');
    var viewBtns = document.querySelectorAll('[data-view]');

    /* ---------- Modelos ---------- */
    BH.MODELS.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.id = m.id; b.textContent = m.name;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { selectModel(m.id, true); });
      chipsBox.appendChild(b);
    });

    function markChips() {
      var cs = chipsBox.querySelectorAll('.chip');
      for (var i = 0; i < cs.length; i++) cs[i].setAttribute('aria-pressed', String(!!current && cs[i].dataset.id === current.id));
    }

    function fillInfo() {
      var q = P.quant(M);
      if (current) {
        $('mKind').textContent = current.kind;
        $('mName').textContent = current.name;
        $('mDesc').textContent = current.desc;
        $('mDist').textContent = current.distance;
        $('mFact').textContent = current.fact;
      } else {
        $('mKind').textContent = 'Masa ajustada por ti';
        $('mName').textContent = 'Modelo personalizado';
        $('mDesc').textContent = 'Elige un modelo real en la barra superior o mueve el control de masa. Las cifras se calculan con la masa actual.';
        $('mDist').textContent = '—';
        $('mFact').textContent = P.sizeText(q.rs);
      }
      $('mMass').textContent = P.fmtMass(M);
    }

    function setVal(id, v, unit) { $(id).innerHTML = v + (unit ? '<small>' + unit + '</small>' : ''); }
    function updateReadouts() {
      var q = P.quant(M);
      setVal('sRs', P.fmt(q.rs), 'km');
      $('sRsC').textContent = P.sizeText(q.rs);
      setVal('sSh', P.fmt(q.shadow), 'km');
      setVal('sIsco', P.fmt(q.isco), 'km');
      var t = P.fmtTime(q.period); setVal('sPer', t.v, t.u);
      setVal('sT', P.fmt(q.hawking), 'K');
      setVal('sRho', P.fmt(q.rho), 'kg/m³');
      $('sRhoC').textContent = q.rho < 1.2 ? 'Menos denso que el aire.' : '≈ ' + P.fmt(q.rho / 1000) + ' × la del agua.';
      $('massOut').textContent = P.fmtMass(M);
      fillInfo();
    }

    function applyMass(m) {
      M = m;
      S.setMass(M);
      updateReadouts();
    }

    /* ---------- Controles ---------- */
    function clearViewPress() { for (var i = 0; i < viewBtns.length; i++) viewBtns[i].setAttribute('aria-pressed', 'false'); }

    function setTilt(d) { $('tilt').value = d; S.setTilt(d); $('tiltOut').textContent = Math.round(d) + '°'; }
    function setSpeed(v) { $('speed').value = v; S.setSpeed(v); $('speedOut').textContent = '×' + Number(v).toFixed(2); }
    function setBright(v) { $('bright').value = v; S.setBright(v); $('brightOut').textContent = Math.round(v * 100) + '%'; }
    function setJets(on) { $('tJets').checked = on; S.setJets(on); }

    function applyColor(hex) {
      var c = S.setColor(hex);
      document.documentElement.style.setProperty('--accent', c.mid);
      $('color').value = hex;
      var sw = document.querySelectorAll('.sw-c');
      for (var i = 0; i < sw.length; i++) sw[i].setAttribute('aria-pressed', String(sw[i].dataset.color.toLowerCase() === hex.toLowerCase()));
      BH.drawAnatomy($('anat'), c);
    }

    function selectModel(id, scroll) {
      var m = null;
      for (var i = 0; i < BH.MODELS.length; i++) if (BH.MODELS[i].id === id) m = BH.MODELS[i];
      if (!m) return;
      current = m; lastId = id;
      massEl.value = P.massToU(m.M);
      applyMass(m.M);
      setTilt(m.tilt); setSpeed(m.speed); setBright(m.bright); setJets(m.jets);
      applyColor(m.color);
      S.setPhi(m.phi); clearViewPress();
      markChips();
      if (scroll) {
        var chip = chipsBox.querySelector('[data-id="' + id + '"]');
        if (chip && chip.scrollIntoView) chip.scrollIntoView({inline: 'nearest', block: 'nearest'});
      }
    }

    massEl.addEventListener('input', function () {
      var m = P.massFromU(Number(massEl.value));
      current = null;
      for (var i = 0; i < BH.MODELS.length; i++) {
        if (Math.abs(Math.log10(m / BH.MODELS[i].M)) < 0.015) { current = BH.MODELS[i]; break; }
      }
      applyMass(m);
      markChips();
    });
    $('scale').addEventListener('input', function () { var v = Number(this.value); S.setSize(v); $('scaleOut').textContent = '×' + v.toFixed(2); });
    $('tilt').addEventListener('input', function () { setTilt(Number(this.value)); });
    $('speed').addEventListener('input', function () { setSpeed(Number(this.value)); });
    $('bright').addEventListener('input', function () { setBright(Number(this.value)); });
    $('parts').addEventListener('input', function () { var v = Number(this.value); S.setParticles(v / 100); $('partsOut').textContent = v + '%'; });
    $('color').addEventListener('input', function () { applyColor(this.value); });
    $('tLens').addEventListener('change', function () { S.setLens(this.checked); });
    $('tJets').addEventListener('change', function () { S.setJets(this.checked); });
    $('tStars').addEventListener('change', function () { S.setStars(this.checked); });
    $('tLabels').addEventListener('change', function () { L.setVisible(this.checked); });
    $('tAuto').addEventListener('change', function () { S.setAuto(this.checked); });
    $('restore').addEventListener('click', function () { selectModel(current ? current.id : lastId, false); });

    BH.PALETTES.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sw-c'; b.dataset.color = p.color; b.style.background = p.color;
      b.title = p.name; b.setAttribute('aria-label', p.name); b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { applyColor(p.color); });
      $('swatches').appendChild(b);
    });

    for (var v = 0; v < viewBtns.length; v++) {
      viewBtns[v].addEventListener('click', function () {
        clearViewPress();
        this.setAttribute('aria-pressed', 'true');
        S.setView(this.dataset.view);
      });
    }
    $('reset').addEventListener('click', function () { clearViewPress(); S.resetView(); });
    if (scene) scene.onUserCamera = clearViewPress;

    /* ---------- Paneles laterales (ocultos al inicio) ---------- */
    var drawers = {
      drawInfo: {el: $('drawInfo'), btn: $('btnInfo')},
      drawSet: {el: $('drawSet'), btn: $('btnSet')}
    };
    function isOpen(id) { return drawers[id].el.classList.contains('open'); }
    function setDrawer(id, open, focus) {
      var d = drawers[id];
      d.el.classList.toggle('open', open);
      d.el.setAttribute('aria-hidden', String(!open));
      d.btn.setAttribute('aria-expanded', String(open));
      if (focus) {
        if (open) { var x = d.el.querySelector('.x'); if (x) x.focus(); }
        else d.btn.focus();
      }
    }
    function toggle(id) {
      var open = !isOpen(id);
      if (open && $('stage').clientWidth < 800) {
        Object.keys(drawers).forEach(function (k) { if (k !== id) setDrawer(k, false, false); });
      }
      setDrawer(id, open, true);
    }
    $('btnInfo').addEventListener('click', function () { toggle('drawInfo'); });
    $('btnSet').addEventListener('click', function () { toggle('drawSet'); });
    var closers = document.querySelectorAll('[data-close]');
    for (var c = 0; c < closers.length; c++) {
      closers[c].addEventListener('click', function () { setDrawer(this.dataset.close, false, true); });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      Object.keys(drawers).forEach(function (k) { if (isOpen(k)) setDrawer(k, false, true); });
    });

    /* ---------- Estado inicial ---------- */
    $('scaleOut').textContent = '×1.00';
    $('partsOut').textContent = '100%';
    selectModel(lastId, false);
  };
})(window.BH = window.BH || {});
