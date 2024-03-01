import { UniformsLib } from "three/src/renderers/shaders/UniformsLib.js";
import * as THREE from "three";
import {
  Dither8x8,
  DitherFunc,
  GammaFunc,
  nDotLClamped,
} from "../../../../shaders/shaderChunks";
import { GetThemeColorsAsRGB } from "../../../../../controller";

export const AtmosphereMaterialCheap = new THREE.ShaderMaterial({
  uniforms: THREE.UniformsUtils.merge([
    UniformsLib.lights,
    {
      time: { value: 1.0 },
      dusklight: { value: new THREE.Color(...GetThemeColorsAsRGB()[3]) },
      highlight: { value: new THREE.Color(...GetThemeColorsAsRGB()[2]) },
      fresnel: { value: 10 }, // RandomRange(0.1, 1.99)
      transition: { value: 0.01 }, // RandomRange(0.01, 0.05)
      thickness: { value: 1 }, //  RandomRange(0.0, 3.0)
      lookup: {
        value: new THREE.TextureLoader().load(
          "src/js/three/levels/laniverse/resources/effects/gradient2.png"
        ),
      },
    },
  ]),

  lights: true,
  transparent: true,
  // many thanks to Maya for ending my shader nightmares
  // https://www.maya-ndljk.com/blog/threejs-basic-toon-shader
  vertexShader: [
    `
      #include <common>
      #include <packing>
      #include <lights_pars_begin>
      `,

    "varying vec2 vUv;",
    "varying vec3 vNormal;",
    "varying vec3 vViewDir;",

    "void main() {",
    `
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 clipPosition = projectionMatrix * viewPosition;
        vUv = uv;

        vNormal = normalize(normalMatrix * normal);
        vViewDir = normalize(-viewPosition.xyz);
        
        gl_Position = clipPosition;
      `,

    "}",
  ].join("\n"),
  fragmentShader: [
    `
      #include <common>
      #include <packing>
      #include <lights_pars_begin>
      uniform sampler2D lookup;
    `,

    "uniform vec3 highlight;",
    "uniform vec3 dusklight;",
    "uniform float fresnel;",
    "uniform float transition;",
    "uniform float thickness;",

    "varying vec2 vUv;",
    "varying vec3 vNormal;",
    "varying vec3 vViewDir;",

    `${Dither8x8}`,
    `${DitherFunc}`,
    `${GammaFunc}`,
    // clamp(nDotL, 0.0, 1.0)
    ` 
        void main() {
          ${nDotLClamped}
          
          float incidence = acos(dot(directionalLights[0].direction, vNormal))/PI;
          
          float shade = 0.1 * (1.0 - incidence) + 0.9 * (1.0 - (clamp(incidence, 0.5, 0.5 + transition) - 0.5) / transition);
          
          float angleToViewer = clamp((sin(acos(dot(vNormal, vViewDir)))), 0.0, 1.0);

          float perspective = 0.3 + 0.2 * pow(angleToViewer, fresnel) + 2.0 * pow(angleToViewer, fresnel*20.0);

          float lighting = perspective * shade;
          
          vec2 gradient = vec2(incidence, 0.0);
	  
	        vec4 final = lighting * texture2D(lookup, gradient) * thickness;
          vec3 mix = mix(highlight, dusklight, incidence);
	
          gl_FragColor = vec4(mix, incidence);
        }`,
  ].join("\n"),
});
