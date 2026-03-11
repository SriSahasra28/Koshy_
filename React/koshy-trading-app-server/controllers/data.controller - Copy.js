const moment = require("moment");
const db = require("../db/sequelize");
const { catchAsync } = require("../utils/catchAsync.utils");
const ResponseCodes = require("../utils/responseCodes");
const { sendResponse } = require("../utils/utils.common");
const { CommonEnums } = require("../utils/common.enums");
const { APIError } = require("../middlewares/errorHandler.middleware");
const { calcHeikinAshi } = require("../utils/utils.common");
const { Op } = require("sequelize");
const fetchHistoricalData = require("./fetchKiteData");
const getOhlcBySymbol = require("./fetchRedisData");

class DataController {
  static getData = catchAsync(async (req, res) => {
    const { symbol, interval } = req.query;
    console.log("symbol:", symbol);
    console.log("interval:", interval);

    let tableName = "one_min_ohlc";

    if (interval == CommonEnums.intervals.one_min) {
      tableName = "one_min_ohlc";
    }
    if (interval == CommonEnums.intervals.two_min) {
      tableName = "two_min_ohlc";
    }
    if (interval == CommonEnums.intervals.three_min) {
      tableName = "three_min_ohlc";
    }
    if (interval == CommonEnums.intervals.five_min) {
      tableName = "five_min_ohlc";
    }
    if (interval == CommonEnums.intervals.ten_min) {
      tableName = "ten_min_ohlc";
    }
    if (interval == CommonEnums.intervals.fifteen_min) {
      tableName = "fifteen_min_ohlc";
    }
    if (interval == CommonEnums.intervals.thirty_min) {
      tableName = "thirty_min_ohlc";
    }
    if (interval == CommonEnums.intervals.one_hour) {
      tableName = "one_hour_ohlc";
    }

    if (interval == CommonEnums.intervals.one_week) {
      tableName = "one_week_ohlc";
    }

    if (interval == CommonEnums.intervals.daily) {
      tableName = "daily_ohlc";
    }

    const [results] = await db.sequelize.query(
      `SELECT datetime, open, high, low, close FROM ${tableName?.trim()} WHERE symbol = '${symbol?.trim()}' order by datetime;`
    );

    // Prepare the data for Heikin-Ashi calculation
    const openPrices = results.map((row) => parseFloat(row.open));
    const highPrices = results.map((row) => parseFloat(row.high));
    const lowPrices = results.map((row) => parseFloat(row.low));
    const closePrices = results.map((row) => parseFloat(row.close));

    // Calculate Heikin-Ashi values
    const { haOpen, haHigh, haLow, haClose } = calcHeikinAshi(
      openPrices,
      highPrices,
      lowPrices,
      closePrices
    );

    // Build the chart data including Heikin-Ashi values
    let chartData = results.map((row, index) => {
      const date = new Date(row.datetime);
      row.datetime = moment(row.datetime).utc().format("YYYY-MM-DD HH:mm:ss");
      // Add Heikin-Ashi values to the chart data
      row.ha_open = haOpen[index];
      row.ha_high = haHigh[index];
      row.ha_low = haLow[index];
      row.ha_close = haClose[index];
      return row;
    });

    return sendResponse({
      res,
      success: true,
      message: "Data retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: chartData,
    });
  });

  static getDataV2 = catchAsync(async (req, res) => {
    const { symbol, interval } = req.query;

    let interval_name = "minute";

    if (interval == CommonEnums.intervals.two_min) {
      interval_name = "2minute";
    }
    if (interval == CommonEnums.intervals.three_min) {
      interval_name = "3minute";
    }
    if (interval == CommonEnums.intervals.five_min) {
      interval_name = "5minute";
    }
    if (interval == CommonEnums.intervals.ten_min) {
      interval_name = "10minute";
    }
    if (interval == CommonEnums.intervals.fifteen_min) {
      interval_name = "15minute";
    }
    if (interval == CommonEnums.intervals.thirty_min) {
      interval_name = "30minute";
    }
    if (interval == CommonEnums.intervals.one_hour) {
      interval_name = "60minute";
    }

    const [tokenResult] = await db.sequelize.query(
      "SELECT instrument_token FROM instruments WHERE tradingsymbol = :symbol",
      {
        replacements: { symbol: symbol?.trim() },
        type: db.sequelize.QueryTypes.SELECT,
      }
    );
    if (!tokenResult) {
      return sendResponse({
        res,
        success: false,
        message: "Instrument not found",
        response_code: ResponseCodes.GET_NOT_FOUND,
      });
    }
    const token = tokenResult.instrument_token;
    // Get Data from Kite Connect
    const to_date = new Date();
    const from_date = new Date(to_date);
    let days = 95; // Set default days to 95
    if (interval_name === "minute" || interval_name === "2minute") {
      days = 50; // Change to 50 if 'minute' or '2minute' interval is chosen
    }

    from_date.setDate(to_date.getDate() - days);
    const from_date_str = from_date
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    const to_date_ist = new Date(to_date.getTime() + 19800000); // Adjust to IST
    const to_date_str_ist = to_date_ist
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    // for 2 minute fetch 1 minute & resample
    try {
      let interval_name_two = interval_name;
      if (interval_name === "2minute") {
        interval_name_two = "minute";
      }
      let results = await fetchHistoricalData(
        token,
        interval_name_two,
        from_date_str,
        to_date_str_ist
      );

      if (!results || results.length === 0) {
        return sendResponse({
          res,
          success: false,
          message: "No historical data found",
          response_code: ResponseCodes.GET_NOT_FOUND,
        });
      }
      if (interval_name === "2minute") {
        console.log("in interval_name === 2minute");
        const resampledResults = [];

        for (let i = 0; i < results.length; i += 2) {
          const firstCandle = results[i];
          const secondCandle = results[i + 1] || firstCandle;

          const resampledCandle = {
            datetime: firstCandle.datetime, // Use the datetime of the first minute
            open: firstCandle.open, // Open price of the first minute
            high: Math.max(firstCandle.high, secondCandle.high), // Highest high between the two minutes
            low: Math.min(firstCandle.low, secondCandle.low), // Lowest low between the two minutes
            close: secondCandle.close, // Close price of the second minute
          };

          // Add the new 2-minute candle to the resampled data
          resampledResults.push(resampledCandle);
        }
        results = resampledResults;
      }

      const lastTenItems = results.slice(-10);
      console.log(lastTenItems);

      const openPrices = results.map((row) => parseFloat(row.open));
      const highPrices = results.map((row) => parseFloat(row.high));
      const lowPrices = results.map((row) => parseFloat(row.low));
      const closePrices = results.map((row) => parseFloat(row.close));

      // Ensure the lengths match before calculations
      if (
        [
          openPrices.length,
          highPrices.length,
          lowPrices.length,
          closePrices.length,
        ].some((length) => length !== openPrices.length)
      ) {
        throw new Error("Mismatched lengths in historical data");
      }

      // Calculate Heikin-Ashi values
      const { haOpen, haHigh, haLow, haClose } = calcHeikinAshi(
        openPrices,
        highPrices,
        lowPrices,
        closePrices
      );

      // Build the chart data including Heikin-Ashi values
      const chartData = results.map((row, index) => {
        //row.datetime = moment(row.datetime).utc().format("YYYY-MM-DD HH:mm:ss"); // Convert to UTC format
        row.ha_open = haOpen[index];
        row.ha_high = haHigh[index];
        row.ha_low = haLow[index];
        row.ha_close = haClose[index];
        return row;
      });

      return sendResponse({
        res,
        success: true,
        message: "Data retrieved successfully",
        response_code: ResponseCodes.GET_SUCCESS,
        data: chartData,
      });
    } catch (error) {
      console.error("Error fetching historical data:", error);
      return sendResponse({
        res,
        success: false,
        message: "Error fetching historical data",
        response_code: ResponseCodes.GET_ERROR,
        error: error.message,
      });
    }
  });

  static getData_redis = catchAsync(async (req, res) => {
    const { symbol, interval } = req.query;

    let interval_name = "minute";

    if (interval == CommonEnums.intervals.two_min) {
      interval_name = "2minute";
    }
    if (interval == CommonEnums.intervals.three_min) {
      interval_name = "3minute";
    }
    if (interval == CommonEnums.intervals.five_min) {
      interval_name = "5minute";
    }
    if (interval == CommonEnums.intervals.ten_min) {
      interval_name = "10minute";
    }
    if (interval == CommonEnums.intervals.fifteen_min) {
      interval_name = "15minute";
    }
    if (interval == CommonEnums.intervals.thirty_min) {
      interval_name = "30minute";
    }
    if (interval == CommonEnums.intervals.one_hour) {
      interval_name = "60minute";
    }

    try {
      let interval_name_two = interval_name;
      if (interval_name === "2minute") {
        interval_name_two = "minute";
      }
      let results = await getOhlcBySymbol(symbol);

      if (!results || results.length === 0) {
        return sendResponse({
          res,
          success: false,
          message: "No historical data found",
          response_code: ResponseCodes.GET_NOT_FOUND,
        });
      }
      if (interval_name === "2minute") {
        console.log("in interval_name === 2minute");
        const resampledResults = [];

        for (let i = 0; i < results.length; i += 2) {
          const firstCandle = results[i];
          const secondCandle = results[i + 1] || firstCandle;

          const resampledCandle = {
            datetime: firstCandle.datetime, // Use the datetime of the first minute
            open: firstCandle.open, // Open price of the first minute
            high: Math.max(firstCandle.high, secondCandle.high), // Highest high between the two minutes
            low: Math.min(firstCandle.low, secondCandle.low), // Lowest low between the two minutes
            close: secondCandle.close, // Close price of the second minute
          };

          // Add the new 2-minute candle to the resampled data
          resampledResults.push(resampledCandle);
        }
        results = resampledResults;
      }

      const lastTenItems = results.slice(-10);
      console.log(lastTenItems);

      const openPrices = results.map((row) => parseFloat(row.open));
      const highPrices = results.map((row) => parseFloat(row.high));
      const lowPrices = results.map((row) => parseFloat(row.low));
      const closePrices = results.map((row) => parseFloat(row.close));

      // Ensure the lengths match before calculations
      if (
        [
          openPrices.length,
          highPrices.length,
          lowPrices.length,
          closePrices.length,
        ].some((length) => length !== openPrices.length)
      ) {
        throw new Error("Mismatched lengths in historical data");
      }

      // Calculate Heikin-Ashi values
      const { haOpen, haHigh, haLow, haClose } = calcHeikinAshi(
        openPrices,
        highPrices,
        lowPrices,
        closePrices
      );

      // Build the chart data including Heikin-Ashi values
      const chartData = results.map((row, index) => {
        //row.datetime = moment(row.datetime).utc().format("YYYY-MM-DD HH:mm:ss"); // Convert to UTC format
        row.ha_open = haOpen[index];
        row.ha_high = haHigh[index];
        row.ha_low = haLow[index];
        row.ha_close = haClose[index];
        return row;
      });

      return sendResponse({
        res,
        success: true,
        message: "Data retrieved successfully",
        response_code: ResponseCodes.GET_SUCCESS,
        data: chartData,
      });
    } catch (error) {
      console.error("Error fetching historical data:", error);
      return sendResponse({
        res,
        success: false,
        message: "Error fetching historical data",
        response_code: ResponseCodes.GET_ERROR,
        error: error.message,
      });
    }
  });

  static getPsarSettings = catchAsync(async (req, res) => {
    const [results] = await db.sequelize.query(
      `SELECT acceleration, max_acceleration, up_color, down_color, enabled FROM psar_settings;`
    );

    const psar_settings = results.map((result) => ({
      acceleration: result.acceleration,
      maxAcceleration: result.max_acceleration,
      upColor: result.up_color,
      downColor: result.down_color,
      enabled: result.enabled,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Data retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: psar_settings,
    });
  });

  static getFastStochSettings = catchAsync(async (req, res) => {
    const [results] = await db.sequelize.query(
      `SELECT period, k_avg, d_avg, k_color, d_color, k_line_size, d_line_size, IsEnabled FROM fast_stoch_settings;`
    );

    const stoch_settings = results.map((result) => ({
      period: result.period,
      k_avg: result.k_avg,
      d_avg: result.d_avg,
      k_color: result.k_color,
      d_color: result.d_color,
      k_line_size: result.k_line_size,
      d_line_size: result.d_line_size,
      IsEnabled: result.IsEnabled,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Data retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: stoch_settings,
    });
  });
  static getLRCSettings = catchAsync(async (req, res) => {
    const [results] = await db.sequelize.query(
      `SELECT period, standardDeviation, upperColor, lowerColor, linColor, isEnabled FROM lrc_settings;`
    );

    const lrc_settings = results.map((result) => ({
      period: result.period,
      standardDeviation: result.standardDeviation,
      upperColor: result.upperColor,
      lowerColor: result.lowerColor,
      linColor: result.linColor,
      isEnabled: result.isEnabled,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Data retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: lrc_settings,
    });
  });

  static updatePsarSettings = catchAsync(async (req, res) => {
    // console.log(req);
    const { acceleration, max_acceleration, up_color, down_color, enabled } =
      req.query;
    console.log("acceleration:", acceleration);
    console.log("max_acceleration:", max_acceleration);
    console.log("up_color:", up_color);
    console.log("down_color:", down_color);
    console.log("enabled:", enabled);
    if (
      acceleration === undefined ||
      max_acceleration === undefined ||
      up_color === undefined ||
      down_color === undefined ||
      enabled === undefined
    ) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters are required",
      });
    }
    const [results] = await db.sequelize.query(`
      UPDATE psar_settings 
      SET acceleration = '${acceleration}', max_acceleration = '${max_acceleration}', up_color = '${up_color}', down_color = '${down_color}', enabled = '${enabled}'
    `);

    if (results.affectedRows == 0) {
      throw new APIError({
        code: ResponseCodes.NOT_FOUND,
        message: "psar settings not updated",
      });
    }

    return sendResponse({
      res,
      success: true,
      message: "PSAR settings updated",
      response_code: ResponseCodes.OK,
    });
  });

  static updateLRCSettings = catchAsync(async (req, res) => {
    console.log("updateLRCSettings");
    const { period, sdev, up_color, low_color, lin_color, enabled } = req.query;
    let low_color_val = low_color.trim();

    if (
      period === undefined ||
      sdev === undefined ||
      up_color === undefined ||
      low_color === undefined ||
      lin_color === undefined ||
      enabled === undefined
    ) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters are required",
      });
    }

    const [results] = await db.sequelize.query(`
      UPDATE lrc_settings 
      SET period = '${period}', standardDeviation = '${sdev}', upperColor = '${up_color}', lowerColor = '${low_color_val}', linColor = '${lin_color}', IsEnabled = '${enabled}';
    `);

    return sendResponse({
      res,
      success: true,
      message: "LRC settings updated",
      response_code: ResponseCodes.OK,
    });
  });

  static updateStochSettings = catchAsync(async (req, res) => {
    //console.log('updateStochSettings', req.body);
    const {
      stoch_period,
      k_avg,
      d_avg,
      k_color,
      d_color,
      k_line_size,
      d_line_size,
      enabledValue,
    } = req.body;
    const enabled = enabledValue ? 1 : 0;
    console.log("stoch_period:", stoch_period);
    console.log("k_avg:", k_avg);
    console.log("d_avg:", d_avg);
    console.log("k_color:", k_color);
    console.log("d_color:", d_color);
    console.log("k_line_size:", k_line_size);
    console.log("d_line_size:", d_line_size);
    console.log("enabled:", enabled);
    if (
      stoch_period === undefined ||
      k_avg === undefined ||
      d_avg === undefined ||
      k_color === undefined ||
      d_color === undefined ||
      k_line_size === undefined ||
      d_line_size === undefined ||
      enabledValue === undefined
    ) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters are required",
      });
    }

    const [results] = await db.sequelize.query(`
      UPDATE fast_stoch_settings 
      SET period = '${stoch_period}', k_avg = '${k_avg}', d_avg = '${d_avg}', k_color='${k_color}', d_color='${d_color}', k_line_size='${k_line_size}', d_line_size='${d_line_size}', IsEnabled='${enabled}';
    `);

    return sendResponse({
      res,
      success: true,
      message: "Stoch settings updated",
      response_code: ResponseCodes.OK,
    });
  });

  static getIndicators = catchAsync(async (req, res) => {
    const [results] = await db.sequelize.query(
      `SELECT id, name FROM indicators WHERE active = 1;`
    );

    const indicators = results.map((result) => ({
      id: result.id,
      name: result.name,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Data retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: indicators,
    });
  });
  static getCustomIndicators = catchAsync(async (req, res) => {
    const [results] = await db.sequelize.query(
      `SELECT id, name, indicator_id, value FROM custom_indicators WHERE active = 1;`
    );

    const customIndicators = results.map((result) => ({
      id: result.id,
      name: result.name,
      indicatorId: result.indicator_id,
      value: result.value,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Data retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: customIndicators,
    });
  });

  static insertCustomIndicator = catchAsync(async (req, res) => {
    const { name, indicator_id, value } = req.body;
    console.log("name", name);
    console.log("indicator_id", indicator_id);
    console.log("value", value);
    if (!name || !indicator_id || !value) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters are required",
      });
    }

    const [results] = await db.sequelize.query(`
      INSERT INTO custom_indicators (name, indicator_id, value) 
      VALUES ('${name}', '${indicator_id}', '${value}');
    `);

    return sendResponse({
      res,
      success: true,
      message: "Custom indicator inserted successfully",
      response_code: ResponseCodes.CREATED,
    });
  });
  static updateCustomIndicator = catchAsync(async (req, res) => {
    const { id, name, value } = req.body;

    if (!id || !name || !value) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters are required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      UPDATE custom_indicators 
      SET name = ?, value = ?
      WHERE id = ?;
    `,
      {
        replacements: [name, value, id],
      }
    );

    return sendResponse({
      res,
      success: true,
      message: "Custom indicator updated successfully",
      response_code: ResponseCodes.OK,
    });
  });
  static deleteCustomIndicator = catchAsync(async (req, res) => {
    const { id } = req.body;

    if (!id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID parameter is required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      DELETE FROM custom_indicators 
      WHERE id = ?;
    `, 
      {
        replacements: [id],
      }
    );

    return sendResponse({
      res,
      success: true,
      message: "Custom indicator marked as inactive successfully",
      response_code: ResponseCodes.OK,
    });
  });

  static getConditions = catchAsync(async (req, res) => {
    const [results] = await db.sequelize.query(
      `SELECT id, name FROM conditions WHERE active = 1;`
    );

    const conditions = results.map((result) => ({
      id: result.id,
      name: result.name,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Data retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: conditions,
    });
  });

  static insertConditions = catchAsync(async (req, res) => {
    const {
      name,
      lrcid,
      psarid,
      stochid,
      lrcangletype,
      lrcanglestart,
      lrcangleend,
      signaldirection,
      signalColor,
      hlfpid,
    } = req.body;

    if (
      !name ||
      !lrcid ||
      !psarid ||
      !stochid ||
      !lrcangletype ||
      !lrcanglestart ||
      !lrcangleend ||
      !signaldirection ||
      !signalColor ||
      !hlfpid
    ) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters are required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      INSERT INTO conditions (name, lrcid, psarid, stochid, lrcangletype, lrcanglestart, lrcangleend, signaldirection, signalColor, hlfpid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
      {
        replacements: [
          name,
          lrcid,
          psarid,
          stochid,
          lrcangletype,
          lrcanglestart,
          lrcangleend,
          signaldirection,
          signalColor,
          hlfpid,
        ],
      }
    );

    return sendResponse({
      res,
      success: true,
      message: "Condition inserted successfully",
      response_code: ResponseCodes.CREATED,
      data: results,
    });
  });

  static deleteCondition = catchAsync(async (req, res) => {
    const { id } = req.body;

    if (!id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID parameter is required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      UPDATE conditions
      SET active = 0 
      WHERE id = ?;
    `,
      {
        replacements: [id],
      }
    );

    return sendResponse({
      res,
      success: true,
      message: "Condition marked as inactive successfully",
      response_code: ResponseCodes.OK,
      data: results,
    });
  });

  static updateCondition = catchAsync(async (req, res) => {
    const {
      id,
      name,
      lrcid,
      psarid,
      stochid,
      lrcangletype,
      lrcanglestart,
      lrcangleend,
      signaldirection,
      signalColor,
      hlfpid,
    } = req.body;

    if (
      !id ||
      !name ||
      !lrcid ||
      !psarid ||
      !stochid ||
      !lrcangletype ||
      !lrcanglestart ||
      !lrcangleend ||
      !signaldirection ||
      !signalColor ||
      !hlfpid
    ) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters are required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      UPDATE conditions
      SET name = ?, lrcid = ?, psarid = ?, stochid = ?, lrcangletype = ?, lrcanglestart = ?, lrcangleend = ?, signaldirection = ?, signalColor = ?, hlfpid = ?
      WHERE id = ?;
    `,
      {
        replacements: [
          name,
          lrcid,
          psarid,
          stochid,
          lrcangletype,
          lrcanglestart,
          lrcangleend,
          signaldirection,
          signalColor,
          hlfpid,
          id,
        ],
      }
    );

    return sendResponse({
      res,
      success: true,
      message: "Condition updated successfully",
      response_code: ResponseCodes.OK,
      data: results,
    });
  });

  static fetchConditionById = catchAsync(async (req, res) => {
    console.log(req.body);
    const { id } = req.body;
    console.log("id", id);
    if (!id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID parameter is required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      SELECT
        name,
        lrcid,
        psarid,
        stochid,
        lrcangletype,
        lrcanglestart,
        lrcangleend,
        signaldirection,
        signalColor,
       hlfpid
      FROM algo.conditions
      WHERE id = ?;
    `,
      {
        replacements: [id],
      }
    );

    if (results.length === 0) {
      return sendResponse({
        res,
        success: false,
        message: "Condition not found",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    const condition = {
      name: results[0].name,
      lrcid: results[0].lrcid,
      psarid: results[0].psarid,
      stochid: results[0].stochid,
      lrcangletype: results[0].lrcangletype,
      lrcanglestart: results[0].lrcanglestart,
      lrcangleend: results[0].lrcangleend,
      signaldirection: results[0].signaldirection,
      signalColor: results[0].signalColor,
      hlfpid: results[0].hlfpid,
    };

    return sendResponse({
      res,
      success: true,
      message: "Condition retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: condition,
    });
  });

  static getScans = catchAsync(async (req, res) => {
    const [results] = await db.sequelize.query(
      `SELECT id, name, basket_id FROM scans WHERE active = 1;`
    );

    const scans = results.map((result) => ({
      id: result.id,
      name: result.name,
      basketId: result.basket_id,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Scans retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: scans,
    });
  });

  static insertScans = catchAsync(async (req, res) => {
    const { name, basket_id } = req.body;

    if (!name || !basket_id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "Name and basket_id are required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      INSERT INTO scans (name, basket_id)
      VALUES (?, ?);
    `,
      {
        replacements: [name, basket_id],
      }
    );

    return sendResponse({
      res,
      success: true,
      message: "Scan inserted successfully",
      response_code: ResponseCodes.CREATED,
      data: results,
    });
  });

  static deleteScan = catchAsync(async (req, res) => {
    const { id } = req.body;

    if (!id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID is required",
      });
    }

    const [results] = await db.sequelize.query(
      `
DELETE FROM scans
WHERE id = ?;
  `,
      {
        replacements: [id],
      }
    );

    if (results.affectedRows === 0) {
      return sendResponse({
        res,
        success: false,
        message: "Scan not found or already inactive",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    return sendResponse({
      res,
      success: true,
      message: "Scan deleted successfully",
      response_code: ResponseCodes.OK,
    });
  });

  static getScanById = catchAsync(async (req, res) => {
    const { id } = req.body;

    if (!id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID parameter is required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      SELECT name, basket_id
      FROM scans
      WHERE id = ?;
    `,
      {
        replacements: [id],
      }
    );

    if (results.length === 0) {
      return sendResponse({
        res,
        success: false,
        message: "Scan not found",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    const scan = {
      name: results[0].name,
      basketId: results[0].basket_id,
    };

    return sendResponse({
      res,
      success: true,
      message: "Scan retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: scan,
    });
  });

  static updateScans = catchAsync(async (req, res) => {
    const { id, name, basket_id } = req.body;

    if (!id || !name || !basket_id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID, name, and basket_id are required",
      });
    }

    // Execute the update query
    const [results] = await db.sequelize.query(
      `
      UPDATE scans
      SET name = ?, basket_id = ?
      WHERE id = ?;
    `,
      {
        replacements: [name, basket_id, id],
      }
    );

    // Check if any rows were affected
    if (results.affectedRows === 0) {
      return sendResponse({
        res,
        success: false,
        message: "Scan not found or no changes made",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    return sendResponse({
      res,
      success: true,
      message: "Scan updated successfully",
      response_code: ResponseCodes.OK,
    });
  });

  static fetchScanItemsByScanID = catchAsync(async (req, res) => {
    const { scanID } = req.body;

    // Validate required parameter
    if (!scanID) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "scanID is required",
      });
    }

    // Execute the query to fetch scan items by scanID
    const [results] = await db.sequelize.query(
      `
      SELECT id, conditionID, 1min, 2min, 3min, 5min, 10min, 15min, 30min, 60min, active
      FROM scanitems
      WHERE scanID = ? AND active = 1;
    `,
      {
        replacements: [scanID],
      }
    );

    // Check if any scan items are found
    if (results.length === 0) {
      return sendResponse({
        res,
        success: false,
        message: "No active scan items found for the given scanID",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    // Format the results
    const scanItems = results.map((item) => ({
      id: item.id,
      conditionID: item.conditionID,
      oneMin: item["1min"],
      twoMin: item["2min"],
      threeMin: item["3min"],
      fiveMin: item["5min"],
      tenMin: item["10min"],
      fifteenMin: item["15min"],
      thirtyMin: item["30min"],
      sixtyMin: item["60min"],
      active: item.active,
    }));

    // Send the response
    return sendResponse({
      res,
      success: true,
      message: "Scan items retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: scanItems,
    });
  });

  static fetchCustomIndicatorById = catchAsync(async (req, res) => {
    const { id } = req.body;

    // Validate required parameter
    if (!id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID is required",
      });
    }

    // Execute the query to fetch custom indicator by ID
    const [results] = await db.sequelize.query(
      `
      SELECT name, indicator_id, value
      FROM custom_indicators
      WHERE id = ?;
    `,
      {
        replacements: [id],
      }
    );

    // Check if any custom indicator is found
    if (results.length === 0) {
      return sendResponse({
        res,
        success: false,
        message: "No custom indicator found for the given ID",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    // Format the results
    const customIndicator = results.map((item) => ({
      name: item.name,
      indicatorId: item.indicator_id,
      value: item.value,
    }))[0]; // Assuming ID is unique, so we take the first item

    // Send the response
    return sendResponse({
      res,
      success: true,
      message: "Custom indicator retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: customIndicator,
    });
  });

  static deleteScanItem = catchAsync(async (req, res) => {
    const { id } = req.body;

    if (!id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID is required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      UPDATE scanitems
      SET active = 0
      WHERE id = ?;
    `,
      {
        replacements: [id],
      }
    );

    if (results.affectedRows === 0) {
      return sendResponse({
        res,
        success: false,
        message: "Scanitem not found or already inactive",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    return sendResponse({
      res,
      success: true,
      message: "ScanItem deleted successfully",
      response_code: ResponseCodes.OK,
    });
  });

  static updateScanItem = catchAsync(async (req, res) => {
    const {
      id,
      conditionID,
      oneMin,
      twoMin,
      threeMin,
      fiveMin,
      tenMin,
      fifteenMin,
      thirtyMin,
      sixtyMin,
    } = req.body;

    // Check if all required parameters are present
    if (
      id === undefined ||
      conditionID === undefined ||
      oneMin === undefined ||
      twoMin === undefined ||
      threeMin === undefined ||
      fiveMin === undefined ||
      tenMin === undefined ||
      fifteenMin === undefined ||
      thirtyMin === undefined ||
      sixtyMin === undefined
    ) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters are required",
      });
    }

    // Update the scan item in the database
    const [results] = await db.sequelize.query(
      `
      UPDATE scanitems
      SET conditionID = ?, \`1min\` = ?, \`2min\` = ?, \`3min\` = ?, \`5min\` = ?, \`10min\` = ?, \`15min\` = ?, \`30min\` = ?, \`60min\` = ?
      WHERE id = ?;
    `,
      {
        replacements: [
          conditionID,
          oneMin,
          twoMin,
          threeMin,
          fiveMin,
          tenMin,
          fifteenMin,
          thirtyMin,
          sixtyMin,
          id,
        ],
      }
    );

    // Return success response
    return sendResponse({
      res,
      success: true,
      message: "Scan item updated successfully",
      response_code: ResponseCodes.OK,
      data: results,
    });
  });

  static insertScanItem = catchAsync(async (req, res) => {
    const {
      scanID,
      conditionID,
      oneMin,
      twoMin,
      threeMin,
      fiveMin,
      tenMin,
      fifteenMin,
      thirtyMin,
      sixtyMin,
    } = req.body;

    if (
      scanID === undefined ||
      conditionID === undefined ||
      oneMin === undefined ||
      twoMin === undefined ||
      threeMin === undefined ||
      fiveMin === undefined ||
      tenMin === undefined ||
      fifteenMin === undefined ||
      thirtyMin === undefined ||
      sixtyMin === undefined
    ) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters are required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      INSERT INTO scanitems (scanID, conditionID, \`1min\`, \`2min\`, \`3min\`, \`5min\`, \`10min\`, \`15min\`, \`30min\`, \`60min\`)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
      {
        replacements: [
          scanID,
          conditionID,
          oneMin,
          twoMin,
          threeMin,
          fiveMin,
          tenMin,
          fifteenMin,
          thirtyMin,
          sixtyMin,
        ],
      }
    );

    // Return success response
    return sendResponse({
      res,
      success: true,
      message: "Scan item inserted successfully",
      response_code: ResponseCodes.OK,
      data: results,
    });
  });
  static fetchCustomIndicatorBytype = catchAsync(async (req, res) => {
    const { indicator_id } = req.body;

    if (!indicator_id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "indicator_id is required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      SELECT id, name FROM custom_indicators WHERE active = 1 and indicator_id = ?;
    `,
      {
        replacements: [indicator_id],
      }
    );

    if (results.length === 0) {
      return sendResponse({
        res,
        success: false,
        message: "No custom indicator found for the given indicator_id",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    const customIndicator = results.map((item) => ({
      name: item.name,
      id: item.id,
    }));

    // Send the response
    return sendResponse({
      res,
      success: true,
      message: "Custom indicator by indicator_id retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: customIndicator,
    });
  });

  static getAlerts = catchAsync(async (req, res) => {
    const { page = 1, limit = 100 } = req.query;

    const _page = Number(page);
    const _limit = Number(limit);
    const offset = (_page - 1) * _limit;

    const [results] = await db.sequelize.query(
      `
      SELECT 
        a.id, 
        a.symbol, 
        a.datetime, 
        s.name, 
        a.timeframe, 
        s.id as scanid 
      FROM 
        alerts a 
      LEFT JOIN 
        scans s ON a.scanid = s.id 
      LEFT JOIN 
        conditions c ON a.conditionID = c.id 
      WHERE 
        a.deleted = 0 
        AND MONTH(a.datetime) = MONTH(CURRENT_DATE()) 
        AND YEAR(a.datetime) = YEAR(CURRENT_DATE())
      ORDER BY 
        a.datetime DESC, 
        a.system_time DESC 
      LIMIT 
        ${_limit} OFFSET ${offset};
      `
    );

    const alerts = results.map((result) => ({
      id: result.id,
      symbol: result.symbol,
      datetime: moment(result.datetime).utc().format("YYYY-MM-DD HH:mm:ss"),
      scan: result.name,
      timeframe: result.timeframe,
      scanid: result.scanid,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Alerts retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: alerts,
    });
  });

  static gethlfp = catchAsync(async (req, res) => {
    const [results] = await db.sequelize.query(
      `SELECT id, kLineThresholdOne, psarCandlesOne, kLineThresholdTwo, psarCandlesTwo, kLineThresholdThree, psarCandlesThree FROM hlfp;`
    );

    const hlfp = results.map((result) => ({
      id: result.id,
      kLineThresholdOne: result.kLineThresholdOne,
      psarCandlesOne: result.psarCandlesOne,
      kLineThresholdTwo: result.kLineThresholdTwo,
      psarCandlesTwo: result.psarCandlesTwo,
      kLineThresholdThree: result.kLineThresholdThree,
      psarCandlesThree: result.psarCandlesThree,
    }));

    return sendResponse({
      res,
      success: true,
      message: "hlfp retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: hlfp,
    });
  });
  static updateHlfp = catchAsync(async (req, res) => {
    const {
      kLineThresholdOne,
      psarCandlesOne,
      kLineThresholdTwo,
      psarCandlesTwo,
      kLineThresholdThree,
      psarCandlesThree,
    } = req.body;

    if (
      !kLineThresholdTwo ||
      !psarCandlesOne ||
      !kLineThresholdOne ||
      !psarCandlesTwo ||
      !kLineThresholdThree ||
      !psarCandlesThree
    ) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "All parameters like kLineThresholdTwo are required",
      });
    }

    // Execute the update query
    const [results] = await db.sequelize.query(
      `
      UPDATE hlfp
      SET kLineThresholdOne = ?, 
      psarCandlesOne = ? , 
      kLineThresholdTwo = ?, 
      psarCandlesTwo = ?, 
      kLineThresholdThree = ?, 
      psarCandlesThree = ? where id = 1;
    `,
      {
        replacements: [
          kLineThresholdOne,
          psarCandlesOne,
          kLineThresholdTwo,
          psarCandlesTwo,
          kLineThresholdThree,
          psarCandlesThree,
        ],
      }
    );

    // Check if any rows were affected
    if (results.affectedRows === 0) {
      return sendResponse({
        res,
        success: false,
        message: "hlfp not found or no changes made",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    return sendResponse({
      res,
      success: true,
      message: "hlfp updated successfully",
      response_code: ResponseCodes.OK,
    });
  });

  static deleteAlert = catchAsync(async (req, res) => {
    const { id } = req.body;

    if (!id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID is required",
      });
    }

    const [results] = await db.sequelize.query(
      `
      update alerts set deleted = 1
      WHERE id = ?;
    `,
      {
        replacements: [id],
      }
    );

    if (results.affectedRows === 0) {
      return sendResponse({
        res,
        success: false,
        message: "Alert not found or already inactive",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    return sendResponse({
      res,
      success: true,
      message: "Alert deleted successfully",
      response_code: ResponseCodes.OK,
    });
  });

  static getAlertsBySymbol = catchAsync(async (req, res) => {
    //console.log('req.body', req.body);
    const { symbol, timeframe } = req.body;

    if (!symbol || !timeframe) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "symbol and timeframe are required",
      });
    }
    const [results] = await db.sequelize.query(
      `SELECT a.datetime, a.scanid, c.signalColor from alerts a left join conditions c on a.conditionID = c.id where symbol = ? and timeframe = ? and deleted = 0;
    `,
      {
        replacements: [symbol, timeframe],
      }
    );

    const alerts = results.map((result) => ({
      datetime: moment(result.datetime).utc().format("YYYY-MM-DD HH:mm:ss"),
      scan: result.scanid,
      timeframe: result.timeframe,
      color: result.signalColor,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Alerts for symbol retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: alerts,
    });
  });
  static getScanIndicatorsById = catchAsync(async (req, res) => {
    const { scanid } = req.body;

    if (!scanid) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "scanid parameter is required",
      });
    }

    const [result] = await db.sequelize.query(
      `
      CALL GetScanIndicators(?);
    `,
      {
        replacements: [scanid],
      }
    );

    if (!result) {
      return sendResponse({
        res,
        success: false,
        message: "No indicators found for the given scan ID",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    const indicators = {
      lrc: result.lrc,
      psar: result.psar,
      stoch: result.stoch,
      signalColor: result.signal_value,
    };

    return sendResponse({
      res,
      success: true,
      message: "Indicators retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: indicators,
    });
  });
}

module.exports = DataController;
