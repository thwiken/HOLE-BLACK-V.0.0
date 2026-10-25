/* Física y formato de cifras (agujero negro de Schwarzschild: sin rotación ni carga). */
(function (BH) {
  'use strict';

  var RS_PER_MSUN_KM = 2.953;       // Rs = 2GM/c² ≈ 2,953 km por masa solar
  var SUPERSCRIPT = {'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};

  // Rango del control de masa (escala logarítmica): de 3 M☉ a ~1,6 × 10¹¹ M☉
  var LOG_MIN = Math.log10(3);
  var LOG_MAX = 11.2;
  var SLIDER_STEPS = 10000;

  function sup(n) {
    return String(n).split('').map(function (c) { return SUPERSCRIPT[c]; }).join('');
  }

  function num(x, sig) {
    return x.toLocaleString('es', {maximumSignificantDigits: sig || 3});
  }

  /** Número legible; usa notación científica fuera de 0,01 … 100 000. */
  function fmt(x) {
    if (x === 0) return '0';
    var ax = Math.abs(x);
    if (ax >= 1e-2 && ax < 1e5) return num(x, 3);
    var e = Math.floor(Math.log10(ax));
    var m = x / Math.pow(10, e);
    if (Math.abs(m) >= 9.995) { m = 1; e += 1; }
    return m.toLocaleString('es', {maximumFractionDigits: 2}) + ' × 10' + sup(e);
  }

  function fmtMass(M) {
    if (M < 1e4) return num(M, 3) + ' M☉';
    var e = Math.floor(Math.log10(M));
    var m = M / Math.pow(10, e);
    return m.toLocaleString('es', {maximumFractionDigits: 1}) + ' × 10' + sup(e) + ' M☉';
  }

  function fmtTime(s) {
    if (s < 1) return {v: num(s * 1000, 3), u: 'ms'};
    if (s < 120) return {v: num(s, 3), u: 's'};
    if (s < 7200) return {v: num(s / 60, 3), u: 'min'};
    if (s < 172800) return {v: num(s / 3600, 3), u: 'h'};
    return {v: num(s / 86400, 3), u: 'días'};
  }

  /** Compara un radio en km con algo que se pueda imaginar. */
  function sizeText(km) {
    if (km < 100) return 'Cabe dentro de una ciudad grande.';
    if (km < 2e5) return '≈ ' + num(km / 6371, 3) + ' radios terrestres.';
    if (km < 1e8) return '≈ ' + num(km / 695700, 3) + ' radios solares.';
    return '≈ ' + num(km / 1.496e8, 3) + ' UA. La órbita de Neptuno mide 30 UA.';
  }

  /** Magnitudes derivadas de la masa M (en masas solares). */
  function quant(M) {
    var rs = RS_PER_MSUN_KM * M;
    return {
      rs: rs,                    // radio de Schwarzschild (km)
      shadow: 2.6 * rs,          // radio de la sombra ≈ 3√3/2 · Rs
      isco: 3 * rs,              // última órbita circular estable
      period: 4.545e-4 * M,      // periodo en la ISCO visto desde lejos (s)
      hawking: 6.17e-8 / M,      // temperatura de Hawking (K)
      rho: 1.844e19 / (M * M)    // densidad media dentro del horizonte (kg/m³)
    };
  }

  function massFromU(u) { return Math.pow(10, LOG_MIN + (u / SLIDER_STEPS) * (LOG_MAX - LOG_MIN)); }
  function massToU(M) { return Math.round((Math.log10(M) - LOG_MIN) / (LOG_MAX - LOG_MIN) * SLIDER_STEPS); }

  /** Radio visual del horizonte en la escena (unidades arbitrarias). */
  function rhFromM(M) {
    var t = (Math.log10(M) - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return 0.45 + 0.95 * Math.min(1, Math.max(0, t));
  }

  BH.physics = {
    SLIDER_STEPS: SLIDER_STEPS,
    num: num, fmt: fmt, fmtMass: fmtMass, fmtTime: fmtTime, sizeText: sizeText,
    quant: quant, massFromU: massFromU, massToU: massToU, rhFromM: rhFromM
  };
})(window.BH = window.BH || {});
