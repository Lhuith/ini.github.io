import { UniformsLib } from "three/src/renderers/shaders/UniformsLib.js";
import * as THREE from "three";
import {
  Dither8x8,
  DitherFunc,
  GammaFunc,
  LightStructDefine,
  nDotL,
  nDotLClamped,
} from "../../shaders/shaderChunks";

export const DepthMaterial = new THREE.ShaderMaterial({
  uniforms: THREE.UniformsUtils.merge([
    UniformsLib.lights,
    {
      time: { value: 1.0 },
      tDepth: { value: null },
      tDiffuse: { value: null },
      cameraNear: { value: null },
      cameraFar: { value: null },
    },
  ]),

  // for the cheap atmosphere shader
  // Credit to davidr : https://lightshaderdevlog.wordpress.com/source-code/-->
  vertexShader: [
    `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }


    `,
  ].join("\n"),
  fragmentShader: [
    `
      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth;
      uniform float cameraNear;
      uniform float cameraFar;

      float readDepth( sampler2D depthSampler, vec2 coord ) {
				float fragCoordZ = texture2D( depthSampler, coord ).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			}

      void main() {
        // vec3 diffuse = texture2D()
        float depth = readDepth(tDepth, vUv);

        gl_FragColor.rgb = 1.0 - vec3( depth );
				gl_FragColor.a = 1.0;
      }

    `,
  ].join("\n"),
});
