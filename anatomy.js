/* Esquema a escala (vista desde arriba) con las distancias en radios de Schwarzschild. */
(function (BH) {
  'use strict';

  var ITEMS = [
    {r: 8, name: 'Borde del disco', val: '8 Rs', ang: -60, y: 62},
    {r: 3, name: 'Última órbita (ISCO)', val: '3 Rs', ang: -30, y: 134},
    {r: 2.6, name: 'Sombra visible', val: '≈ 2,6 Rs', ang: -5, y: 206},
    {r: 1.5, name: 'Esfera de fotones', val: '1,5 Rs', ang: 20, y: 278},
    {r: 1, name: 'Horizonte', val: '1 Rs', ang: 45, y: 350}
  ];

  /** Dibuja el esquema dentro de un <svg viewBox="0 0 640 440">. `colors` = {mid, hot, cold}. */
  BH.drawAnatomy = function (svg, colors) {
    var cx = 200, cy = 220, sc = 24;
    var h = '<defs><radialGradient id="dg" cx="' + cx + '" cy="' + cy + '" r="' + (8 * sc) + '" gradientUnits="userSpaceOnUse">' +
      '<stop offset="' + (3 / 8) + '" stop-color="' + colors.hot + '"/>' +
      '<stop offset="0.6" stop-color="' + colors.mid + '"/>' +
      '<stop offset="1" stop-color="' + colors.cold + '" stop-opacity="0"/></radialGradient></defs>';
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (8 * sc) + '" fill="url(#dg)"/>';
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (3 * sc) + '" fill="#000"/>';
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (2.6 * sc) + '" fill="none" stroke="#e6e8f0" stroke-opacity=".55" stroke-dasharray="3 4"/>';
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (1.5 * sc) + '" fill="none" stroke="' + colors.hot + '" stroke-width="1.5"/>';
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + sc + '" fill="#000" stroke="#e6e8f0" stroke-width="1"/>';
    h += '<circle cx="' + cx + '" cy="' + cy + '" r="1.6" fill="#e6e8f0"/>';
    ITEMS.forEach(function (it) {
      var a = it.ang * Math.PI / 180, px = cx + it.r * sc * Math.cos(a), py = cy + it.r * sc * Math.sin(a);
      h += '<path d="M' + px.toFixed(1) + ' ' + py.toFixed(1) + ' L 410 ' + it.y + ' L 428 ' + it.y + '" fill="none" stroke="#e6e8f0" stroke-opacity=".5"/>';
      h += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="2.5" fill="#e6e8f0"/>';
      h += '<text x="434" y="' + (it.y - 3) + '" fill="#e6e8f0" font-size="19">' + it.name + '</text>';
      h += '<text class="mono" x="434" y="' + (it.y + 17) + '" fill="' + colors.mid + '" font-size="15">' + it.val + '</text>';
    });
    h += '<text class="mono" x="12" y="428" fill="#8e96ad" font-size="14">Vista desde arriba · 1 Rs = radio del horizonte</text>';
    svg.innerHTML = h;
  };
})(window.BH = window.BH || {});
