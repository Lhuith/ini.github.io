export const capitalize = function (title) {
  return title[0].toUpperCase() + title.slice(1);
};

export const calculateDuration = function (start, end) {
  const startValues = start.split("/");
  let isPresent = false;
  if (end === "") {
    isPresent = true;
  }

  const endValues = end.split("/");

  let endYear = +endValues[1];
  if (isPresent) {
    endYear = new Date().getFullYear();
  }

  let endMonth = +endValues[0];
  if (isPresent) {
    endMonth = new Date().getMonth();
  }
  const yearDuration = endYear - +startValues[1];
  const monthDuration = Math.abs(endMonth - +startValues[0]);

  return `${yearDuration != 0 ? yearDuration + " yrs" : ""} ${
    monthDuration != 0 ? monthDuration + " mo" : ""
  } ${
    isPresent
      ? "[" + startValues[1] + " - present]"
      : yearDuration != 0
      ? "[" + startValues[1] + " - " + endValues[1] + "]"
      : "[" + startValues[1] + "]"
  }`;
};

export const ColorLog = function (m, text_color) {
  console.log(`%c${m}`, `color:#${text_color}`);
};

export const RandomRange = function (min, max) {
  return min + Math.random() * (max - min);
};

export const Normalize = function (min, max, value) {
  return (value - min) / (max - min);
};
export const Clamp = function (value, min, max) {
  return Math.min(Math.max(value, min), max);
};

/**
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
export function PRNGRandom(seed) {
  this._seed = seed % 2147483647;
  if (this._seed <= 0) this._seed += 2147483646;
}

/**
 * Returns a pseudo-random value between 1 and 2^32 - 2.
 */
PRNGRandom.prototype.next = function (min, max) {
  return (this._seed = ((this._seed * 16807) % 2147483647) * (max - min) + min);
};

/**
 * Returns a pseudo-random floating point number in range [0, 1).
 */
PRNGRandom.prototype.nextFloat = function (opt_minOrMax, opt_max) {
  // We know that result of next() will be 1 to 2147483646 (inclusive).
  return (this.next() - 1) / 2147483646;
};

export const HexToRgb = function (hex) {
  return hex
    .replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m, r, g, b) => "#" + r + r + g + g + b + b
    )
    .substring(1)
    .match(/.{2}/g)
    .map((x) => parseInt(x, 16) / 255);
};
