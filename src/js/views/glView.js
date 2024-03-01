import { levels } from "../three/levels";
import { ColorLog } from "../utils";
import * as MARKUP from "./viewMarkUp";

export const buildGlView = function (glPage, mainMenu, data) {
  if (glPage.built) return;

  const glDom = glPage.element;
  ColorLog("Building GL View", "E9E4D4");

  levels.forEach((l) => {});

  glPage.built = true;
};
