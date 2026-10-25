/* Etiquetas HTML ancladas a puntos 3D de la escena. */
(function (BH) {
  'use strict';

  BH.createLabels = function (api, container) {
    var enabled = true;
    var defs = [
      {text: 'Sombra · 2,6 Rs', pt: function (o) {
        var s = 2.6 * api.rhEff();
        return o.right.clone().multiplyScalar(Math.cos(2.35) * s).add(o.up.clone().multiplyScalar(Math.sin(2.35) * s));
      }},
      {text: 'ISCO · 3 Rs', pt: function () {
        return api.diskGroup.localToWorld(new THREE.Vector3(3 * Math.sin(1.35), 0, 3 * Math.cos(1.35)));
      }},
      {text: 'Disco de acreción', pt: function () {
        return api.diskGroup.localToWorld(new THREE.Vector3(6.2 * Math.sin(-0.9), 0, 6.2 * Math.cos(-0.9)));
      }},
      {text: 'Chorro relativista', jet: true, pt: function () {
        return api.diskGroup.localToWorld(new THREE.Vector3(0, 10, 0));
      }}
    ];

    defs.forEach(function (d) {
      var el = document.createElement('div');
      el.className = 'tag r';
      el.innerHTML = '<span class="dot"></span><span class="txt"></span>';
      el.lastChild.textContent = d.text;
      container.appendChild(el);
      d.el = el;
    });

    var tv = new THREE.Vector3(), fwd = new THREE.Vector3();

    function update() {
      var W = api.stage.clientWidth, H = api.stage.clientHeight, cam = api.camera;
      var o = {
        right: new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion),
        up: new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion)
      };
      fwd.copy(cam.position).negate().normalize();
      defs.forEach(function (d) {
        var show = enabled && (!d.jet || api.state.jets);
        var p = d.pt(o);
        var depth = p.dot(fwd), perp = p.clone().addScaledVector(fwd, -depth).length();
        if (depth > 0 && perp < 2.6 * api.rhEff() * 1.03 && !d.jet) show = false;   // detrás de la sombra
        tv.copy(p).project(cam);
        var x = (tv.x * 0.5 + 0.5) * W, y = (-tv.y * 0.5 + 0.5) * H;
        if (tv.z > 1 || x < 8 || x > W - 8 || y < 8 || y > H - 48) show = false;
        d.el.style.opacity = show ? '1' : '0';
        d.el.className = 'tag ' + (x < W * 0.5 ? 'l' : 'r');
        d.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
    }

    api.frameHooks.push(update);
    return {setVisible: function (on) { enabled = on; }};
  };
})(window.BH = window.BH || {});
