import { RandomRange, ColorLog, PRNGRandom } from "../../../utils";
import { level } from "../levelModel";
import {
  CalculateOrbit,
  CreateRockyBelt,
  DrawOrbit,
} from "./resources/js/orbit";
import { GetThemeColorsAsRGB } from "../../../controller";
import { PlanetMaterial } from "./resources/mat/planetMaterial";
import { AtmosphereMaterialCheap } from "./resources/mat/atmosphereMaterial";

import { MapGenerator } from "./resources/js/utils";
import { Vector3 } from "three";
import { UniverseMaterialCheap } from "./resources/mat/universeMaterial";

//Again Much Credit To The Folks At Qt:
//https://doc.qt.io/qt-5/qt3d-planets-qml-planets-js.html
// radius - planet radius in millions of meters
// tilt - planet axis angle
// N1 N2 - longitude of the ascending node
// i1 i2 - inclination to the ecliptic (plane of the Earth's orbit)
// w1 w2 - argument of perihelion
// a1 a2 - semi-major axis, or mean distance from Sun
// e1 e2 - eccentricity (0=circle, 0-1=ellipse, 1=parabola)
// M1 M2 - mean anomaly (0 at perihelion; increases uniformly with time)
// period - sidereal rotation period
// centerOfOrbit - the planet in the center of the orbit
// (orbital elements based on http://www.stjarnhimlen.se/comp/ppcomp.html)
//i1: 115.1454

let seed = 1;
const objList = [];

export const buildIniLevel = function (THREE) {
  ColorLog("Building Solar System 🌍", "ffd300");

  // const gridHelper = new THREE.GridHelper(size, divisions);
  // objList.push(gridHelper);

  let universe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(10000, 3),
    UniverseMaterialCheap
  );
  objList.push(universe);
  // !sun
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  let sunData = {
    radius: 0, // not needed
    tilt: 90, // planet tilt?
    n1: 1, //  y tilt , // n2: 0 y angle end point, leave 0 to close the loop
    i1: 0, // x tilt, i2: 0, // x angle end point, leave 0 to close the loop
    a1: 0.05, // ring radius
    a2: 0, // loop connection of offset
    e1: 0, // ellipsoid value,     e2: 0, // no touchy
    period: 100,
    obj: sun,
    speed: 1,
  };
  {
    sun.castShadow = true;
    sun.shadow.mapSize.width = 512;
    sun.shadow.mapSize.height = 512;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 10000;

    sun.shadow.camera.left = -1000;
    sun.shadow.camera.right = 1000;
    sun.shadow.camera.bottom = -1000;
    sun.shadow.camera.top = 1000;

    sun.shadow.camera.updateProjectionMatrix();

    objList.push(sun);

    let sunObj = new THREE.Mesh(
      new THREE.IcosahedronGeometry(100, 3),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 0) })
    );
    sunObj.position.set(sun.position.x, sun.position.y, sun.position.z);
    objList.push(sunObj);
  }

  const helper = new THREE.CameraHelper(sun.shadow.camera);
  // objList.push(helper);

  // TODO store/use seed for map values
  let prng = new PRNGRandom(seed);

  let systems = [];
  for (let i = 0; i < Math.ceil(RandomRange(1, 1)); i++) {
    let lastA1 = 1;
    if (i != 0) {
      lastA1 = systems[i - 1].a1 + RandomRange(0.1, 0.5);
    }
    systems.push(makeSystem(THREE, prng, sun, new Vector3(0, 0, 0), lastA1));
  }

  const l = new level(THREE, ...objList);

  l.initViewer(0, 1, 1, "o", 0.2);
  l.useController = true;
  // l.viewer.camera.lookAt(systems[0].planet);

  l.start(function (THREE, RENDERER) {
    l.initController(RENDERER.domElement);
  });

  l.animate(function (t) {
    systems.forEach((s) => {
      s.update(t);
    });

    CalculateOrbit(
      sunData,
      sun,
      new Vector3(0, 0, 0),
      (t / 1000) * sunData.speed,
      (t / 1000) * sunData.speed,
      true
    );
  });

  // l.pass = StarryPass;
  return l;
};

const makeSystem = function (THREE, prng, sun, offset, a1Offset) {
  const orbits = [];

  let theme = GetThemeColorsAsRGB();

  let planetSize = RandomRange(600, 600);
  let planetTilt = RandomRange(-180, 180);

  let maps = MapGenerator(
    Math.round(RandomRange(2, 6)),
    RandomRange(0.65, 0.85),
    RandomRange(1.9, 2.2),
    RandomRange(10, 200),
    new THREE.Vector2(0, 0),
    512,
    prng
  );

  let planet = new THREE.Mesh(
    new THREE.OctahedronGeometry(planetSize, 50),
    PlanetMaterial(maps.color, maps.height, new THREE.Color())
  );

  let planetData = {
    radius: 0, // not needed
    tilt: 0, // planet tilt?
    n1: RandomRange(-90, 90), //  y tilt , // n2: 0 y angle end point, leave 0 to close the loop
    i1: RandomRange(-90, 90), // x tilt, i2: 0, // x angle end point, leave 0 to close the loop
    a1: 0, //0.7 + a1Offset, // ring radius
    a2: 0, // loop connection of offset
    e1: RandomRange(0.01, 0.02), // ellipsoid value,     e2: 0, // no touchy
    period: RandomRange(50, 250),
    obj: planet,
    speed: RandomRange(0.01, 0.2),
  };
  planet.castShadow = true;
  planet.receiveShadow = true;
  planet.position.set(offset.x, offset.y, offset.z);
  let planetOrbit = DrawOrbit(
    planetData,
    planet.position,
    new THREE.Color(...theme[3]),
    0
  );
  // orbits.push(orbit);
  objList.push(planetOrbit);
  objList.push(planet);

  sun.target = planet;

  // atmosphere
  let min = planetSize + 150;
  let atmosphereSize = RandomRange(min, min + 0.1);
  let atmosphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(atmosphereSize, 10),
    AtmosphereMaterialCheap
  );
  // planet.add(atmosphere);

  // moons
  const moons = [];
  for (let i = 0; i < RandomRange(0, 6); i++) {
    let themeColor = theme[Math.trunc(RandomRange(1, 4))];
    let size = RandomRange(0.1, planetSize / 6);
    let speed = RandomRange(0.1, 0.5) * (RandomRange(0, 1) > 0.5 ? -1 : 1);

    let a1Min = planetSize / 1000;
    let a1 = RandomRange(a1Min, a1Min + 5);
    moons.push({
      radius: 0, // not needed
      tilt: 0, // planet tilt?
      n1: RandomRange(-90, 90), //  y tilt , // n2: 0 y angle end point, leave 0 to close the loop
      i1: RandomRange(-90, 90), // x tilt, i2: 0, // x angle end point, leave 0 to close the loop
      a1: a1, // ring radius
      a2: 0, // loop connection of offset
      e1: 0, //RandomRange(0, 0.8) * a1, // ellipsoid value,     e2: 0, // no touchy
      period: 1,
      moonSize: size * a1,
      obj: new THREE.Mesh(
        new THREE.IcosahedronGeometry(size, 1),
        PlanetMaterial(null, null, new THREE.Color(...themeColor), 0)
      ),
      material: new THREE.MeshBasicMaterial(),
      selected: false,
      moonOrbit: 0,
      speed: (speed == 0 ? 1 : speed) * a1,
      inMoon: false,
      text: false,
    });
    objList.push(moons[i].obj);
    moons[i].obj.castShadow = true;
    moons[i].obj.receiveShadow = true;

    let orbit = DrawOrbit(
      moons[i],
      new THREE.Vector3(0, 0, 0),
      new THREE.Color(...themeColor),
      i
    );

    orbits.push(orbit);
    objList.push(orbit);
  }

  // rings
  const rings = [];
  let themeColor = GetThemeColorsAsRGB();

  if (RandomRange(0, 10) >= 5) {
    for (let i = 0; i < Math.ceil(RandomRange(0, 6)); i++) {
      let isFlat = RandomRange(0, 10) > 5 ? true : false;

      let innerSize =
        (i != 0 ? rings[i - 1].a3 + RandomRange(1, 200) : atmosphereSize + 20) +
        RandomRange(0, 25);

      let outerSize = innerSize + RandomRange(60, 300);

      rings.push({
        radius: 1.5424,
        tilt:
          RandomRange(0, 10) > 5
            ? i != 0
              ? rings[i - 1].tilt
              : planetTilt
            : planetTilt + RandomRange(-10, 10),
        n1: 125.1228,
        n2: 0,
        i1: 0,
        i2: 0,
        w1: 360,
        w2: 0.27,
        a1: isFlat
          ? innerSize
          : RandomRange(innerSize / 1000 + 0.01, innerSize / 1000 + 0.01),
        a2: 0,
        a3: outerSize,
        a4: 0,
        e1: 0,
        e2: 0,
        isFlat: isFlat,
        M1: 115.3654,
        M2: 13.0649929509,
        period: 2,
        obj: new THREE.Object3D(),
        speed: RandomRange(0.01, 0.05),
        numAstros: 0,
        list: [],
      });

      if (isFlat) {
        rings[i].obj = new THREE.Mesh(
          new THREE.RingGeometry(rings[i].a1, rings[i].a3, 32, 1, 10),
          // new THREE.MeshBasicMaterial({
          //   side: THREE.DoubleSided,
          //   color: new THREE.Color(...themeColor[Math.trunc(RandomRange(1, 4))]),
          // })
          PlanetMaterial(
            null,
            null,
            new THREE.Color(...themeColor[Math.trunc(RandomRange(1, 4))])
          ),
          THREE.DoubleSide
        );
      } else {
        CreateRockyBelt(
          rings[i],
          new THREE.Vector3(0, 0, 0),
          themeColor,
          RandomRange(15, 60)
        );
      }
      rings[i].obj.castShadow = true;
      rings[i].obj.receiveShadow = true;
      objList.push(rings[i].obj);
    }
  }

  return {
    planet: planet,
    a1: planetData.a1,
    update: function (t) {
      moons.forEach((m) => {
        CalculateOrbit(m, m.obj, planet.position, (t / 1000) * m.speed, t * 1);
      });
      orbits.forEach((m) => {
        let pos = planet.position;
        m.position.set(pos.x, pos.y, pos.z);
      });
      rings.forEach((r) => {
        let pos = planet.position;
        r.obj.position.set(pos.x, pos.y, pos.z);
        CalculateOrbit(
          r,
          r.obj,
          null,
          (t / 1000) * r.speed,
          (t / 1000) * r.speed,
          false
        );
      });
      CalculateOrbit(
        planetData,
        planet,
        new THREE.Vector3(0, 0, 0),
        (t / 1000) * planetData.speed,
        (t / 1000) * planetData.speed,
        true
      );
    },
  };
};
