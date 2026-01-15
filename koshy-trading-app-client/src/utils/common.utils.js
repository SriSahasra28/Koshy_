import { v4 as uuidv4 } from "uuid";

export const getNearestStrikePrice = (LTP) => {
  // Step 1: Divide the LTP value by 50
  var dividedValue = LTP / 50;

  // Step 2: Round the result to the nearest whole number
  var roundedValue = Math.round(dividedValue);

  // Step 3: Multiply the rounded result by 50
  var strikePrice = roundedValue * 50;

  return strikePrice;
};
export const geChartHeight = () => {
  const height = window?.innerHeight;

  //console.log("height>>>", height);

  let percentageHeight = (height * 20) / 100;

  //console.log("percentageHeight>>", percentageHeight);

  let chartHeight = height - 1.8 - 48 - 5 - percentageHeight;

  return chartHeight ?? 780;
};

export const geChart2Height = () => {
  const height = window?.innerHeight;

  //console.log("height>>>", height);

  let percentageHeight = (height * 80) / 100;

  //console.log("percentageHeight>>", percentageHeight);

  let chartHeight = height - 1.8 - 48 - 5 - percentageHeight;

  return chartHeight ?? 780;
};
export const calculateMovingAverage = (data, period) => {
  const result = [];
  for (let i = 0; i < data.length - period + 1; i++) {
    let sum = 0;
    for (let j = i; j < i + period; j++) {
      sum += data[j].close;
    }
    result.push({
      time: new Date(data[i + period - 1]?.timestamp)?.getTime(),
      value: sum / period,
    });
  }

  return result;
};

export const calculateEma = (data, length) => {
  if (!data || length <= 0) {
    return null;
  }

  const alpha = 2 / (length + 1);
  const emaValues = [];
  let sumEma = null;

  let src = [];
  let timestamps = [];

  data.forEach((element) => {
    src.push(element.close);
    timestamps.push(new Date(element.timestamp)?.getTime());
  });

  for (let i = 0; i < src.length; i++) {
    const value = src[i];

    if (sumEma === null) {
      // Handle initial calculation for the first length elements
      sumEma =
        src.slice(0, length).reduce((acc, curr) => acc + curr, 0) / length;
    } else {
      sumEma = alpha * value + (1 - alpha) * sumEma;
    }

    emaValues.push({ value: sumEma, time: timestamps[i] });
  }

  return emaValues;
};

const ATR_np = (high, low, close, range_period) => {
  const high_low = high.map((value, index) => value - low[index]);
  const close_shifted = close.slice();
  close_shifted.unshift(close[close.length - 1]);
  const high_previous_close = high.map((value, index) =>
    Math.abs(value - close_shifted[index])
  );
  const low_previous_close = low.map((value, index) =>
    Math.abs(value - close_shifted[index])
  );
  const true_range = high_low.map((value, index) =>
    Math.max(value, high_previous_close[index], low_previous_close[index])
  );
  const atr = new Array(high.length).fill(0);
  atr[range_period - 1] =
    true_range.slice(0, range_period).reduce((sum, value) => sum + value, 0) /
    range_period;
  for (let i = range_period; i < high.length; i++) {
    atr[i] = (atr[i - 1] * (range_period - 1) + true_range[i]) / range_period;
  }

  return atr;
};

export const calculateSupertrendData = ({ data, multiplier, atrPeriod }) => {
  // const multiplier = 3; // Example multiplier
  // const atrPeriod = 10; // Example ATR period/length

  let high_arr = [];
  let low_arr = [];
  let close_arr = [];

  data.forEach((element) => {
    high_arr.push(element.high);
    low_arr.push(element.low);
    close_arr.push(element.close);
  });

  const ATR_np_list = ATR_np(high_arr, low_arr, close_arr, atrPeriod);

  let basic_upper_band = new Array(high_arr.length);
  for (let i = 0; i < high_arr.length; i++) {
    basic_upper_band[i] =
      (high_arr[i] + low_arr[i]) / 2 + multiplier * ATR_np_list[i];
  }

  let final_upper_band = new Array(ATR_np_list.length).fill(0);
  for (let i = atrPeriod; i < ATR_np_list.length; i++) {
    if (close_arr[i - 1] <= final_upper_band[i - 1]) {
      final_upper_band[i] = Math.min(
        basic_upper_band[i],
        final_upper_band[i - 1]
      );
    } else {
      final_upper_band[i] = basic_upper_band[i];
    }
  }
  //const lastFinalUpperBand = final_upper_band[final_upper_band.length - 1];

  let basic_lower_band = new Array(high_arr.length);
  for (let i = 0; i < high_arr.length; i++) {
    basic_lower_band[i] =
      (high_arr[i] + low_arr[i]) / 2 - multiplier * ATR_np_list[i];
  }

  let final_lower_band = new Array(ATR_np_list.length).fill(0);

  for (let i = atrPeriod; i < final_lower_band.length; i++) {
    if (close_arr[i - 1] >= final_lower_band[i - 1]) {
      final_lower_band[i] = Math.max(
        basic_lower_band[i],
        final_lower_band[i - 1]
      );
    } else {
      final_lower_band[i] = basic_lower_band[i];
    }
  }

  let SuperTrend = new Array(ATR_np_list.length).fill(NaN);

  if (close_arr[atrPeriod] <= final_upper_band[atrPeriod]) {
    SuperTrend[atrPeriod + 1] = final_upper_band[atrPeriod + 1];
  } else {
    SuperTrend[atrPeriod + 1] = final_lower_band[atrPeriod + 1];
  }

  for (let i = atrPeriod; i < SuperTrend.length; i++) {
    if (
      SuperTrend[i - 1] === final_upper_band[i - 1] &&
      close_arr[i] <= final_upper_band[i]
    ) {
      SuperTrend[i] = final_upper_band[i]; // Same Trend
    } else if (
      SuperTrend[i - 1] === final_upper_band[i - 1] &&
      close_arr[i] >= final_upper_band[i]
    ) {
      SuperTrend[i] = final_lower_band[i]; // Trend Changed
    } else if (
      SuperTrend[i - 1] === final_lower_band[i - 1] &&
      close_arr[i] >= final_lower_band[i]
    ) {
      SuperTrend[i] = final_lower_band[i]; // Same Trend
    } else if (
      SuperTrend[i - 1] === final_lower_band[i - 1] &&
      close_arr[i] <= final_lower_band[i]
    ) {
      SuperTrend[i] = final_upper_band[i]; // Trend Changed
    }
  }

  const direction = close_arr.map((value, index) => {
    return value >= SuperTrend[index] ? 1 : -1;
  });

  const combinedData = [];
  for (let i = 0; i < SuperTrend.length; i++) {
    let dataPoint = {};

    if (isNaN(SuperTrend[i])) {
      dataPoint = {
        supertrend: null,
        direction: direction[i],
      };
    } else {
      dataPoint = {
        supertrend: SuperTrend[i],
        direction: direction[i],
      };
    }

    combinedData.push(dataPoint);
  }

  return combinedData;
};

export const generateUniqueId = () => {
  return uuidv4().replaceAll("-", "_");
};

export const getLTP = (data) => {
  const ltp = data[data.length - 1]?.close;

  return parseInt(ltp);
};

export const getEmaLineData = ({ length, data }) => {
  // let lineData = data[`ema_${length}`];
  let lineData = [];

  data.forEach((element) => {
    lineData.push({
      value: Number(element[`ema_${length}`]),
      time: new Date(element.datetime).getTime(),
    });
  });

  return lineData;
};

export const calculatePSAR = (high, low, close, af0, af, max_af) => {
  const length = close.length;
  const psar = new Array(length).fill(0);
  psar[0] = close[0];
  let trend = 1;  // 1: uptrend, -1: downtrend
  let ep = high[0];  // extreme point
  
  // Match Python: if af is None/undefined, use af0
  if (af === undefined || af === null) {
    af = af0;
  }

  for (let i = 1; i < length; i++) {
    psar[i] = psar[i - 1] + af * (ep - psar[i - 1]);

    if (trend === 1) {
      if (high[i] > ep) {
        ep = high[i];
        af = Math.min(af + af0, max_af);
      }
      if (low[i] < psar[i]) {
        trend = -1;
        psar[i] = ep;
        ep = low[i];
        af = af0;
      }
    } else {
      if (low[i] < ep) {
        ep = low[i];
        af = Math.min(af + af0, max_af);
      }
      if (high[i] > psar[i]) {
        trend = 1;
        psar[i] = ep;
        ep = high[i];
        af = af0;
      }
    }

    if (trend === 1 && i > 1) {
      psar[i] = Math.min(psar[i], low[i - 1], low[i - 2]);
    } else if (trend === -1 && i > 1) {
      psar[i] = Math.max(psar[i], high[i - 1], high[i - 2]);
    }
  }

  return psar;
};

export const getPSARSignals = (close, psarValues) => {
  // Match Python: return both positive and negative signals in one array
  const signals = new Array(close.length).fill(0);
  for (let i = 1; i < close.length; i++) {  
    if (close[i] > psarValues[i] && close[i - 1] <= psarValues[i - 1]) {
      signals[i] = 1;  // Long signal
    } else if (close[i] < psarValues[i] && close[i - 1] >= psarValues[i - 1]) {
      signals[i] = -1;  // Short signal
    }
  }
  return signals;
};

// Keep backward compatibility
export const getPosSignals = (close, psarValues) => {
  const signals = new Array(close.length).fill(null);
  for (let i = 1; i < close.length; i++) {  
    if (close[i] > psarValues[i] && close[i - 1] <= psarValues[i - 1]) {
      signals[i] = 1;  // Long signal
    }
  }
  return signals;
};

export const getNegSignals = (close, psarValues) => {
  const signals = new Array(close.length).fill(null);
  for (let i = 1; i < close.length; i++) { 
    if (close[i] < psarValues[i] && close[i - 1] >= psarValues[i - 1]) {
      signals[i] = 1;  // Short signal
    }
  }
  return signals;
};

export const linearRegressionChannel = (close, period, stdMultiplier) => {
  const closeSlice = close.slice(-period);
  const X = [...Array(closeSlice.length).keys()];
  const N = X.length;
  const sum_X = X.reduce((acc, val) => acc + val, 0);
  const sum_Y = closeSlice.reduce((acc, val) => acc + val, 0);
  const sum_XY = X.reduce((acc, val, idx) => acc + val * closeSlice[idx], 0);
  const sum_X2 = X.reduce((acc, val) => acc + val * val, 0);
  const slope = (N * sum_XY - sum_X * sum_Y) / (N * sum_X2 - sum_X * sum_X);
  const intercept = (sum_Y - slope * sum_X) / N;
  const LRL = X.map(x => intercept + slope * x);
  const residuals = closeSlice.map((val, idx) => val - LRL[idx]);
  const stdDev = Math.sqrt(residuals.reduce((acc, val) => acc + val * val, 0) / (residuals.length - 1));
  const UCL = LRL.map(val => val + stdMultiplier * stdDev);
  const LCL = LRL.map(val => val - stdMultiplier * stdDev);
 
  const nullPadding = Array(close.length - LRL.length).fill(null);
  const paddedLRL = [...nullPadding, ...LRL];
  const paddedUCL = [...nullPadding, ...UCL];
  const paddedLCL = [...nullPadding, ...LCL];

  return { LRL: paddedLRL, UCL: paddedUCL, LCL: paddedLCL };
};

export const calcFastStochastics = (low, high, close, lookbackPeriod, dPeriod, kSmoothingPeriod = 3) => {
  // Match Python: Coerce window arguments to safe integers
  try {
    lookbackPeriod = Math.max(1, parseInt(lookbackPeriod));
  } catch (e) {
    lookbackPeriod = 14;
  }
  try {
    dPeriod = Math.max(1, parseInt(dPeriod));
  } catch (e) {
    dPeriod = 3;
  }
  try {
    kSmoothingPeriod = Math.max(1, parseInt(kSmoothingPeriod));
  } catch (e) {
    kSmoothingPeriod = 3;
  }

  const length = close.length;

  // Function to calculate rolling minimum (match Python)
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

  // Function to calculate rolling maximum (match Python)
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

  // Function to calculate rolling mean (match Python's complex null/NaN handling)
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
            // null coerces to 0 in JS (match Python)
            total += 0;
          } else if (isNaN(x)) {
            // NaN propagates in JS (match Python)
            hasNaN = true;
            break;
          } else {
            total += x;
          }
        }
        
        if (hasNaN) {
          result.push(NaN);
        } else {
          result.push(total / window);
        }
      }
    }
    return result;
  };

  const lowestLow = rollingMin(low, lookbackPeriod);
  const highestHigh = rollingMax(high, lookbackPeriod);

  // Calculate raw K values (match Python logic)
  const rawK = [];
  for (let i = 0; i < length; i++) {
    if (i < lookbackPeriod - 1) {
      rawK.push(null);
    } else {
      if (lowestLow[i] !== null && highestHigh[i] !== null) {
        const denominator = highestHigh[i] - lowestLow[i];
        if (denominator !== 0) {
          const kVal = 100 * ((close[i] - lowestLow[i]) / denominator);
          rawK.push(kVal);
        } else {
          // Division by zero creates NaN (match Python)
          rawK.push(NaN);
        }
      } else {
        rawK.push(null);
      }
    }
  }

  // Apply K smoothing if needed (match Python)
  let kSmooth;
  if (kSmoothingPeriod > 1) {
    kSmooth = rollingMean(rawK, kSmoothingPeriod);
  } else {
    kSmooth = rawK;
  }

  // Convert null/NaN to 0 (match Python)
  const K = kSmooth.map(val => (val === null || isNaN(val)) ? 0 : val);

  // Calculate D values (match Python)
  const dValues = rollingMean(K, dPeriod);
  const D = dValues.map(val => (val === null || isNaN(val)) ? 0 : val);

  return { K, D };
};
