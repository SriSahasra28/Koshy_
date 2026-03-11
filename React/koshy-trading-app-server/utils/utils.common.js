const ResponseCodes = require("./responseCodes");

const pick = (object, keys) => {
  return keys.reduce((obj, key) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      // eslint-disable-next-line no-param-reassign
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

const sendResponse = ({
  res,
  res_code = 200,
  success = false,
  message = "",
  data = null,
  response_code = ResponseCodes.GET_SUCCESS,
  errors = undefined,
  ...extraFields  // Accept additional fields like 'indicators'
}) => {
  const baseResponse = {
    success,
    message,
    data,
    response_code,
  };

  // Include errors if present
  if (errors) {
    baseResponse.errors = errors;
  }

  // Include any additional fields (like 'indicators')
  Object.assign(baseResponse, extraFields);
  
  // Debug logging
  console.log(`[SENDRESPONSE] extraFields keys: [${Object.keys(extraFields).join(', ')}]`);
  console.log(`[SENDRESPONSE] final response keys: [${Object.keys(baseResponse).join(', ')}]`);
  if (baseResponse.indicators) {
    console.log(`[SENDRESPONSE] indicators present: psar=${!!baseResponse.indicators.psar} stoch=${!!baseResponse.indicators.stoch}`);
  } else {
    console.log(`[SENDRESPONSE] indicators is ${baseResponse.indicators === null ? 'null' : 'undefined'}`);
  }

  return res.status(res_code).json(baseResponse);
};


const calcHeikinAshi = (openPrices, highPrices, lowPrices, closePrices) => {
  console.log(`🔢 calcHeikinAshi called with ${openPrices.length} candles`);
  
  const haOpen = new Array(openPrices.length);
  const haHigh = new Array(highPrices.length);
  const haLow = new Array(lowPrices.length);
  const haClose = new Array(closePrices.length);

  // Calculate all Heikin-Ashi values exactly like Python (no precision rounding)
  for (let i = 0; i < openPrices.length; i++) {
    haClose[i] = (openPrices[i] + highPrices[i] + lowPrices[i] + closePrices[i]) / 4;
  }

  haOpen[0] = (openPrices[0] + closePrices[0]) / 2;
  for (let i = 1; i < openPrices.length; i++) {
    haOpen[i] = (haOpen[i - 1] + haClose[i - 1]) / 2;
  }

  // Calculate haHigh and haLow exactly like Python's numpy.maximum.reduce
  for (let i = 0; i < openPrices.length; i++) {
    haHigh[i] = Math.max(highPrices[i], haOpen[i], haClose[i]);
    haLow[i] = Math.min(lowPrices[i], haOpen[i], haClose[i]);
  }

  // Log first and last calculated HA values for verification
  if (openPrices.length > 0) {
    console.log(`   First HA: O:${haOpen[0].toFixed(2)} H:${haHigh[0].toFixed(2)} L:${haLow[0].toFixed(2)} C:${haClose[0].toFixed(2)}`);
    console.log(`   Last HA: O:${haOpen[openPrices.length - 1].toFixed(2)} H:${haHigh[openPrices.length - 1].toFixed(2)} L:${haLow[openPrices.length - 1].toFixed(2)} C:${haClose[openPrices.length - 1].toFixed(2)}`);
  }

  return { haOpen, haHigh, haLow, haClose };
}

module.exports = { pick, sendResponse , calcHeikinAshi};
