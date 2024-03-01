import * as THREE from "three";
import { GetThemeColorsAsRGB } from "../../../../../controller";
import { Normalize, Clamp } from "../../../../../utils";

export const region = function (name, height, color) {
  this.name = name;
  this.height = height;
  this.color = color;
};

export const MapGenerator = function (
  octaves,
  persistance,
  lacunarity,
  noiseScale,
  offset,
  size,
  prng
) {
  const regions = [
    new region("water deep", 0, new THREE.Color(0x173f5a)),
    new region("water medium", 0.1, new THREE.Color(0x4698ce)),
    new region("water shallow", 0.3, new THREE.Color(0x67aad7)),
    new region("sand wet", 0.37, new THREE.Color(0xa57f3e)),
    new region("sand dry", 0.4, new THREE.Color(0xe5d5ba)),
    new region("grass", 0.41, new THREE.Color(0x5f9b49)),
    new region("high grass", 0.51, new THREE.Color(0x588f44)),
    new region("rocky", 0.6, new THREE.Color(0xae8262)),
    new region("rocky med", 0.65, new THREE.Color(0xcbb3a5)),
    new region("rocky high", 0.75, new THREE.Color(0x99969b)),
    new region("snowy", 0.86, new THREE.Color(0xf2f2ef)),
  ];

  // const regions = [
  //   new region("0", 0, new THREE.Color(...GetThemeColorsAsRGB()[0])),
  //   new region("1", 0.25, new THREE.Color(...GetThemeColorsAsRGB()[1])),
  //   new region("2", 0.5, new THREE.Color(...GetThemeColorsAsRGB()[2])),
  //   new region("3", 0.75, new THREE.Color(...GetThemeColorsAsRGB()[3])),
  // ];

  let noiseMap2D = GenerateNoise2DMap(
    size,
    size,
    noiseScale,
    octaves,
    persistance,
    lacunarity,
    offset,
    prng
  );

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // var img = loadImage("src/img/effects/dither_01.png").then((img) => {
  //   ctx.drawImage(img, 0, 0);
  //   let imageData = ctx.getImageData(0, 0, 300, 311);
  //   console.log(imageData);
  // });
  // clamped map
  const clampedMap = new Array();
  for (var x = 0; x < size; x++) {
    clampedMap[x] = new Array();
    for (var y = 0; y < size; y++) clampedMap[x][y] = 1;
  }
  // falloff map
  const falloffMap = GenerateFalloffMap(size);
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      clampedMap[x][y] = Clamp(noiseMap2D[x][y] - falloffMap[x][y], 0, 1);
    }
  }
  // color map
  const colorMap = new Array(size * size * 4);
  const heightMap = new Array(size * size * 4);

  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      let index = (y * size + x) * 4;
      let currentHeight = clampedMap[x][y];

      heightMap[index + 0] = currentHeight * 255;
      heightMap[index + 1] = currentHeight * 255;
      heightMap[index + 2] = currentHeight * 255;
      heightMap[index + 3] = 0; // alpha

      for (var i = 0; i < regions.length; i++) {
        if (currentHeight >= regions[i].height) {
          colorMap[index + 0] = regions[i].color.r * 255;
          colorMap[index + 1] = regions[i].color.g * 255;
          colorMap[index + 2] = regions[i].color.b * 255;
          colorMap[index + 3] = 255; // alpha
        }
      }
    }
  }
  // data texture
  let colorDataTexture = new THREE.DataTexture(
    Uint8Array.from(colorMap),
    size,
    size,
    THREE.RGBFormat,
    THREE.UnsignedByteType
  );
  colorDataTexture.needsUpdate = true;

  let heightDataTexture = new THREE.DataTexture(
    Uint8Array.from(heightMap),
    size,
    size,
    THREE.RGBFormat,
    THREE.UnsignedByteType
  );
  heightDataTexture.needsUpdate = true;
  return { color: colorDataTexture, height: heightDataTexture };
};

function GenerateFalloffMap(size) {
  const map = new Array();

  const a = 1,
    b = 5.2;

  for (var i = 0; i < size; i++) {
    map[i] = new Array();
    for (var j = 0; j < size; j++) {
      const value = parseFloat(
        Math.max(
          Math.abs((i / parseFloat(size)) * 2 - 1),
          Math.abs((j / parseFloat(size)) * 2 - 1)
        )
      );
      map[i][j] =
        Math.pow(value, a) / (Math.pow(value, a) + Math.pow(b - b * value, a));
    }
  }
  return map;
}

export const GenerateNoise2DMap = function (
  mapWidth,
  mapHeight,
  scale,
  octaves,
  persistance,
  lacunarity,
  offset,
  prng
) {
  const noiseMap = new Array();
  const octaveOffsets = new Array(octaves);

  let maxPossibleHeight = 0;
  let amplitude = 1;
  let frequency = 1;

  for (var i = 0; i < octaves; i++) {
    var offsetX = prng.next(-100000, 100000) + offset.x;
    var offsetY = prng.next(-100000, 100000) - offset.y;
    octaveOffsets[i] = new THREE.Vector2(offsetX, offsetY);
    maxPossibleHeight += amplitude;
    amplitude *= persistance;
  }

  scale = scale <= 0 ? 0.0001 : scale;

  let maxLocalNoiseHeight = Number.MIN_VALUE;
  let minLocalNoiseHeight = Number.MAX_VALUE;

  for (var x = 0; x < mapHeight; x++) {
    noiseMap[x] = new Array();
    for (var y = 0; y < mapWidth; y++) {
      noiseMap[x][y] = 0;
    }
  }

  for (var y = 0; y < mapHeight; y++) {
    for (var x = 0; x < mapWidth; x++) {
      amplitude = 1;
      frequency = 1;
      let noiseHeight = 0;

      for (var i = 0; i < octaves; i++) {
        const sampleX =
          ((x - mapWidth / 2 + octaveOffsets[i].x) / scale) * frequency;
        const sampleY =
          ((y - mapHeight / 2 + octaveOffsets[i].y) / scale) * frequency;

        //Correct Noise Value Range
        var perlinValue = noise.perlin2(sampleX, sampleY);

        noiseHeight += perlinValue * amplitude;
        amplitude *= persistance;
        frequency *= lacunarity;
      }
      if (noiseHeight > maxLocalNoiseHeight) {
        maxLocalNoiseHeight = noiseHeight;
      }
      if (noiseHeight < minLocalNoiseHeight) {
        minLocalNoiseHeight = noiseHeight;
      }
      noiseMap[x][y] = noiseHeight;
    }
  }

  for (var y = 0; y < mapHeight; y++) {
    for (var x = 0; x < mapWidth; x++) {
      noiseMap[x][y] = Normalize(
        minLocalNoiseHeight,
        maxLocalNoiseHeight,
        noiseMap[x][y]
      );
    }
  }

  return noiseMap;
};
