import { UniformsLib } from "three";
import { GetThemeColorsAsRGB } from "../../controller";
import { Dither8x8, DitherFunc } from "./shaderChunks";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const blackToWhiteThreshold = 0.2;
export const blackAndWhite = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "vUv = uv;",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}",
  ].join("\n"),
  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "varying vec2 vUv;",

    "void main() ",
    "{",
    "vec4 color = texture2D(tDiffuse, vUv);",

    "float colLength = length(color.rgb);",

    "vec3 grayScale = vec3(0.5, 0.5, 0.5);",
    "vec4 colorGray = vec4(vec3(dot(color.rgb, grayScale.rgb)), color.a);",

    `if(colorGray.r <= ${blackToWhiteThreshold}) {
      discard;
    }`,

    `gl_FragColor = colorGray;`,
    "}",
  ].join("\n"),
};

let backgroundColorRGB = GetThemeColorsAsRGB()[0];
export const Dither = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    divisor: { value: 64.0 },
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "vUv = uv;",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}",
  ].join("\n"),
  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "uniform float divisor;",
    "varying vec2 vUv;",

    `${Dither8x8}`,
    `${DitherFunc}`,

    "void main() {",
    "gl_FragColor = dither(texture2D(tDiffuse, vUv), gl_FragCoord, divisor);",
    "}",
  ].join("\n"),
};

// let backgroundColorRGB = GetThemeColorsAsRGB()[0];
export const Pixelated = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0.0 },
    resolution: { value: 0.0 },
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "vUv = uv;",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}",
  ].join("\n"),
  fragmentShader: [
    `
    

    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    varying vec2 vUv;

    // sRGB to Linear.
    // Assuming using sRGB typed textures this should not be needed.
    // float ToLinear1(float c){return(c<=0.04045)?c/12.92:pow((c+0.055)/1.055,2.4);}
    // vec3 ToLinear(vec3 c){return vec3(ToLinear1(c.r),ToLinear1(c.g),ToLinear1(c.b));}


    vec2 uv_cstantos( vec2 uv, vec2 res ){
    vec2 pixels = uv * res;

    // Updated to the final article
    vec2 alpha = 0.7 * fwidth(pixels);
    vec2 pixels_fract = fract(pixels);
    vec2 pixels_diff = clamp( .5 / alpha * pixels_fract, 0.0, .5 ) +
                       clamp( .5 / alpha * (pixels_fract - 1.0) + .5, 0.0, .5 );
    pixels = floor(pixels) + pixels_diff;
    return pixels / res;
  }

  vec2 uv_klems( vec2 uv, vec2 texture_size ) {
            
    vec2 pixels = uv * texture_size + 0.5;
    
    // tweak fractional value of the texture coordinate
    vec2 fl = floor(pixels);
    vec2 fr = fract(pixels);
    vec2 aa = fwidth(pixels) * 0.75;

    fr = smoothstep( vec2(0.5) - aa, vec2(0.5) + aa, fr);
    
    return (fl + fr - 0.5) / texture_size;
}

  vec2 uv_nearest( vec2 uv, vec2 texture_size ) {
    vec2 pixel = uv * texture_size;
    pixel = floor(pixel) + .5;

    return pixel / texture_size;
  }
  
  vec2 uv_iq( vec2 uv, vec2 texture_size ) {
    vec2 pixel = uv * texture_size;

    vec2 seam = floor(pixel + 0.5);
    vec2 dudv = fwidth(pixel);
    pixel = seam + clamp( (pixel - seam) / dudv, -0.5, 0.5);
    
    return pixel / texture_size;
}

vec2 uv_aa_linear( vec2 uv, vec2 res, float width ) {
    vec2 pixels = uv * res;
    
    vec2 pixels_floor = floor(pixels + 0.5);
    vec2 pixels_fract = clamp( (pixels - pixels_floor) / fwidth(pixels) / width, -0.5, 0.5);

    return (pixels_floor + pixels_fract) / res;
}

vec2 uv_aa_smoothstep( vec2 uv, vec2 res, float width ) {
    vec2 pixels = uv * res;
    
    vec2 pixels_floor = floor(pixels + 0.5);
    vec2 pixels_fract = fract(pixels + 0.5);
    vec2 pixels_aa = fwidth(pixels) * width * 0.5;
    pixels_fract = smoothstep( vec2(0.5) - pixels_aa, vec2(0.5) + pixels_aa, pixels_fract );
    
    return (pixels_floor + pixels_fract - 0.5) / res;
}
    // vec3 Fetch(vec2 pos, vec2 off){
    //   pos= floor( pos * res + off ) / res;
    //   if(max(abs(pos.x-0.5),abs(pos.y-0.5))>0.5) return vec3(0.0,0.0,0.0);
    //   return (texture2D(tDiffuse, pos.xy,-16.0).rgb);
    // }
    `,

    `
    void main() {
        vec2 r = vec2((resolution.x/3.0),(resolution.y/3.0));

        // gl_FragColor = vec4(uv_nearest(gl_FragCoord.xy, resolution.xy, vec2(0.0, 0.0)), 1.0);
        gl_FragColor = texture2D(tDiffuse, uv_aa_smoothstep(vUv, r, 1.0));
    }
    `,
  ].join("\n"),
};
