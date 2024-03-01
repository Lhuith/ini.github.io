import * as THREE from "three";
import * as WINDOW from "./modules/window.js";
import { three } from "./../dom.js";

import { ColorLog, HexToRgb } from "../utils.js";
import { HasLevel, LoadLevel } from "./levels.js";
import { GetThemeColorsAsRGB, getBackgroundColor } from "../controller.js";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
// import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
// import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
// import * as PASSES from "./shaders/passes.js";

let VIEWER, LEVEL, RENDERER, COMPOSER, RENDERPASS, CONTROLS;

let CurrentShaderPass;

ColorLog("Building Three", "a020f0");

LEVEL = LoadLevel("ini");
// LEVEL.initViewer(0, 1, 1, "o", 0.1);

RENDERER = new THREE.WebGLRenderer();
RENDERER.shadowMap.enabled = true;
RENDERER.shadowMap.type = THREE.PCFSoftShadowMap;
RENDERER.setAnimationLoop(animation);
RENDERER.setClearColor(new THREE.Color(...GetThemeColorsAsRGB()[0]), 0.0);
WINDOW.SetRendererToWindowSpecs(RENDERER);
three.appendChild(RENDERER.domElement);

LEVEL.init(THREE, RENDERER);

COMPOSER = new EffectComposer(RENDERER);

RENDERPASS = new RenderPass(LEVEL.scene, LEVEL.getViewer().camera);
COMPOSER.addPass(RENDERPASS);

// let ditherPass = new ShaderPass(PASSES.Pixelated);
// ditherPass.uniforms.resolution.value = new THREE.Vector2(
//   window.innerWidth,
//   window.innerHeight
// );
// COMPOSER.addPass(ditherPass);

// const outputPass = new OutputPass();
// COMPOSER.addPass(outputPass);

let pause = false;
three.addEventListener(
  "webgl_pause",
  (e) => {
    pause != pause;
  },
  false
);

three.addEventListener(
  "webgl_scene_change",
  (e) => {
    changeScene(e.levelName);
  },
  false
);

three.addEventListener(
  "webgl_theme",
  (e) => {
    console.log("setting theme colors");
  },
  false
);

let startStoreTime = 0;
let timeDifference = 0;

// animation
function animation(t) {
  // if (CONTROLLER.GetWebGLState()) {
  //   if (!CONTROLLER.GetWebGLTimeStoreState()) {
  //     CONTROLLER.WEBGL_SET_TIME_STORED(true);
  //     startStoreTime = t - timeDifference;
  //     timeDifference = 0;
  //   }
  //   return;
  // }

  // if (!CONTROLLER.GetWebGLTimeStoreState()) {
  //   CONTROLLER.WEBGL_SET_TIME_STORED(true);
  //   timeDifference = t - startStoreTime;
  // }

  LEVEL.update(t - timeDifference);
  // RENDERER.render(LEVEL.scene, VIEWER.camera);
  COMPOSER.render();
}

export const changeScene = function (name) {
  if (HasLevel(name)) {
    LEVEL = LoadLevel(name);
    RENDERPASS.scene = LEVEL.scene;
    RENDERPASS.camera = LEVEL.getViewer().camera;
    // clear old levels shader pass if exists
    if (CurrentShaderPass !== undefined) {
      COMPOSER.removePass(CurrentShaderPass);
      CurrentShaderPass = undefined;
    }
    // add new pass if exists
    if (LEVEL.pass !== undefined) {
      CurrentShaderPass = new LEVEL.pass(LEVEL.scene, VIEWER.camera, 512, 512);
      COMPOSER.addPass(CurrentShaderPass);
    }
  } else {
    console.warn(`level ${name} doesn't exist`);
  }
};

// Listeners
window.addEventListener(
  "resize",
  () => {
    // notify the renderer of the size change
    WINDOW.SetRendererToWindowSpecs(RENDERER);
    WINDOW.SetComposerToWindowSpecs(COMPOSER);
    // update the viewer camera
    LEVEL.getViewer().resizeCamera(WINDOW);
  },
  false
);
