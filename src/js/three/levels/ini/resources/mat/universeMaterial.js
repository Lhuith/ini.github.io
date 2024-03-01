import { UniformsLib } from "three/src/renderers/shaders/UniformsLib.js";
import * as THREE from "three";
import {
  Dither8x8,
  DitherFunc,
  GammaFunc,
  nDotLClamped,
} from "../../../../shaders/shaderChunks";
import { GetThemeColorsAsRGB } from "../../../../../controller";

const themeColor = GetThemeColorsAsRGB()[3];
export const UniverseMaterialCheap = new THREE.ShaderMaterial({
  uniforms: THREE.UniformsUtils.merge([
    UniformsLib.lights,
    {
      time: { value: 1.0 },
    },
  ]),
  side: 1,
  transparent: true,
  // wireframe: true,
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
    ` 
    void main() {
       vec3 noise = vec3(max((fract(dot(sin(gl_FragCoord.xy), gl_FragCoord.xy)) - .99) * 100.0, 0.0));
      gl_FragColor = vec4(noise, noise.r) * vec4(${themeColor[0]}, ${themeColor[1]}, ${themeColor[2]}, 1.0);
    }`,
  ].join("\n"),
});
