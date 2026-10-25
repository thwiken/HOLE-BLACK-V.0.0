/* Shaders GLSL. Todas las distancias están en radios del horizonte (Rs). */
(function (BH) {
  'use strict';

  var NOISE = [
    'float hash(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }',
    'float noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);',
    ' return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),',
    '            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }',
    'float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }'
  ].join('\n');

  /* Halo: imagen deformada del disco trasero, anillo de fotones y resplandor. Siempre mira a la cámara. */
  var halo = {
    vertex: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragment: [
      'uniform vec3 uCold,uMid,uHot; uniform vec2 uAx; uniform float uEdge,uBright,uTime,uS,uLens;',
      'varying vec2 vUv;', NOISE,
      'void main(){',
      ' vec2 p = (vUv*2.0-1.0)*uS; float rr = length(p); float s = 2.6;',
      ' float x = rr - s; if(x < 0.0) discard;',
      ' vec2 dir = p/max(rr,1e-4);',
      ' float c = dot(dir,uAx);',
      ' float arch = pow(abs(c),2.2);',
      ' float f = mix(0.85, 0.10+1.3*arch, uEdge);',
      ' float ang = atan(p.y,p.x);',
      ' float n = 0.7+0.6*noise(vec3(cos(ang+uTime*0.25)*2.0, sin(ang+uTime*0.25)*2.0, rr*2.2));',
      ' float body = (exp(-x/0.40)*1.35 + exp(-x/1.5)*0.22)*f*n*uLens;',
      ' float ring = exp(-pow(x/0.07,2.0));',
      ' float glow = exp(-x/2.4)*0.14*(1.0-smoothstep(uS*0.55,uS*0.98,rr));',
      ' vec3 col = mix(uMid,uHot,exp(-x/0.35))*body;',
      ' col += mix(uHot,vec3(1.0),0.55)*ring*0.95;',
      ' col += uMid*glow;',
      ' gl_FragColor = vec4(col*uBright,1.0);',
      '}'
    ].join('\n')
  };

  /* Disco de acreción: giro kepleriano, turbulencia y brillo Doppler. */
  var disk = {
    vertex: [
      'varying vec2 vLocal; varying vec3 vWorld;',
      'void main(){ vLocal = position.xy; vec4 w = modelMatrix*vec4(position,1.0); vWorld = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }'
    ].join('\n'),
    fragment: [
      'uniform float uTime,uSpeed,uBright,uInner,uOuter; uniform vec3 uCold,uMid,uHot,uAxis;',
      'varying vec2 vLocal; varying vec3 vWorld;', NOISE,
      'void main(){',
      ' float r = length(vLocal);',
      ' float t = clamp((r-uInner)/(uOuter-uInner),0.0,1.0);',
      ' float ang = atan(vLocal.y,vLocal.x);',
      ' float a2 = ang - uTime*uSpeed*2.2/pow(r,1.5);',
      ' vec3 p = vec3(cos(a2)*r*0.9, sin(a2)*r*0.9, r*1.7);',
      ' float n = fbm(p*1.1);',
      ' float streak = fbm(vec3(cos(a2)*3.0, sin(a2)*3.0, r*9.0));',
      ' float dens = (0.55+0.9*n)*(0.7+0.6*streak);',
      ' float e = pow(1.0-t,1.7)*smoothstep(0.0,0.08,t)*dens;',
      ' vec3 radial = normalize(vWorld);',
      ' vec3 vel = normalize(cross(uAxis,radial));',
      ' vec3 vdir = normalize(cameraPosition - vWorld);',
      ' float beam = pow(1.0+0.65*dot(vel,vdir),2.2);',
      ' vec3 col = mix(uHot,uMid,smoothstep(0.0,0.35,t));',
      ' col = mix(col,uCold,smoothstep(0.3,1.0,t));',
      ' col *= e*beam*uBright*1.6;',
      ' col *= 1.0-smoothstep(0.85,1.0,t);',
      ' gl_FragColor = vec4(col,1.0);',
      '}'
    ].join('\n')
  };

  /* Gas en espiral: puntos que orbitan y caen hacia el borde interior. */
  var particles = {
    vertex: [
      'attribute float aSeed; uniform float uPR,uTime; uniform vec3 uMid,uHot; varying vec3 vCol; varying float vA;',
      'void main(){',
      ' vec4 mv = modelViewMatrix*vec4(position,1.0);',
      ' float t = clamp((length(position.xz)-3.0)/5.0,0.0,1.0);',
      ' vCol = mix(uHot,uMid,clamp(t*1.6,0.0,1.0));',
      ' vA = (0.45+0.55*aSeed)*(1.0-t*0.6);',
      ' gl_PointSize = (1.4+2.4*aSeed)*uPR*(26.0/-mv.z);',
      ' gl_Position = projectionMatrix*mv; }'
    ].join('\n'),
    fragment: [
      'uniform float uBright; varying vec3 vCol; varying float vA;',
      'void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.05,d);',
      ' gl_FragColor = vec4(vCol*a*vA*uBright*0.9,1.0); }'
    ].join('\n')
  };

  /* Chorros relativistas: dos conos translúcidos con flujo animado. */
  var jets = {
    vertex: [
      'varying vec3 vN; varying vec3 vV; varying float vH; varying float vAng;',
      'void main(){ vH = position.y/14.0+0.5; vAng = atan(position.z,position.x);',
      ' vec4 mv = modelViewMatrix*vec4(position,1.0);',
      ' vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz);',
      ' gl_Position = projectionMatrix*mv; }'
    ].join('\n'),
    fragment: [
      'uniform vec3 uMid,uHot; uniform float uBright,uTime; varying vec3 vN; varying vec3 vV; varying float vH; varying float vAng;',
      NOISE,
      'void main(){',
      ' float rim = pow(abs(dot(normalize(vN),normalize(vV))),1.2);',
      ' float flow = fbm(vec3(vAng*1.5, vH*6.0-uTime*1.2, 0.5));',
      ' float a = rim*pow(1.0-vH,1.6)*smoothstep(0.0,0.08,vH)*(0.45+flow)*uBright*0.9;',
      ' vec3 col = mix(uHot,uMid,vH)*a;',
      ' gl_FragColor = vec4(col,1.0); }'
    ].join('\n')
  };

  /* Estrellas de fondo. El vértice aplica la lente de una masa puntual:
     θ = ½(β + √(β² + 4θE²)), y amplifica el brillo cerca del anillo de Einstein. */
  var stars = {
    vertex: [
      'attribute float aSize; attribute float aPh; attribute vec3 aCol;',
      'uniform float uPR,uTime,uTE,uLens,uTwinkle; varying vec3 vCol; varying float vA;',
      'void main(){',
      ' vec4 mv = modelViewMatrix*vec4(position,1.0);',
      ' vec3 v = mv.xyz; float L = length(v); vec3 ds = v/L;',
      ' vec3 d0 = normalize((viewMatrix*vec4(0.0,0.0,0.0,1.0)).xyz);',
      ' float c = clamp(dot(ds,d0),-1.0,1.0); float mag = 1.0;',
      ' if(uLens>0.5 && c>0.0){',
      '  float beta = acos(c); vec3 e = ds-d0*c; float el = length(e);',
      '  e = el>1e-5 ? e/el : normalize(cross(d0,vec3(0.0,1.0,0.0))+vec3(1e-3,0.0,0.0));',
      '  float te = uTE; float th = 0.5*(beta+sqrt(beta*beta+4.0*te*te));',
      '  float u = max(beta/te,0.02);',
      '  mag = clamp((u*u+2.0)/(u*sqrt(u*u+4.0)),1.0,5.0);',
      '  ds = d0*cos(th)+e*sin(th); v = ds*L; }',
      ' gl_Position = projectionMatrix*vec4(v,1.0);',
      ' float tw = 1.0-uTwinkle*0.22*(0.5+0.5*sin(uTime*(1.0+aPh*0.6)+aPh*30.0));',
      ' gl_PointSize = aSize*uPR*(0.85+0.15*mag);',
      ' vCol = aCol; vA = tw*min(mag,2.6); }'
    ].join('\n'),
    fragment: [
      'varying vec3 vCol; varying float vA;',
      'void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.08,d);',
      ' gl_FragColor = vec4(vCol*a*vA,1.0); }'
    ].join('\n')
  };

  BH.shaders = {halo: halo, disk: disk, particles: particles, jets: jets, stars: stars};
})(window.BH = window.BH || {});
