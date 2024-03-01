import { Dither } from "../shaders/passes";
import { level } from "./levelModel";

export const buildWelcomeLevel = function (THREE) {
  const size = 20;
  const increment = 5;
  let cubes = [];

  for (let i = 0; i < size; i++) {
    cubes.push(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          i == 0 ? 1 : i * increment,
          i == 0 ? 1 : i * increment,
          i == 0 ? 1 : i * increment
        ),
        new THREE.MeshNormalMaterial({ wireframe: i != 0 ? true : false })
      )
    );
  }
  const welcome = new level(THREE, ...cubes);
  welcome.initViewer(0, 0, 150, "p");

  const x = 3000;
  const y = 2000;
  welcome.update = function (t) {
    for (let i = 0; i < size; i++) {
      cubes[i].rotation.x = t / x / (i == 0 ? 1 : i);
      cubes[i].rotation.y = t / y / (i == 0 ? 1 : i);
    }
  };

  return welcome;
};
