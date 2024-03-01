import { buildTestLevel } from "./levels/testLevel";
import * as THREE from "three";
import { buildWelcomeLevel } from "./levels/welcomeLevel";
import { ColorLog } from "../utils";
import { buildIniLevel as buildIniLevel } from "./levels/ini/iniLevel";
import { buildSpectrumLevel } from "./levels/spectrumLevel";

export let levels = new Map();

export const RegisterLevel = function (key, buildFunc) {
  levels.set(key, {
    level: null,
    build: buildFunc,
  });
};

RegisterLevel("welcome", buildWelcomeLevel);
RegisterLevel("test", buildTestLevel);
RegisterLevel("ini", buildIniLevel);
RegisterLevel("spectrum", buildSpectrumLevel);

export const HasLevel = function (l) {
  return levels.has(l);
};

export const LoadLevel = function (l) {
  if (levels.has(l)) {
    const levelState = levels.get(l);

    if (levelState.level === null) {
      levelState.level = levelState.build(THREE);
    }

    return levelState.level;
  }
};
