/* Arranque: crea la escena, las etiquetas y la interfaz. */
(function (BH) {
  'use strict';

  var stage = document.getElementById('stage');
  var canvas = document.getElementById('gl');

  var scene = BH.createScene(stage, canvas);     // null si no hay WebGL
  var labels = scene ? BH.createLabels(scene, document.getElementById('tags')) : null;

  if (!scene) {
    canvas.hidden = true;
    document.getElementById('nogl').hidden = false;
  }

  BH.initUI(scene, labels);
  if (scene) scene.start();
})(window.BH = window.BH || {});
