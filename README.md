# Agujero Negro Interactivo

Visor 3D de agujeros negros reales (Estelar, Cygnus X-1, Sagitario A*, M87*, NGC 4889, TON 618 y Phoenix A)
hecho con HTML, CSS, JavaScript y shaders GLSL sobre Three.js (WebGL).

## Cómo abrirlo

Abre `index.html` con doble clic en un navegador moderno. Necesita internet para cargar Three.js y las tipografías.

Si prefieres un servidor local (Python o Node):

```bash
python3 -m http.server 8000      # y abre http://localhost:8000
# o bien
npm start                        # usa npx serve
```

## Estructura

```
agujero-negro/
├── index.html          Estructura de la página
├── css/style.css       Diseño, paneles laterales, adaptación a pantallas
└── js/
    ├── physics.js      Fórmulas (Rs, sombra, ISCO, Hawking, densidad) y formato de cifras
    ├── models.js       Catálogo de modelos y paletas de color
    ├── shaders.js      GLSL: disco, halo, gas, chorros y estrellas con lente
    ├── scene.js        Escena Three.js, cámara orbital y API de control
    ├── labels.js       Etiquetas HTML ancladas a puntos 3D
    ├── anatomy.js      Esquema a escala (SVG)
    ├── ui.js           Modelos, ajustes, información y paneles
    └── main.js         Arranque
```

## Añadir un modelo

Agrega un objeto a `BH.MODELS` en `js/models.js`:

```js
{
  id: 'miModelo', name: 'Mi modelo', kind: 'Tipo de objeto',
  M: 1e8,                       // masa en masas solares
  distance: '≈ 100 millones de años luz',
  color: '#4aa3ff', tilt: 10, speed: 1, bright: 1, jets: false,
  phi: 1.3,                     // ángulo de cámara (1,5 ≈ de canto, 0,1 ≈ desde arriba)
  desc: 'Descripción corta.', fact: 'Un dato curioso.'
}
```

## Notas físicas

Las cifras corresponden a un agujero negro de Schwarzschild (sin rotación ni carga):

- Radio de Schwarzschild: Rs = 2GM/c² ≈ 2,953 km × (M / M☉)
- Sombra: ≈ 2,6 Rs · última órbita estable (ISCO): 3 Rs
- Temperatura de Hawking: ≈ 6,17 × 10⁻⁸ K × (M☉ / M)

La lente gravitacional del halo y de las estrellas usa una deflexión simplificada de masa puntual; es una aproximación artística.
