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

  const chartHeight = height - 48 - 5;

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
