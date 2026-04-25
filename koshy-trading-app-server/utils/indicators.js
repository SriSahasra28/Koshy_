/**
 * Server-side indicator calculations.
 * Single source of truth — frontend never calculates indicators.
 *
 * Strategy: check Redis for pre-calculated values (from Python talib) first,
 * fall back to JS computation for params not in Redis.
 */

/**
 * Parabolic SAR — replicates talib.SAR behavior.
 */
function calculatePSAR(high, low, close, af0, maxAf) {
  const n = high.length;
  if (n < 2) return new Array(n).fill(0);

  const output = new Array(n).fill(0);

  let isLong = high[1] > high[0];
  let currentAf = af0;
  let sar, ep;

  if (isLong) {
    sar = low[0];
    ep = high[0];
  } else {
    sar = high[0];
    ep = low[0];
  }

  // Bar 1: update EP only
  if (isLong) {
    if (high[1] > ep) ep = high[1];
    if (low[1] < sar) {
      isLong = false;
      sar = ep;
      ep = low[1];
      currentAf = af0;
    }
  } else {
    if (low[1] < ep) ep = low[1];
    if (high[1] > sar) {
      isLong = true;
      sar = ep;
      ep = high[1];
      currentAf = af0;
    }
  }
  output[1] = sar;

  for (let i = 2; i < n; i++) {
    sar = sar + currentAf * (ep - sar);

    if (isLong) {
      sar = Math.min(sar, low[i - 1]);
      if (i >= 3) sar = Math.min(sar, low[i - 2]);

      if (low[i] <= sar) {
        isLong = false;
        sar = ep;
        sar = Math.max(sar, high[i - 1]);
        if (i >= 3) sar = Math.max(sar, high[i - 2]);
        currentAf = af0;
        ep = low[i];
      } else {
        if (high[i] > ep) {
          ep = high[i];
          currentAf = Math.min(currentAf + af0, maxAf);
        }
      }
    } else {
      sar = Math.max(sar, high[i - 1]);
      if (i >= 3) sar = Math.max(sar, high[i - 2]);

      if (high[i] >= sar) {
        isLong = true;
        sar = ep;
        sar = Math.min(sar, low[i - 1]);
        if (i >= 3) sar = Math.min(sar, low[i - 2]);
        currentAf = af0;
        ep = high[i];
      } else {
        if (low[i] < ep) {
          ep = low[i];
          currentAf = Math.min(currentAf + af0, maxAf);
        }
      }
    }

    output[i] = sar;
  }

  return output;
}

/**
 * PSAR signal detection — crossover of close vs PSAR.
 */
function getPSARSignals(close, psarValues) {
  const signals = new Array(close.length).fill(0);
  for (let i = 1; i < close.length; i++) {
    if (psarValues[i] === 0 || psarValues[i - 1] === 0) continue;
    if (close[i] > psarValues[i] && close[i - 1] <= psarValues[i - 1]) {
      signals[i] = 1;
    } else if (close[i] < psarValues[i] && close[i - 1] >= psarValues[i - 1]) {
      signals[i] = -1;
    }
  }
  return signals;
}

/**
 * Fast Stochastic — matches Python's talib.STOCH via rolling min/max/mean.
 */
function calcFastStochastics(low, high, close, lookbackPeriod, dPeriod, kSmoothingPeriod) {
  lookbackPeriod = Math.max(1, parseInt(lookbackPeriod) || 14);
  dPeriod = Math.max(1, parseInt(dPeriod) || 3);
  kSmoothingPeriod = Math.max(1, parseInt(kSmoothingPeriod) || 3);

  const length = close.length;

  const rollingMin = (arr, window) => {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      if (i < window - 1) {
        result.push(null);
      } else {
        result.push(Math.min(...arr.slice(i - window + 1, i + 1)));
      }
    }
    return result;
  };

  const rollingMax = (arr, window) => {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      if (i < window - 1) {
        result.push(null);
      } else {
        result.push(Math.max(...arr.slice(i - window + 1, i + 1)));
      }
    }
    return result;
  };

  const rollingMean = (arr, window) => {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      if (i < window - 1) {
        result.push(null);
      } else {
        const windowSlice = arr.slice(i - window + 1, i + 1);
        let total = 0;
        let hasNaN = false;
        for (const x of windowSlice) {
          if (x === null) {
            total += 0;
          } else if (isNaN(x)) {
            hasNaN = true;
            break;
          } else {
            total += x;
          }
        }
        result.push(hasNaN ? NaN : total / window);
      }
    }
    return result;
  };

  const lowestLow = rollingMin(low, lookbackPeriod);
  const highestHigh = rollingMax(high, lookbackPeriod);

  const rawK = [];
  for (let i = 0; i < length; i++) {
    if (i < lookbackPeriod - 1) {
      rawK.push(null);
    } else if (lowestLow[i] !== null && highestHigh[i] !== null) {
      const denom = highestHigh[i] - lowestLow[i];
      rawK.push(denom !== 0 ? 100 * ((close[i] - lowestLow[i]) / denom) : NaN);
    } else {
      rawK.push(null);
    }
  }

  let kSmooth = kSmoothingPeriod > 1 ? rollingMean(rawK, kSmoothingPeriod) : rawK;
  const K = kSmooth.map(val => (val === null || isNaN(val)) ? 0 : val);
  const dValues = rollingMean(K, dPeriod);
  const D = dValues.map(val => (val === null || isNaN(val)) ? 0 : val);

  return { K, D };
}

/**
 * Linear Regression Channel — sliding window, population std.
 * Matches Python linear_regression_channel_numba_sliding exactly.
 */
function linearRegressionChannel(close, period, stdMultiplier) {
  const n = close.length;
  const LRL = new Array(n).fill(null);
  const UCL = new Array(n).fill(null);
  const LCL = new Array(n).fill(null);

  for (let i = period - 1; i < n; i++) {
    const windowClose = close.slice(i - period + 1, i + 1);
    const N = windowClose.length;

    let sum_X = 0, sum_Y = 0, sum_XY = 0, sum_X2 = 0;
    for (let j = 0; j < N; j++) {
      sum_X += j;
      sum_Y += windowClose[j];
      sum_XY += j * windowClose[j];
      sum_X2 += j * j;
    }

    const denominator = N * sum_X2 - sum_X * sum_X;
    let slope = 0;
    let intercept = sum_Y / N;
    if (denominator !== 0) {
      slope = (N * sum_XY - sum_X * sum_Y) / denominator;
      intercept = (sum_Y - slope * sum_X) / N;
    }

    const lrlEndpoint = intercept + slope * (N - 1);

    let sumResidualsSq = 0;
    for (let j = 0; j < N; j++) {
      const residual = windowClose[j] - (intercept + slope * j);
      sumResidualsSq += residual * residual;
    }
    const stdDev = Math.sqrt(sumResidualsSq / N);

    LRL[i] = lrlEndpoint;
    UCL[i] = lrlEndpoint + stdMultiplier * stdDev;
    LCL[i] = lrlEndpoint - stdMultiplier * stdDev;
  }

  return { LRL, UCL, LCL };
}

module.exports = { calculatePSAR, getPSARSignals, calcFastStochastics, linearRegressionChannel };
