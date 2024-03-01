// many many thanks to Maya, https://www.maya-ndljk.com/blog/threejs-basic-toon-shader
import * as THREE from "three";
import {
  Dither8x8,
  DitherFunc,
  GammaFunc,
  nDotLClamped,
} from "../../../../shaders/shaderChunks";

export const PlanetMaterial = function (
  cmap,
  hmap,
  col,
  side = THREE.FrontSide
) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsLib.lights,
      time: { value: 1.0 },
      map: { value: cmap },
      heightMap: { value: hmap },
      color: { value: col },
      useMap: { value: cmap === null ? 0.0 : 1.0 },
    },
    side: side,
    lights: true,
    vertexShader: [
      `
      #include <common>
      #include <shadowmap_pars_vertex>
      `,

      "varying vec2 vUv;",
      "varying vec3 vNormal;",
      "varying vec3 wWorld;",
      "varying vec3 vWNormal;",

      `uniform sampler2D heightMap;`,
      `uniform float useMap;`,

      "void main() {",
      `
      #include <beginnormal_vertex>
      #include <defaultnormal_vertex>

      #include <begin_vertex>

      #include <worldpos_vertex>
      #include <shadowmap_vertex> 

      vUv = uv;
      vec4 col = vec4(0.0);
      if(useMap == 1.0) {
        col = texture2D(heightMap, vUv);
      } else {
        col = vec4(0.0);
       }
      vec3 newPosition = position + normal * col.r * 200.0;
      
      vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0) ;
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 clipPosition = projectionMatrix * viewPosition;

      vNormal = normalize(normalMatrix * normal);
      vWNormal = normal.xyz;
      wWorld = (modelViewMatrix * vec4(position, 1.0)).xyz;
       
      gl_Position = clipPosition;
      `,
      "}",
    ].join("\n"),
    fragmentShader: [
      `
      #include <common>
      #include <packing>
      #include <lights_pars_begin>
      #include <shadowmap_pars_fragment>
      #include <shadowmask_pars_fragment>
      `,

      `${Dither8x8}`,
      `${DitherFunc}`,
      `${GammaFunc}`,

      `uniform sampler2D map;`,
      `uniform sampler2D heightMap;`,
      `uniform float useMap;`,
      `uniform vec3 color;`,

      `varying vec2 vUv;`,
      "varying vec3 vNormal;",
      "varying vec3 wWorld;",
      "varying vec3 vWNormal;",

      "void main() {",
      `
        // shadow map
        // thanks seanwasere: https://sbcode.net/threejs/directional-light-shadow/
        DirectionalLightShadow directionalShadow = directionalLightShadows[0];

        float shadow = getShadow(
          directionalShadowMap[0],
          directionalShadow.shadowMapSize,
          directionalShadow.shadowBias,
          directionalShadow.shadowRadius,
          vDirectionalShadowCoord[0]
        );
    
       vec4 col = vec4(0.0);
       if(useMap == 1.0) {
          col = texture2D(map, vUv);
       } else {
          col = vec4(color, 1.0);
       }
        // light position calculation based on position and not direction (direction to center basically)
        // float nDotL = dot(vNormal, normalize(-wWorld));
        ${nDotLClamped}
        vec4 lightDither =  dither(vec4(vec3(nDotL * shadow), nDotL * shadow), gl_FragCoord, 128.0);
        gl_FragColor = col * vec4(lightDither.rgb, nDotL * shadow) * clamp(nDotL*4.0 * shadow, 0.0, 1.0);
      `,
      ``,
      "}",
    ].join("\n"),
  });
};
