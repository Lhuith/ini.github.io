import * as THREE from "three";
import { RandomRange } from "../../../../../utils";

//Credit to https://doc.qt.io/qt-5/qtcanvas3d-threejs-planets-planets-js.html
//For the Orbital Math
function returnOrbitPosition(data, index, inner, centre, replaceW) {
  var a;
  var w2;
  w2 = replaceW == true ? data.NumAstros / 1000 : data.w2;

  a = data.a1 + data.a2 * index;
  // if (inner) {
  //   a = data["a3"] + data["a4"] * index;
  // }

  // Calculate the planet orbital elements from the current time in days
  var n = ((data.n1 + 0 * index) * Math.PI) / 180;
  var i = ((data.i1 + 0 * index) * Math.PI) / 180;
  var w = ((318.0634 + 0.1643573223 * index) * Math.PI) / 180;
  var e = data.e1 + 0 * index;
  var m = ((115.3654 + 13.0649929509 * index) * Math.PI) / 180;

  var em = m + e * Math.sin(m) * (1.0 + e * Math.cos(m));
  var xv = a * (Math.cos(em) - e);
  var yv = a * (Math.sqrt(1.0 - e * e) * Math.sin(em));
  var v = Math.atan2(yv, xv);
  // Calculate the distance (radius)
  var r = Math.sqrt(xv * xv + yv * yv);
  // From http://www.davidcolarusso.com/astro/
  // Modified to compensate for the right handed coordinate system of OpenGL
  var xh =
    r *
    (Math.cos(n) * Math.cos(v + w) -
      Math.sin(n) * Math.sin(v + w) * Math.cos(i));

  var zh =
    -r *
    (Math.sin(n) * Math.cos(v + w) +
      Math.cos(n) * Math.sin(v + w) * Math.cos(i));

  var yh = r * (Math.sin(w + v) * Math.sin(i));

  return [centre.x + xh * 1000, centre.y + yh * 1000, centre.z + zh * 1000];
}

export const DrawOrbit = function (data, centre, col, i) {
  var segmentCount = 36;
  const points = [];
  for (var i = 0; i < segmentCount; i++) {
    points.push(
      new THREE.Vector3(...returnOrbitPosition(data, i, false, centre))
    );
  }

  let line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: col,
      // dashSize: 5 * data.a1,
      // gapSize: 10 * data.a1,
    })
  );
  line.computeLineDistances();
  return line;
};

export const LoadAsNearestFilter = function (loader, url) {
  let t = loader.load(url);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return t;
};

export const CreateRockyBelt = function (data, centre, color, size) {
  var textureLoader = new THREE.TextureLoader();

  const astroidSprites = [];
  for (let i = 1; i < 6; i++) {
    astroidSprites.push(
      LoadAsNearestFilter(
        textureLoader,
        `src/js/three/levels/laniverse/resources/img/astoriod_0${i}.png`
      )
    );
  }

  const isMessy = (0, 10) > 5 ? true : false;
  data.NumAstros = Math.floor(RandomRange(10, 300));
  for (var i = 0; i < data.NumAstros; i++) {
    const mat = new THREE.SpriteMaterial({
      map: astroidSprites[
        Math.round(RandomRange(0, astroidSprites.length - 1))
      ],
      color: new THREE.Color(...color[Math.trunc(RandomRange(1, 4))]),
    });

    const asto = new THREE.Sprite(mat);
    asto.scale.set(size, size, 1);

    let v = returnOrbitPosition(data, i, false, centre, true);

    let wobbleRange = 100;
    if (isMessy) {
      asto.position.set(
        v[0] + RandomRange(-wobbleRange, wobbleRange),
        v[2] + RandomRange(-wobbleRange, wobbleRange),
        v[1] + RandomRange(-wobbleRange, wobbleRange)
      );
    } else {
      asto.position.set(v[0], v[2], v[1]);
    }
    asto.castShadow = true;
    data.obj.add(asto);
    data.list.push(asto);
  }
};

export const CalculateOrbit = function (
  data,
  object,
  centre,
  index,
  tiltRotation,
  calculatePosition = true
) {
  // Calculate and apply the appropriate axis tilt to the bodies
  // and rotate them around the axis
  // object.rotation.order = "XYZ";
  object.rotation.x = (data.tilt * Math.PI) / 180;
  object.rotation.y = 0;
  object.rotation.z = (tiltRotation / data.period) * 2 * Math.PI;

  if (calculatePosition) {
    object.position.set(...returnOrbitPosition(data, index, false, centre));
  }
};
