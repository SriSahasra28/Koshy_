const moment = require("moment-timezone");
const db = require("../db/sequelize");
const { catchAsync } = require("../utils/catchAsync.utils");
const ResponseCodes = require("../utils/responseCodes");
const { sendResponse } = require("../utils/utils.common");
const { CommonEnums } = require("../utils/common.enums");
const { APIError } = require("../middlewares/errorHandler.middleware");
const { calcHeikinAshi } = require("../utils/utils.common");
const { Op } = require("sequelize");
const fetchHistoricalData = require("./fetchKiteData");
const { getOhlcBySymbol, getResampledOhlcBySymbol, getCandleDataBySymbol, getIndicatorDataBySymbol } = require("./fetchRedisData");


const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");


class DataController {
  static getData = catchAsync(async (req, res) => {
    const { symbol, interval } = req.query;
    console.log("symoriterval:", interval);

    let resampleMinutes = 1;

    if (interval == CommonEnums.intervals.one_min) {
      resampleMinutes = 1;
    }
    if (interval == CommonEnums.intervals.two_min) {
      resampleMinutes = 2;
    }
    if (interval == CommonEnums.intervals.three_min) {
      resampleMinutes = 3;
    }
    if (interval == CommonEnums.intervals.five_min) {
      resampleMinutes = 5;
    }
    if (interval == CommonEnums.intervals.ten_min) {
      resampleMinutes = 10;
    }
    if (interval == CommonEnums.intervals.fifteen_min) {
      resampleMinutes = 15;
    }
    if (interval == CommonEnums.intervals.thirty_min) {
      resampleMinutes = 30;
    }
    if (interval == CommonEnums.intervals.one_hour) {
      resampleMinutes = 60;
    }

    try {
      // Get current date and time in IST timezone
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istDate = new Date(now.getTime() + istOffset);
      const currentTime = istDate.toISOString().slice(0, 19).replace("T", " ");
      const today = new Date(istDate.getFullYear(), istDate.getMonth(), istDate.getDate());

      // Calculate 6 months ago date
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const from_date_str = sixMonthsAgo.toISOString().slice(0, 19).replace("T", " ");
      const to_date_str = currentTime;

      console.log(`Fetching 1-minute data from database from ${from_date_str} to ${to_date_str}`);

      // Fetch 1-minute data from database
      const results = await db.sequelize.query(
        `SELECT DATE_FORMAT(datetime, '%Y-%m-%d %H:%i:%s') AS datetime, open, high, low, close FROM one_min_ohlc 
         WHERE symbol = :symbol 
         AND datetime BETWEEN :from_date AND :to_date 
         ORDER BY datetime`,
        {
          replacements: {
            symbol: symbol?.trim(),
            from_date: from_date_str,
            to_date: to_date_str
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!results || results.length === 0) {
        return sendResponse({
          res,
          success: false,
          message: "No data found for the specified symbol and date range",
          response_code: ResponseCodes.GET_NOT_FOUND,
        });
      }

      console.log(`Found ${results.length} 1-minute records from database`);

      // Convert database results to the format expected by resampling function
      let allData = results.map(row => ({
        datetime: row.datetime,
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close)
      }));

      // Resample data if interval is greater than 1 minute
      if (resampleMinutes > 1) {
        console.log(`Resampling data to ${resampleMinutes} minute intervals`);
        allData = DataController.resampleOHLCData(allData, resampleMinutes);
      }

      // Prepare the data for Heikin-Ashi calculation
      const openPrices = allData.map((row) => parseFloat(row.open));
      const highPrices = allData.map((row) => parseFloat(row.high));
      const lowPrices = allData.map((row) => parseFloat(row.low));
      const closePrices = allData.map((row) => parseFloat(row.close));

      // Calculate Heikin-Ashi values
      const { haOpen, haHigh, haLow, haClose } = calcHeikinAshi(
        openPrices,
        highPrices,
        lowPrices,
        closePrices
      );

      // Build the chart data including Heikin-Ashi values
      let chartData = allData.map((row, index) => {
        // Datetime is already a formatted string from DB; do not convert
        row.ha_open = haOpen[index];
        row.ha_high = haHigh[index];
        row.ha_low = haLow[index];
        row.ha_close = haClose[index];
        return row;
      });

      return sendResponse({
        res,
        success: true,
        message: "Data retrieved successfully from database",
        response_code: ResponseCodes.GET_SUCCESS,
        data: chartData,
      });
    } catch (error) {
      console.error("Error in getData:", error);
      return sendResponse({
        res,
        success: false,
        message: "Error retrieving data from database",
        response_code: ResponseCodes.GET_ERROR,
        error: error.message,
      });
    }
  });

  // Database-based getDataV2 method - fetches from one_min_ohlc and resamples
  static getDataV2 = catchAsync(async (req, res) => {
    const { symbol, interval } = req.query;

    let resampleMinutes = 1;

    if (interval == CommonEnums.intervals.two_min) {
      resampleMinutes = 2;
    }
    if (interval == CommonEnums.intervals.three_min) {
      resampleMinutes = 3;
    }
    if (interval == CommonEnums.intervals.five_min) {
      resampleMinutes = 5;
    }
    if (interval == CommonEnums.intervals.ten_min) {
      resampleMinutes = 10;
    }
    if (interval == CommonEnums.intervals.fifteen_min) {
      resampleMinutes = 15;
    }
    if (interval == CommonEnums.intervals.thirty_min) {
      resampleMinutes = 30;
    }
    if (interval == CommonEnums.intervals.one_hour) {
      resampleMinutes = 60;
    }

    console.log("symbol:", symbol, "interval:", interval, "resampleMinutes:", resampleMinutes);

    try {
      // Calculate start date (45 days before current date at 09:15 AM) - SAME AS BACKEND
      const currentDate = new Date();
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 30);
      startDate.setHours(9, 15, 0, 0); // 09:15:00 AM

      const from_date_str = startDate.toISOString().slice(0, 19).replace("T", " ");

      console.log(`Fetching 1-minute data from database from ${from_date_str} onwards`);

      // Fetch 1-minute data from database
      const results = await db.sequelize.query(
        `SELECT DATE_FORMAT(datetime, '%Y-%m-%d %H:%i:%s') AS datetime, open, high, low, close FROM one_min_ohlc 
         WHERE symbol = :symbol 
         AND datetime >= :from_date 
         ORDER BY datetime`,
        {
          replacements: {
            symbol: symbol?.trim(),
            from_date: from_date_str
          },
          type: db.sequelize.QueryTypes.SELECT,
        }
      );

      if (!results || results.length === 0) {
        return sendResponse({
          res,
          success: false,
          message: "No data found for the specified symbol and date range",
          response_code: ResponseCodes.GET_NOT_FOUND,
        });
      }

      console.log(`✅ Found ${results.length} 1-minute records from database`);
      console.log(`   First record: ${results[0].datetime} (O:${results[0].open} H:${results[0].high} L:${results[0].low} C:${results[0].close})`);
      console.log(`   Last record: ${results[results.length - 1].datetime} (O:${results[results.length - 1].open} H:${results[results.length - 1].high} L:${results[results.length - 1].low} C:${results[results.length - 1].close})`);

      // Convert database results to the format expected by resampling function
      let allData = results.map(row => ({
        datetime: row.datetime,
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close)
      }));

      // Forward-fill missing 1-minute candles (same as Python backend)
      allData = DataController.forwardFillMissingMinutes(allData);

      // Resample data if interval is greater than 1 minute
      if (resampleMinutes > 1) {
        console.log(`Resampling data to ${resampleMinutes} minute intervals`);
        allData = DataController.resampleOHLCData(allData, resampleMinutes);
        if (!allData || allData.length === 0) {
          throw new Error("No data after resampling - insufficient data for requested timeframe");
        }
      }

      const lastTenItems = allData.slice(-10);
      console.log("Last 10 items:", lastTenItems);

      const openPrices = allData.map((row) => parseFloat(row.open));
      const highPrices = allData.map((row) => parseFloat(row.high));
      const lowPrices = allData.map((row) => parseFloat(row.low));
      const closePrices = allData.map((row) => parseFloat(row.close));

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
      const chartData = allData.map((row, index) => {
        // Datetime is already a formatted string from DB; do not convert
        row.ha_open = haOpen[index];
        row.ha_high = haHigh[index];
        row.ha_low = haLow[index];
        row.ha_close = haClose[index];
        return row;
      });

      return sendResponse({
        res,
        success: true,
        message: "Data retrieved successfully from database",
        response_code: ResponseCodes.GET_SUCCESS,
        data: chartData,
      });
    } catch (error) {
      console.error("❌ Error in getDataV2:", error);
      console.error("❌ Error stack:", error.stack);
      return sendResponse({
        res,
        success: false,
        message: "Error retrieving data from database",
        response_code: ResponseCodes.GET_ERROR,
        error: error.message,
      });
    }
  });


  // Helper function to forward-fill missing 1-minute candles (MATCH PYTHON BACKEND)
  static forwardFillMissingMinutes(data) {
    if (!data || data.length === 0) return data;

    const result = [];
    const MARKET_START_HOUR = 9;
    const MARKET_START_MINUTE = 15;

    // Group by date
    const dataByDate = {};
    data.forEach(item => {
      const date = new Date(item.datetime);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = [];
      }
      dataByDate[dateKey].push(item);
    });

    // Process each day
    Object.keys(dataByDate).sort().forEach(dateKey => {
      const dayData = dataByDate[dateKey].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

      // Find date boundaries
      const firstCandle = dayData[0];
      const lastCandle = dayData[dayData.length - 1];
      const date = new Date(firstCandle.datetime);

      // Create expected minute sequence for this day (09:15 to 15:29)
      const marketOpen = new Date(date.getFullYear(), date.getMonth(), date.getDate(), MARKET_START_HOUR, MARKET_START_MINUTE, 0);
      const marketClose = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 15, 29, 0);

      const expectedMinutes = [];
      for (let time = new Date(marketOpen); time <= marketClose; time.setMinutes(time.getMinutes() + 1)) {
        expectedMinutes.push(new Date(time));
      }

      // Create a map of existing data
      const dataMap = {};
      dayData.forEach(candle => {
        const candleTime = new Date(candle.datetime);
        dataMap[candleTime.getTime()] = candle;
      });

      // Fill gaps using forward-fill
      let lastClose = null;
      expectedMinutes.forEach(time => {
        const timeKey = time.getTime();
        if (dataMap[timeKey]) {
          result.push(dataMap[timeKey]);
          lastClose = parseFloat(dataMap[timeKey].close);
        } else if (lastClose !== null) {
          // Forward-fill with last close
          const filledCandle = {
            datetime: time.getFullYear() + '-' +
              String(time.getMonth() + 1).padStart(2, '0') + '-' +
              String(time.getDate()).padStart(2, '0') + ' ' +
              String(time.getHours()).padStart(2, '0') + ':' +
              String(time.getMinutes()).padStart(2, '0') + ':00',
            open: lastClose,
            high: lastClose,
            low: lastClose,
            close: lastClose,
            volume: 0
          };
          result.push(filledCandle);
        }
      });
    });

    return result;
  }

  static resampleOHLCData(data, intervalMinutes) {
    console.log(`🔍 Resampling ${data.length} candles to ${intervalMinutes}-minute intervals`);
    // Diagnostics: input length and time bounds
    try {
      if (data && data.length) {
        const times = data.map(r => {
          if (r.datetime instanceof Date) return r.datetime.getTime();
          return new Date(r.datetime).getTime();
        }).filter(v => !Number.isNaN(v));
        if (times.length) {
          const minTs = new Date(Math.min(...times));
          const maxTs = new Date(Math.max(...times));
          console.log(`[JS Resample] interval=${intervalMinutes} | len=${data.length} | start=${minTs.toISOString()} | end=${maxTs.toISOString()}`);
        }
      }
    } catch (e) {
      console.log(`[JS Resample] diagnostics error:`, e);
    }

    if (intervalMinutes === 1) {
      return data;
    }

    if (!data || data.length === 0 || data.length < intervalMinutes) {
      console.log(`❌ Insufficient data for ${intervalMinutes}-minute resampling`);
      return [];
    }

    const resampledData = [];

    // Market start time constants (9:15 AM IST)
    const MARKET_START_HOUR = 9;
    const MARKET_START_MINUTE = 15;
    const marketStartMinutes = MARKET_START_HOUR * 60 + MARKET_START_MINUTE; // 555 minutes

    // Group data by proper time intervals aligned to market start
    const groups = {};

    data.forEach((item, index) => {
      // Handle both Date objects and strings - convert to IST
      let dateIST;
      if (item.datetime instanceof Date) {
        // Convert UTC Date to IST moment
        dateIST = moment(item.datetime).tz('Asia/Kolkata');
      } else if (typeof item.datetime === 'string') {
        // Parse string and ensure it's in IST
        dateIST = moment(item.datetime).tz('Asia/Kolkata');
      } else {
        console.log(`⚠️ Invalid datetime type at index ${index}:`, typeof item.datetime);
        return;
      }

      // Validate date
      if (!dateIST.isValid()) {
        console.log(`⚠️ Invalid date at index ${index}:`, item.datetime);
        return;
      }

      // Calculate minutes from midnight (IST)
      const totalMinutesFromMidnight = dateIST.hours() * 60 + dateIST.minutes();

      // Skip pre-market data
      if (totalMinutesFromMidnight < marketStartMinutes) {
        return;
      }

      // Calculate minutes from market start
      const minutesFromMarketStart = totalMinutesFromMidnight - marketStartMinutes;

      // Calculate interval group (matching pandas logic: origin='start_day', offset='15min')
      const intervalGroup = Math.floor(minutesFromMarketStart / intervalMinutes) * intervalMinutes;
      const groupTotalMinutes = marketStartMinutes + intervalGroup;
      const groupHours = Math.floor(groupTotalMinutes / 60);
      const groupMinutes = groupTotalMinutes % 60;

      // Create group key using IST date
      const groupKey = moment.tz(
        [dateIST.year(), dateIST.month(), dateIST.date(), groupHours, groupMinutes, 0, 0],
        'Asia/Kolkata'
      ).valueOf();

      // Initialize group if it doesn't exist
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      // Add item to the appropriate group
      groups[groupKey].push(item);
    });

    console.log(`📊 Created ${Object.keys(groups).length} groups`);

    let processedCount = 0;

    // Process each group to create resampled candles
    Object.keys(groups).forEach(groupKey => {
      const groupData = groups[groupKey];

      if (groupData.length > 0) {
        // Sort group data by datetime to ensure proper order
        const sortedGroupData = groupData.sort((a, b) => {
          const dateA = a.datetime instanceof Date ? a.datetime.getTime() : new Date(a.datetime).getTime();
          const dateB = b.datetime instanceof Date ? b.datetime.getTime() : new Date(b.datetime).getTime();
          return dateA - dateB;
        });

        // Use the aligned datetime from the group key (START time of interval in IST)
        const alignedDateTimeIST = moment(parseInt(groupKey)).tz('Asia/Kolkata');

        // Extract OHLC values with proper numeric conversion
        const openValues = sortedGroupData.map(candle => parseFloat(candle.open));
        const highValues = sortedGroupData.map(candle => parseFloat(candle.high));
        const lowValues = sortedGroupData.map(candle => parseFloat(candle.low));
        const closeValues = sortedGroupData.map(candle => parseFloat(candle.close));
        const volumeValues = sortedGroupData.map(candle => parseFloat(candle.volume || 0));

        // Calculate OHLC exactly like pandas
        const resampledCandle = {
          datetime: alignedDateTimeIST.format('YYYY-MM-DD HH:mm:ss'),
          open: openValues[0],                              // 'first'
          high: Math.max(...highValues),                    // 'max'
          low: Math.min(...lowValues),                      // 'min'
          close: closeValues[closeValues.length - 1],       // 'last'
          volume: volumeValues.reduce((sum, vol) => sum + vol, 0)  // 'sum'
        };

        resampledData.push(resampledCandle);
        processedCount++;
      }
    });

    console.log(`✅ Processed ${processedCount} resampled candles`);
    console.log(`✅ Final resampled data: ${resampledData.length} candles`);

    // Sort by datetime (matching pandas default behavior)
    return resampledData.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }
  // static getDataV2 = catchAsync(async (req, res) => {
  //   const { symbol, interval } = req.query;

  //   let interval_name = "minute";

  //   if (interval == CommonEnums.intervals.two_min) {
  //     interval_name = "2minute";
  //   }
  //   if (interval == CommonEnums.intervals.three_min) {
  //     interval_name = "3minute";
  //   }
  //   if (interval == CommonEnums.intervals.five_min) {
  //     interval_name = "5minute";
  //   }
  //   if (interval == CommonEnums.intervals.ten_min) {
  //     interval_name = "10minute";
  //   }
  //   if (interval == CommonEnums.intervals.fifteen_min) {
  //     interval_name = "15minute";
  //   }
  //   if (interval == CommonEnums.intervals.thirty_min) {
  //     interval_name = "30minute";
  //   }
  //   if (interval == CommonEnums.intervals.one_hour) {
  //     interval_name = "60minute";
  //   }

  //   const [tokenResult] = await db.sequelize.query(
  //     "SELECT instrument_token FROM instruments WHERE tradingsymbol = :symbol",
  //     {
  //       replacements: { symbol: symbol?.trim() },
  //       type: db.sequelize.QueryTypes.SELECT,
  //     }
  //   );
  //   console.log("TOKENRESULTTT", tokenResult)
  //   if (!tokenResult) {
  //     return sendResponse({
  //       res,
  //       success: false,
  //       message: "Instrument not found",
  //       response_code: ResponseCodes.GET_NOT_FOUND,
  //     });
  //   }
  //   const token = tokenResult.instrument_token;
  //   // Get Data from Kite Connect
  //   const to_date = new Date();
  //   const from_date = new Date(to_date);
  //   let days = 95; // Set default days to 95
  //   if (interval_name === "minute" || interval_name === "2minute") {
  //     days = 1; // Change to 50 if 'minute' or '2minute' interval is chosen
  //   }

  //   from_date.setDate(to_date.getDate() - days);
  //   const from_date_str = from_date
  //     .toISOString()
  //     .slice(0, 19)
  //     .replace("T", " ");
  //   const to_date_ist = new Date(to_date.getTime() + 19800000); // Adjust to IST
  //   const to_date_str_ist = to_date_ist
  //     .toISOString()
  //     .slice(0, 19)
  //     .replace("T", " ");
  //   // for 2 minute fetch 1 minute & resample
  //   try {
  //     let interval_name_two = interval_name;
  //     if (interval_name === "2minute") {
  //       interval_name_two = "minute";
  //     }
  //     console.log(from_date_str, to_date_str_ist,interval_name_two, token , "HHHH")
  //     let results = await fetchHistoricalData(
  //       token,
  //       interval_name_two,
  //       from_date_str,
  //       to_date_str_ist
  //     );
  //     console.log(results, "RESULTTT")
  //     if (!results || results.length === 0) {
  //       return sendResponse({
  //         res,
  //         success: false,
  //         message: "No historical data found",
  //         response_code: ResponseCodes.GET_NOT_FOUND,
  //       });
  //     }
  //     if (interval_name === "2minute") {
  //       console.log("in interval_name === 2minute");
  //       const resampledResults = [];

  //       for (let i = 0; i < results.length; i += 2) {
  //         const firstCandle = results[i];
  //         const secondCandle = results[i + 1] || firstCandle;

  //         const resampledCandle = {
  //           datetime: firstCandle.datetime, // Use the datetime of the first minute
  //           open: firstCandle.open, // Open price of the first minute
  //           high: Math.max(firstCandle.high, secondCandle.high), // Highest high between the two minutes
  //           low: Math.min(firstCandle.low, secondCandle.low), // Lowest low between the two minutes
  //           close: secondCandle.close, // Close price of the second minute
  //         };

  //         // Add the new 2-minute candle to the resampled data
  //         resampledResults.push(resampledCandle);
  //       }
  //       results = resampledResults;
  //     }

  //     const lastTenItems = results.slice(-10);
  //     console.log(lastTenItems);

  //     const openPrices = results.map((row) => parseFloat(row.open));
  //     const highPrices = results.map((row) => parseFloat(row.high));
  //     const lowPrices = results.map((row) => parseFloat(row.low));
  //     const closePrices = results.map((row) => parseFloat(row.close));

  //     // Ensure the lengths match before calculations
  //     if (
  //       [
  //         openPrices.length,
  //         highPrices.length,
  //         lowPrices.length,
  //         closePrices.length,
  //       ].some((length) => length !== openPrices.length)
  //     ) {
  //       throw new Error("Mismatched lengths in historical data");
  //     }

  //     // Calculate Heikin-Ashi values
  //     const { haOpen, haHigh, haLow, haClose } = calcHeikinAshi(
  //       openPrices,
  //       highPrices,
  //       lowPrices,
  //       closePrices
  //     );

  //     // Build the chart data including Heikin-Ashi values
  //     const chartData = results.map((row, index) => {
  //       //row.datetime = moment(row.datetime).utc().format("YYYY-MM-DD HH:mm:ss"); // Convert to UTC format
  //       row.ha_open = haOpen[index];
  //       row.ha_high = haHigh[index];
  //       row.ha_low = haLow[index];
  //       row.ha_close = haClose[index];
  //       return row;
  //     });

  //     return sendResponse({
  //       res,
  //       success: true,
  //       message: "Data retrieved successfully",
  //       response_code: ResponseCodes.GET_SUCCESS,
  //       data: chartData,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching historical data:", error);
  //     return sendResponse({
  //       res,
  //       success: false,
  //       message: "Error fetching historical data",
  //       response_code: ResponseCodes.GET_ERROR,
  //       error: error.message,
  //     });
  //   }
  // });

  static getData_redis = catchAsync(async (req, res) => {
    const { symbol, interval } = req.query;

    // Convert interval to interval string format (e.g., '1minute', '2minute', etc.)
    let intervalStr = '1minute';
    if (interval == CommonEnums.intervals.two_min) {
      intervalStr = '2minute';
    } else if (interval == CommonEnums.intervals.three_min) {
      intervalStr = '3minute';
    } else if (interval == CommonEnums.intervals.five_min) {
      intervalStr = '5minute';
    } else if (interval == CommonEnums.intervals.ten_min) {
      intervalStr = '10minute';
    } else if (interval == CommonEnums.intervals.fifteen_min) {
      intervalStr = '15minute';
    } else if (interval == CommonEnums.intervals.thirty_min) {
      intervalStr = '30minute';
    } else if (interval == CommonEnums.intervals.one_hour) {
      intervalStr = '60minute';
    }

    try {
      // FIRST: Check if candle_data key exists (contains OHLC + HA only, no indicators)
      console.log(`🔍 Checking candle_data for ${symbol} ${intervalStr}`);
      const candleData = await getCandleDataBySymbol(symbol, intervalStr);

      if (candleData && candleData.length > 0) {
        // candle_data exists - return OHLC + HA only (indicators calculated on frontend)
        console.log(`✅ Using candle_data for ${symbol} ${intervalStr} (${candleData.length} candles)`);

        // Format the data to match frontend expectations (OHLC + HA only, no indicators)
        const chartData = candleData.map(row => ({
          datetime: row.datetime, // Already formatted string
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume || 0,
          // HA values already included (universal, same for all conditions)
          ha_open: row.ha_open,
          ha_high: row.ha_high,
          ha_low: row.ha_low,
          ha_close: row.ha_close
          // NOTE: Indicator values (PSAR, Stochastic) are NOT included
          // because they are condition-specific and calculated on frontend
        }));

        return sendResponse({
          res,
          success: true,
          message: "Data retrieved successfully from candle_data (OHLC + HA only)",
          response_code: ResponseCodes.GET_SUCCESS,
          data: chartData,
        });
      }

      // FALLBACK: candle_data doesn't exist - use regular flow
      console.log(`⚠️ candle_data not found - falling back to regular flow for ${symbol} ${intervalStr}`);

      // Fetch pre-resampled data (including 1-minute)
      console.log(`🔍 Fetching pre-resampled data for ${symbol} ${intervalStr}`);
      const results = await getResampledOhlcBySymbol(symbol, intervalStr);

      if (!results || results.length === 0) {
        return sendResponse({
          res,
          success: false,
          message: "No historical data found",
          response_code: ResponseCodes.GET_NOT_FOUND,
        });
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

      // Calculate Heikin-Ashi values (frontend will calculate PSAR and Stochastic)
      const { haOpen, haHigh, haLow, haClose } = calcHeikinAshi(
        openPrices,
        highPrices,
        lowPrices,
        closePrices
      );

      // Build the chart data including Heikin-Ashi values (OHLC + HA only, no indicators)
      const chartData = results.map((row, index) => {
        // Format datetime consistently (handle both Date objects and strings)
        let formattedDatetime;
        if (row.datetime instanceof Date) {
          // From getOhlcBySymbol (before resampling or if interval=1)
          const dt = row.datetime;
          formattedDatetime = dt.getFullYear() + '-' +
            String(dt.getMonth() + 1).padStart(2, '0') + '-' +
            String(dt.getDate()).padStart(2, '0') + ' ' +
            String(dt.getHours()).padStart(2, '0') + ':' +
            String(dt.getMinutes()).padStart(2, '0') + ':' +
            String(dt.getSeconds()).padStart(2, '0');
        } else {
          // From resampleOHLCData (already formatted string)
          formattedDatetime = row.datetime;
        }

        return {
          datetime: formattedDatetime,
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume || 0,
          ha_open: haOpen[index],
          ha_high: haHigh[index],
          ha_low: haLow[index],
          ha_close: haClose[index]
          // NOTE: Indicator values (PSAR, Stochastic) are NOT included
          // because they are condition-specific and calculated on frontend
        };
      });

      return sendResponse({
        res,
        success: true,
        message: "Data retrieved successfully (OHLC + HA calculated on server)",
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

  static getData_redisv2 = catchAsync(async (req, res) => {
    const { symbol, interval } = req.query;

    // Convert interval to interval string format (e.g., '1minute', '2minute', etc.)
    let intervalStr = '1minute';
    if (interval == CommonEnums.intervals.two_min) {
      intervalStr = '2minute';
    } else if (interval == CommonEnums.intervals.three_min) {
      intervalStr = '3minute';
    } else if (interval == CommonEnums.intervals.five_min) {
      intervalStr = '5minute';
    } else if (interval == CommonEnums.intervals.ten_min) {
      intervalStr = '10minute';
    } else if (interval == CommonEnums.intervals.fifteen_min) {
      intervalStr = '15minute';
    } else if (interval == CommonEnums.intervals.thirty_min) {
      intervalStr = '30minute';
    } else if (interval == CommonEnums.intervals.one_hour) {
      intervalStr = '60minute';
    }

    // OPTIMIZED: Limit number of candles fetched for faster API response
    // For 1min and 2min intervals, fetch only last N candles (much faster)
    // For longer intervals, fetch more candles or all
    let lastNCandles = 50000; // null = fetch all in date range
    // if (interval == CommonEnums.intervals.one_min) {
    //   lastNCandles = 1000; // Last 1000 candles (~16.7 hours of 1-min data)
    // } else if (interval == CommonEnums.intervals.two_min) {
    //   lastNCandles = 750;  // Last 750 candles (~25 hours of 2-min data)
    // } else if (interval == CommonEnums.intervals.three_min) {
    //   lastNCandles = 500;  // Last 500 candles (~25 hours of 3-min data)
    // } else if (interval == CommonEnums.intervals.five_min) {
    //   lastNCandles = 500;  // Last 500 candles (~41.7 hours of 5-min data)
    // }
    // For 10min, 15min, 30min, 60min: fetch all (null = no limit)

    try {
      // FIRST: Check if candle_data key exists (contains OHLC + HA only, no indicators)
      console.log(`🔍 [getData_redisv2] Checking candle_data for ${symbol} ${intervalStr}${lastNCandles ? ` (last ${lastNCandles} candles)` : ''}`);
      const candleData = await getCandleDataBySymbol(symbol, intervalStr, lastNCandles);

      let chartData = [];
      let psarDataMap = null;
      let stochDataMap = null;

      if (candleData && candleData.length > 0) {
        // candle_data exists - return OHLC + HA
        console.log(`✅ [getData_redisv2] Using candle_data for ${symbol} ${intervalStr} (${candleData.length} candles)`);

        // Format the data to match frontend expectations (OHLC + HA)
        chartData = candleData.map(row => ({
          datetime: row.datetime, // Already formatted string
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume || 0,
          // HA values already included (universal, same for all conditions)
          ha_open: row.ha_open,
          ha_high: row.ha_high,
          ha_low: row.ha_low,
          ha_close: row.ha_close
        }));

        // NOW: Check for indicator data (PSAR and Stochastic)
        // Get PSAR settings to construct key
        const [psarSettings] = await db.sequelize.query(
          `SELECT acceleration, max_acceleration FROM psar_settings LIMIT 1;`
        );

        // Get Stochastic settings to construct key
        const [stochSettings] = await db.sequelize.query(
          `SELECT period, k_avg, d_avg FROM fast_stoch_settings LIMIT 1;`
        );

        if (psarSettings && psarSettings.length > 0) {
          const psarSetting = psarSettings[0];
          // Helper function to format numbers like Python f-strings
          // Based on Redis keys: integers stored as "14.0", decimals as "0.5" (no trailing zeros)
          const formatPythonFloat = (val) => {
            const num = parseFloat(val);
            // Python f-strings: integers become "14.0", decimals keep their format without trailing zeros
            if (Number.isInteger(num)) {
              return [`${num}.0`, num.toString()]; // Try "14.0" first (most common in Redis)
            }
            // For decimals, remove trailing zeros (0.5000 -> 0.5, 0.05 -> 0.05)
            return [num.toString().replace(/\.?0+$/, '')];
          };

          const maxAccelFormats = formatPythonFloat(psarSetting.max_acceleration);
          const accelFormats = formatPythonFloat(psarSetting.acceleration);

          // Try all combinations of formats (most likely first)
          for (const maxAccelStr of maxAccelFormats) {
            for (const accelStr of accelFormats) {
              const psarKey = `psar:${symbol}:${intervalStr}:${maxAccelStr}_${accelStr}`;
              console.log(`🔍 [getData_redisv2] Checking PSAR key: ${psarKey}`);
              psarDataMap = await getIndicatorDataBySymbol(symbol, intervalStr, psarKey, lastNCandles);
              if (psarDataMap) {
                console.log(`✅ [getData_redisv2] Found PSAR data (${psarDataMap.size} entries)`);
                break;
              }
            }
            if (psarDataMap) break;
          }

          if (!psarDataMap) {
            console.log(`⚠️ [getData_redisv2] PSAR data not found`);
          }
        }

        if (stochSettings && stochSettings.length > 0) {
          const stochSetting = stochSettings[0];
          // Helper function to format numbers like Python f-strings
          const formatPythonFloat = (val) => {
            const num = parseFloat(val);
            // Based on Redis: "14.0_3.0_3.0" - integers stored as "14.0"
            if (Number.isInteger(num)) {
              return [`${num}.0`, num.toString()]; // Try "14.0" first (matches Redis format)
            }
            // For decimals, remove trailing zeros
            return [num.toString().replace(/\.?0+$/, '')];
          };

          const periodFormats = formatPythonFloat(stochSetting.period);
          const kAvgFormats = formatPythonFloat(stochSetting.k_avg);
          const dAvgFormats = formatPythonFloat(stochSetting.d_avg);

          // Try all combinations of formats (most likely first)
          for (const periodStr of periodFormats) {
            for (const kAvgStr of kAvgFormats) {
              for (const dAvgStr of dAvgFormats) {
                const stochKey = `stoch_data:${symbol}:${intervalStr}:${periodStr}_${kAvgStr}_${dAvgStr}`;
                console.log(`🔍 [getData_redisv2] Checking Stochastic key: ${stochKey}`);
                stochDataMap = await getIndicatorDataBySymbol(symbol, intervalStr, stochKey, lastNCandles);
                if (stochDataMap) {
                  console.log(`✅ [getData_redisv2] Found Stochastic data (${stochDataMap.size} entries)`);
                  break;
                }
              }
              if (stochDataMap) break;
            }
            if (stochDataMap) break;
          }

          if (!stochDataMap) {
            console.log(`⚠️ [getData_redisv2] Stochastic data not found`);
          }
        }

        // Merge indicator data into chartData
        if (psarDataMap || stochDataMap) {
          let psarMatchedCount = 0;
          let stochMatchedCount = 0;

          chartData = chartData.map(row => {
            const timestamp = row.datetime;
            const updatedRow = { ...row };

            // Normalize timestamp format for matching (remove any extra spaces, ensure consistent format)
            const normalizedTimestamp = timestamp ? timestamp.trim() : null;

            // Add PSAR data if available
            if (psarDataMap && normalizedTimestamp) {
              if (psarDataMap.has(normalizedTimestamp)) {
                const psarEntry = psarDataMap.get(normalizedTimestamp);
                // Use !== undefined check to properly handle 0, null, and false values
                updatedRow.psar_value = psarEntry.psar_value !== undefined ? psarEntry.psar_value : psarEntry.value;
                updatedRow.psar_signal = psarEntry.signal !== undefined ? psarEntry.signal : null;
                psarMatchedCount++;
              }
            }

            // Add Stochastic data if available
            if (stochDataMap && normalizedTimestamp) {
              if (stochDataMap.has(normalizedTimestamp)) {
                const stochEntry = stochDataMap.get(normalizedTimestamp);
                // Use !== undefined check to properly handle 0, null, and false values
                updatedRow.stoch_k = stochEntry.k_value !== undefined ? stochEntry.k_value : stochEntry.value;
                updatedRow.stoch_d = stochEntry.d_value !== undefined ? stochEntry.d_value : stochEntry.value2;
                stochMatchedCount++;
              }
            }

            return updatedRow;
          });

          // Log merge statistics for debugging
          console.log(`📊 [getData_redisv2] Merge statistics: PSAR matched ${psarMatchedCount}/${chartData.length}, Stochastic matched ${stochMatchedCount}/${chartData.length}`);

          // Log sample of merged data for debugging
          if (chartData.length > 0) {
            const firstEntry = chartData[0];
            const lastEntry = chartData[chartData.length - 1];

            console.log(`📊 [getData_redisv2] Sample merged data (first entry):`, {
              datetime: firstEntry.datetime,
              has_psar_value: firstEntry.psar_value !== undefined,
              psar_value: firstEntry.psar_value,
              has_psar_signal: firstEntry.psar_signal !== undefined,
              psar_signal: firstEntry.psar_signal,
              has_stoch_k: firstEntry.stoch_k !== undefined,
              stoch_k: firstEntry.stoch_k,
              has_stoch_d: firstEntry.stoch_d !== undefined,
              stoch_d: firstEntry.stoch_d
            });
            console.log(`📊 [getData_redisv2] Sample merged data (last entry):`, {
              datetime: lastEntry.datetime,
              has_psar_value: lastEntry.psar_value !== undefined,
              psar_value: lastEntry.psar_value,
              has_psar_signal: lastEntry.psar_signal !== undefined,
              psar_signal: lastEntry.psar_signal,
              has_stoch_k: lastEntry.stoch_k !== undefined,
              stoch_k: lastEntry.stoch_k,
              has_stoch_d: lastEntry.stoch_d !== undefined,
              stoch_d: lastEntry.stoch_d
            });

            // Log sample indicator map keys for comparison
            if (psarDataMap && psarDataMap.size > 0) {
              const samplePsarKeys = Array.from(psarDataMap.keys()).slice(0, 3);
              console.log(`📊 [getData_redisv2] Sample PSAR map keys:`, samplePsarKeys);
            }
            if (stochDataMap && stochDataMap.size > 0) {
              const sampleStochKeys = Array.from(stochDataMap.keys()).slice(0, 3);
              console.log(`📊 [getData_redisv2] Sample Stochastic map keys:`, sampleStochKeys);
            }
          }
        }

        return sendResponse({
          res,
          success: true,
          message: psarDataMap || stochDataMap
            ? "Data retrieved successfully from candle_data with indicators"
            : "Data retrieved successfully from candle_data (OHLC + HA only)",
          response_code: ResponseCodes.GET_SUCCESS,
          data: chartData,
        });
      }

      // FALLBACK: candle_data doesn't exist - use regular flow
      console.log(`⚠️ [getData_redisv2] candle_data not found - falling back to regular flow for ${symbol} ${intervalStr}`);

      // Fetch pre-resampled data (including 1-minute)
      console.log(`🔍 [getData_redisv2] Fetching pre-resampled data for ${symbol} ${intervalStr}`);
      let results = await getResampledOhlcBySymbol(symbol, intervalStr);

      // FALLBACK: If pre-resampled data doesn't exist (e.g., 1-hour not configured), 
      // fetch 1-minute data and resample on-the-fly
      if (!results || results.length === 0) {
        console.log(`⚠️ [getData_redisv2] Pre-resampled data not found for ${symbol} ${intervalStr} - attempting on-the-fly resampling from 1-minute data`);

        // Only attempt on-the-fly resampling for non-1-minute intervals
        if (intervalStr !== '1minute') {
          // Fetch 1-minute data from Redis
          const oneMinData = await getOhlcBySymbol(symbol);

          // Only fetch from Kite if 1-minute data is not present in Redis
          if (!oneMinData || oneMinData.length === 0) {
            console.log(`⚠️ [getData_redisv2] No 1-minute data in Redis - fetching from Kite`);

            // Fetch from Kite historical API
            try {
              console.log(`📡 [getData_redisv2] Fetching last 5 days of 1-minute data from Kite for ${symbol}`);

              // Get instrument token from database
              const tokenResult = await db.sequelize.query(
                "SELECT instrument_token FROM instruments WHERE tradingsymbol = :symbol",
                {
                  replacements: { symbol: symbol?.trim() },
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );

              console.log(`🔍 [getData_redisv2] Token query result for ${symbol}:`, tokenResult);

              if (!tokenResult || !Array.isArray(tokenResult) || tokenResult.length === 0 || !tokenResult[0]) {
                console.log(`❌ [getData_redisv2] Instrument not found for symbol: ${symbol}`);
                return sendResponse({
                  res,
                  success: false,
                  message: "Instrument not found",
                  response_code: ResponseCodes.GET_NOT_FOUND,
                });
              }

              const token = tokenResult[0].instrument_token;

              if (!token) {
                console.log(`❌ [getData_redisv2] Instrument token is null/undefined for symbol: ${symbol}`);
                return sendResponse({
                  res,
                  success: false,
                  message: "Instrument token not found",
                  response_code: ResponseCodes.GET_NOT_FOUND,
                });
              }

              // Calculate date range (last 5 days)
              const to_date = new Date();
              const from_date = new Date(to_date);
              from_date.setDate(to_date.getDate() - 28);

              const from_date_str = from_date.toISOString().slice(0, 19).replace("T", " ");
              const to_date_str = to_date.toISOString().slice(0, 19).replace("T", " ");

              console.log(`📡 [getData_redisv2] Fetching from ${from_date_str} to ${to_date_str} for token ${token}`);

              // Fetch 1-minute data from Kite (always request 1-minute data)
              const kiteData = await fetchHistoricalData(token, "minute", from_date_str, to_date_str);

              if (!kiteData || kiteData.length === 0) {
                console.log(`❌ [getData_redisv2] No data returned from Kite API for ${symbol} (token: ${token})`);
                console.log(`   Date range: ${from_date_str} to ${to_date_str}`);
                console.log(`   Note: Newly added symbols may not have historical data yet. Wait for day_start_async.py to download data.`);
                return sendResponse({
                  res,
                  success: false,
                  message: `No historical data found from Kite API for ${symbol}. Symbol may be too new or data not available yet.`,
                  response_code: ResponseCodes.GET_NOT_FOUND,
                });
              }

              console.log(`✅ [getData_redisv2] Fetched ${kiteData.length} 1-minute candles from Kite`);

              // Convert Kite data to format expected by resampleOHLCData
              const formattedKiteData = kiteData.map(row => ({
                datetime: row.datetime,
                open: parseFloat(row.open),
                high: parseFloat(row.high),
                low: parseFloat(row.low),
                close: parseFloat(row.close),
                volume: parseFloat(row.volume || 0)
              }));

              // Forward-fill missing minutes
              const forwardFilledKiteData = DataController.forwardFillMissingMinutes(formattedKiteData);

              // Convert interval string to resample minutes
              const resampleMinutes = parseInt(intervalStr.replace('minute', '')) || 1;

              // Resample to requested interval
              results = DataController.resampleOHLCData(forwardFilledKiteData, resampleMinutes);

              if (!results || results.length === 0) {
                return sendResponse({
                  res,
                  success: false,
                  message: `No data after resampling to ${resampleMinutes}-minute intervals`,
                  response_code: ResponseCodes.GET_NOT_FOUND,
                });
              }

              console.log(`✅ [getData_redisv2] Successfully resampled Kite data to ${resampleMinutes}-minute intervals (${results.length} candles)`);
            } catch (kiteError) {
              console.error(`❌ [getData_redisv2] Error fetching from Kite:`, kiteError);
              return sendResponse({
                res,
                success: false,
                message: "Error fetching historical data from Kite API",
                response_code: ResponseCodes.GET_ERROR,
                error: kiteError.message,
              });
            }
          } else {
            // Redis has 1-minute data, use it for resampling
            if ((!results || results.length === 0) && oneMinData && oneMinData.length > 0) {
              // Convert interval string to resample minutes
              const resampleMinutes = parseInt(intervalStr.replace('minute', '')) || 1;

              console.log(`🔄 [getData_redisv2] Resampling ${oneMinData.length} 1-minute candles to ${resampleMinutes}-minute intervals`);

              // Convert 1-minute data to format expected by resampleOHLCData
              const formattedData = oneMinData.map(row => ({
                datetime: row.datetime instanceof Date
                  ? row.datetime.toISOString().slice(0, 19).replace('T', ' ')
                  : (typeof row.datetime === 'string' ? row.datetime : new Date(row.datetime).toISOString().slice(0, 19).replace('T', ' ')),
                open: parseFloat(row.open),
                high: parseFloat(row.high),
                low: parseFloat(row.low),
                close: parseFloat(row.close),
                volume: parseFloat(row.volume || 0)
              }));

              // Forward-fill missing minutes (same as getDataV2)
              const forwardFilledData = DataController.forwardFillMissingMinutes(formattedData);

              // Resample to requested interval
              results = DataController.resampleOHLCData(forwardFilledData, resampleMinutes);

              if (!results || results.length === 0) {
                return sendResponse({
                  res,
                  success: false,
                  message: `No data after resampling to ${resampleMinutes}-minute intervals`,
                  response_code: ResponseCodes.GET_NOT_FOUND,
                });
              }

              console.log(`✅ [getData_redisv2] Successfully resampled to ${resampleMinutes}-minute intervals (${results.length} candles)`);
            } else if (!results || results.length === 0) {
              return sendResponse({
                res,
                success: false,
                message: "No historical data found (1-minute data also unavailable)",
                response_code: ResponseCodes.GET_NOT_FOUND,
              });
            }
          }
        } else {
          // For 1-minute interval, check if data is missing
          const oneMinData = await getOhlcBySymbol(symbol);

          // Only fetch from Kite if 1-minute data is not present in Redis
          if (!oneMinData || oneMinData.length === 0) {
            console.log(`⚠️ [getData_redisv2] No 1-minute data in Redis - fetching from Kite`);

            try {
              console.log(`📡 [getData_redisv2] Fetching last 5 days of 1-minute data from Kite for ${symbol}`);

              // Get instrument token from database
              const tokenResult = await db.sequelize.query(
                "SELECT instrument_token FROM instruments WHERE tradingsymbol = :symbol",
                {
                  replacements: { symbol: symbol?.trim() },
                  type: db.sequelize.QueryTypes.SELECT,
                }
              );

              console.log(`🔍 [getData_redisv2] Token query result for ${symbol}:`, tokenResult);

              if (!tokenResult || !Array.isArray(tokenResult) || tokenResult.length === 0 || !tokenResult[0]) {
                console.log(`❌ [getData_redisv2] Instrument not found for symbol: ${symbol}`);
                return sendResponse({
                  res,
                  success: false,
                  message: "Instrument not found",
                  response_code: ResponseCodes.GET_NOT_FOUND,
                });
              }

              const token = tokenResult[0].instrument_token;

              if (!token) {
                console.log(`❌ [getData_redisv2] Instrument token is null/undefined for symbol: ${symbol}`);
                return sendResponse({
                  res,
                  success: false,
                  message: "Instrument token not found",
                  response_code: ResponseCodes.GET_NOT_FOUND,
                });
              }

              // Calculate date range (last 5 days)
              const to_date = new Date();
              const from_date = new Date(to_date);
              from_date.setDate(to_date.getDate() - 28);

              const from_date_str = from_date.toISOString().slice(0, 19).replace("T", " ");
              const to_date_str = to_date.toISOString().slice(0, 19).replace("T", " ");

              console.log(`📡 [getData_redisv2] Fetching from ${from_date_str} to ${to_date_str} for token ${token}`);

              // Fetch 1-minute data from Kite (always request 1-minute data)
              const kiteData = await fetchHistoricalData(token, "minute", from_date_str, to_date_str);

              if (!kiteData || kiteData.length === 0) {
                console.log(`❌ [getData_redisv2] No data returned from Kite API for ${symbol} (token: ${token})`);
                console.log(`   Date range: ${from_date_str} to ${to_date_str}`);
                console.log(`   Note: Newly added symbols may not have historical data yet. Wait for day_start_async.py to download data.`);
                return sendResponse({
                  res,
                  success: false,
                  message: `No historical data found from Kite API for ${symbol}. Symbol may be too new or data not available yet.`,
                  response_code: ResponseCodes.GET_NOT_FOUND,
                });
              }

              console.log(`✅ [getData_redisv2] Fetched ${kiteData.length} 1-minute candles from Kite`);

              // Convert Kite data to format expected
              const formattedKiteData = kiteData.map(row => ({
                datetime: row.datetime,
                open: parseFloat(row.open),
                high: parseFloat(row.high),
                low: parseFloat(row.low),
                close: parseFloat(row.close),
                volume: parseFloat(row.volume || 0)
              }));

              // Forward-fill missing minutes for consistency
              const forwardFilledKiteData = DataController.forwardFillMissingMinutes(formattedKiteData);

              // For 1-minute interval, use data as-is (no resampling needed)
              results = forwardFilledKiteData;
            } catch (kiteError) {
              console.error(`❌ [getData_redisv2] Error fetching from Kite:`, kiteError);
              return sendResponse({
                res,
                success: false,
                message: "Error fetching historical data from Kite API",
                response_code: ResponseCodes.GET_ERROR,
                error: kiteError.message,
              });
            }
          } else {
            // Use Redis data as-is for 1-minute interval
            results = oneMinData.map(row => ({
              datetime: row.datetime instanceof Date
                ? row.datetime.toISOString().slice(0, 19).replace('T', ' ')
                : (typeof row.datetime === 'string' ? row.datetime : new Date(row.datetime).toISOString().slice(0, 19).replace('T', ' ')),
              open: parseFloat(row.open),
              high: parseFloat(row.high),
              low: parseFloat(row.low),
              close: parseFloat(row.close),
              volume: parseFloat(row.volume || 0)
            }));
          }

          if (!results || results.length === 0) {
            return sendResponse({
              res,
              success: false,
              message: "No historical data found",
              response_code: ResponseCodes.GET_NOT_FOUND,
            });
          }
        }
      }

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
      chartData = results.map((row, index) => {
        // Format datetime consistently (handle both Date objects and strings)
        let formattedDatetime;
        if (row.datetime instanceof Date) {
          const dt = row.datetime;
          formattedDatetime = dt.getFullYear() + '-' +
            String(dt.getMonth() + 1).padStart(2, '0') + '-' +
            String(dt.getDate()).padStart(2, '0') + ' ' +
            String(dt.getHours()).padStart(2, '0') + ':' +
            String(dt.getMinutes()).padStart(2, '0') + ':' +
            String(dt.getSeconds()).padStart(2, '0');
        } else {
          formattedDatetime = row.datetime;
        }

        return {
          datetime: formattedDatetime,
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume || 0,
          ha_open: haOpen[index],
          ha_high: haHigh[index],
          ha_low: haLow[index],
          ha_close: haClose[index]
        };
      });

      return sendResponse({
        res,
        success: true,
        message: "Data retrieved successfully (OHLC + HA calculated on server)",
        response_code: ResponseCodes.GET_SUCCESS,
        data: chartData,
      });
    } catch (error) {
      console.error("❌ [getData_redisv2] Error fetching historical data:", error);
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
      psarid,  // Frontend sends psarid
      psar1,   // Handle legacy field name if present
      stochid,
      lrcangletype,
      lrcanglestart,
      lrcangleend,
      signaldirection,
      signalColor,
      hlfpid,
      lrc_filter_enabled,
      lrc_filter_type,
      time_filter_enabled,
      time_filter_start,
      time_filter_end,
    } = req.body;

    // Use psarid if provided, otherwise fall back to psar1 (legacy support)
    const finalPsarid = psarid || psar1;

    if (
      !name ||
      !lrcid ||
      !finalPsarid ||
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
        message: `Missing required parameters. Required: name, lrcid, psarid, stochid, lrcangletype, lrcanglestart, lrcangleend, signaldirection, signalColor, hlfpid. Received: name=${!!name}, lrcid=${!!lrcid}, psarid=${!!finalPsarid}, stochid=${!!stochid}`,
      });
    }

    const [results] = await db.sequelize.query(
      `
      INSERT INTO conditions (name, lrcid, psar1, stochid, lrcangletype, lrcanglestart, lrcangleend, signaldirection, signalColor, candle1, lrc_filter_enabled, lrc_filter_type, time_filter_enabled, time_filter_start, time_filter_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
      {
        replacements: [
          name,
          lrcid,
          finalPsarid,  // This maps to psar1
          stochid,
          lrcangletype,
          lrcanglestart,
          lrcangleend,
          signaldirection,
          signalColor,
          hlfpid,       // This maps to candle1
          lrc_filter_enabled || 0,
          lrc_filter_type || null,
          time_filter_enabled || 0,
          time_filter_start || null,
          time_filter_end || null,
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
      lrc_filter_enabled,
      lrc_filter_type,
      time_filter_enabled,
      time_filter_start,
      time_filter_end,
    } = req.body;

    // Log received data for debugging
    console.log("[updateCondition] Received data:", {
      id: id ? "✓" : "✗",
      name: name ? "✓" : "✗",
      lrcid: lrcid ? "✓" : "✗",
      psarid: psarid ? "✓" : "✗",
      stochid: stochid ? "✓" : "✗",
      lrcangletype: lrcangletype ? "✓" : "✗",
      lrcanglestart: lrcanglestart !== undefined && lrcanglestart !== null ? "✓" : "✗",
      lrcangleend: lrcangleend !== undefined && lrcangleend !== null ? "✓" : "✗",
      signaldirection: signaldirection ? "✓" : "✗",
      signalColor: signalColor ? "✓" : "✗",
    });

    // Validate required fields (filter fields are optional)
    if (
      !id ||
      !name ||
      !lrcid ||
      !psarid ||
      !stochid ||
      !lrcangletype ||
      lrcanglestart === undefined ||
      lrcanglestart === null ||
      lrcangleend === undefined ||
      lrcangleend === null ||
      !signaldirection ||
      !signalColor
    ) {
      const missing = [];
      if (!id) missing.push("id");
      if (!name) missing.push("name");
      if (!lrcid) missing.push("lrcid");
      if (!psarid) missing.push("psarid");
      if (!stochid) missing.push("stochid");
      if (!lrcangletype) missing.push("lrcangletype");
      if (lrcanglestart === undefined || lrcanglestart === null) missing.push("lrcanglestart");
      if (lrcangleend === undefined || lrcangleend === null) missing.push("lrcangleend");
      if (!signaldirection) missing.push("signaldirection");
      if (!signalColor) missing.push("signalColor");

      console.error("[updateCondition] Missing required fields:", missing);
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: `All required parameters must be provided. Missing: ${missing.join(", ")}`,
      });
    }

    // Extract additional fields from request body
    const {
      condition1,
      condition2,
      candle1,
      candle2,
      kline_start,
      kline_end,
    } = req.body;

    // Log extraction for debugging
    console.log("[updateCondition] ⚠️ FULL req.body dump:", JSON.stringify(req.body, null, 2));
    console.log("[updateCondition] Extracted from req.body:", {
      condition1,
      condition2,
      condition1_type: typeof condition1,
      condition2_type: typeof condition2,
      condition1_undefined: condition1 === undefined,
      condition1_null: condition1 === null,
      condition2_undefined: condition2 === undefined,
      condition2_null: condition2 === null,
      lrc_filter_enabled,
      time_filter_enabled,
    });

    // Prepare values for UPDATE
    console.log("[updateCondition] Raw filter values from req.body:", {
      lrc_filter_enabled_raw: lrc_filter_enabled,
      lrc_filter_enabled_type: typeof lrc_filter_enabled,
      time_filter_enabled_raw: time_filter_enabled,
      time_filter_enabled_type: typeof time_filter_enabled,
    });

    const lrcFilterEnabled = lrc_filter_enabled === true || lrc_filter_enabled === 1 || lrc_filter_enabled === '1' ? 1 : 0;
    const timeFilterEnabled = time_filter_enabled === true || time_filter_enabled === 1 || time_filter_enabled === '1' ? 1 : 0;

    console.log("[updateCondition] Converted filter values:", {
      lrcFilterEnabled,
      timeFilterEnabled,
    });

    // ⚠️ CRITICAL: Ensure condition1 and condition2 are properly converted
    // condition1 is tinyint(1) in MySQL, so we need 0 or 1
    let condition1Val = 0;
    if (condition1 !== undefined && condition1 !== null) {
      // Convert to number, then to 0 or 1
      const numVal = Number(condition1);
      condition1Val = (numVal === 1 || numVal === true || condition1 === true || condition1 === 1 || condition1 === '1') ? 1 : 0;
    }

    // condition2 is varchar(255) in MySQL, so we need '0' or '1' as string
    let condition2Val = '0';
    if (condition2 !== undefined && condition2 !== null) {
      // Convert to string, then to '0' or '1'
      const strVal = String(condition2);
      condition2Val = (strVal === '1' || strVal === 'true' || Number(strVal) === 1 || condition2 === true || condition2 === 1) ? '1' : '0';
    }

    console.log("[updateCondition] Condition value conversion:", {
      condition1_input: condition1,
      condition1_output: condition1Val,
      condition1_output_type: typeof condition1Val,
      condition2_input: condition2,
      condition2_output: condition2Val,
      condition2_output_type: typeof condition2Val,
    });

    console.log("[updateCondition] Prepared values:", {
      condition1Val,
      condition2Val,
      condition1Val_type: typeof condition1Val,
      condition2Val_type: typeof condition2Val,
    });
    const candle1Val = candle1 !== undefined && candle1 !== null ? candle1 : 1;
    const candle2Val = candle2 !== undefined && candle2 !== null ? candle2 : 1;
    const klineStartVal = kline_start !== undefined && kline_start !== null ? kline_start : 10;
    const klineEndVal = kline_end !== undefined && kline_end !== null ? kline_end : 100;

    console.log("[updateCondition] UPDATE values:", {
      id,
      lrc_filter_enabled: lrcFilterEnabled,
      lrc_filter_type,
      time_filter_enabled: timeFilterEnabled,
      time_filter_start,
      time_filter_end,
      condition1: condition1Val,
      condition2: condition2Val,
      candle1: candle1Val,
      candle2: candle2Val,
      kline_start: klineStartVal,
      kline_end: klineEndVal,
    });
    console.log("[updateCondition] Raw req.body values:", {
      condition1_raw: req.body.condition1,
      condition2_raw: req.body.condition2,
      condition1_type: typeof req.body.condition1,
      condition2_type: typeof req.body.condition2,
    });

    // Verify replacements array matches SQL SET clause order exactly
    const replacements = [
      name,                    // 1. name
      lrcid,                   // 2. lrcid
      psarid,                  // 3. psar1
      stochid,                 // 4. stochid
      lrcangletype,            // 5. lrcangletype
      lrcanglestart,           // 6. lrcanglestart
      lrcangleend,             // 7. lrcangleend
      signaldirection,         // 8. signaldirection
      signalColor,             // 9. signalColor
      lrcFilterEnabled,        // 10. lrc_filter_enabled
      lrc_filter_type || null, // 11. lrc_filter_type
      timeFilterEnabled,       // 12. time_filter_enabled
      time_filter_start || null, // 13. time_filter_start
      time_filter_end || null,  // 14. time_filter_end
      condition1Val,           // 15. condition1 ⚠️ CRITICAL
      condition2Val,           // 16. condition2 ⚠️ CRITICAL
      candle1Val,              // 17. candle1
      candle2Val,              // 18. candle2
      klineStartVal,           // 19. kline_start
      klineEndVal,             // 20. kline_end
      id,                      // 21. WHERE id
    ];

    console.log("[updateCondition] Replacements array (positions 15-16 are condition1/2):", {
      position_15_condition1: replacements[14], // 0-indexed, so position 15 is index 14
      position_16_condition2: replacements[15], // 0-indexed, so position 16 is index 15
      condition1_type: typeof replacements[14],
      condition2_type: typeof replacements[15],
      full_replacements_count: replacements.length,
    });

    const [results] = await db.sequelize.query(
      `
      UPDATE conditions
      SET name = ?, lrcid = ?, psar1 = ?, stochid = ?, lrcangletype = ?, lrcanglestart = ?, lrcangleend = ?, signaldirection = ?, signalColor = ?, lrc_filter_enabled = ?, lrc_filter_type = ?, time_filter_enabled = ?, time_filter_start = ?, time_filter_end = ?, condition1 = ?, condition2 = ?, candle1 = ?, candle2 = ?, kline_start = ?, kline_end = ?
      WHERE id = ?;
    `,
      {
        replacements,
      }
    );

    console.log("[updateCondition] UPDATE executed, affected rows:", results.affectedRows || 0);
    console.log("[updateCondition] SQL replacements verification:", {
      condition1_position_in_sql: 15,
      condition2_position_in_sql: 16,
      condition1_value_sent: condition1Val,
      condition2_value_sent: condition2Val,
      condition1_type: typeof condition1Val,
      condition2_type: typeof condition2Val,
      total_placeholders: 20,
      total_replacements: 21, // including id
    });

    // Fetch the updated condition to return complete data
    let updatedResults;
    try {
      [updatedResults] = await db.sequelize.query(
        `
        SELECT
          id,
          name,
          lrcid,
          psar1,
          stochid,
          lrcangletype,
          lrcanglestart,
          lrcangleend,
          signaldirection,
          signalColor,
          IFNULL(lrc_filter_enabled, 0) as lrc_filter_enabled,
          lrc_filter_type,
          IFNULL(time_filter_enabled, 0) as time_filter_enabled,
          time_filter_start,
          time_filter_end,
          IFNULL(condition1, 0) as condition1,
          IFNULL(condition2, 0) as condition2,
          candle1,
          candle2,
          kline_start,
          kline_end
        FROM conditions
        WHERE id = ?;
      `,
        {
          replacements: [id],
        }
      );
    } catch (error) {
      console.warn("Error fetching updated condition with filter columns:", error.message);
      // Fallback without filter columns
      [updatedResults] = await db.sequelize.query(
        `
        SELECT
          id,
          name,
          lrcid,
          psar1,
          stochid,
          lrcangletype,
          lrcanglestart,
          lrcangleend,
          signaldirection,
          signalColor,
          hlfpid,
          0 as lrc_filter_enabled,
          NULL as lrc_filter_type,
          0 as time_filter_enabled,
          NULL as time_filter_start,
          NULL as time_filter_end
        FROM conditions
        WHERE id = ?;
      `,
        {
          replacements: [id],
        }
      );
    }

    const updatedCondition = updatedResults.length > 0 ? {
      id: updatedResults[0].id,
      name: updatedResults[0].name,
      lrcid: updatedResults[0].lrcid,
      psarid: updatedResults[0].psar1,
      stochid: updatedResults[0].stochid,
      lrcangletype: updatedResults[0].lrcangletype,
      lrcanglestart: updatedResults[0].lrcanglestart,
      lrcangleend: updatedResults[0].lrcangleend,
      signaldirection: updatedResults[0].signaldirection,
      signalColor: updatedResults[0].signalColor,
      hlfpid: 1, // Default value since column doesn't exist in table
      lrc_filter_enabled: updatedResults[0].lrc_filter_enabled === 1 || updatedResults[0].lrc_filter_enabled === '1' || updatedResults[0].lrc_filter_enabled === true,
      lrc_filter_type: updatedResults[0].lrc_filter_type || null,
      time_filter_enabled: updatedResults[0].time_filter_enabled === 1 || updatedResults[0].time_filter_enabled === '1' || updatedResults[0].time_filter_enabled === true,
      time_filter_start: updatedResults[0].time_filter_start || null,
      time_filter_end: updatedResults[0].time_filter_end || null,
      condition1_enabled: updatedResults[0].condition1 === 1 || updatedResults[0].condition1 === '1' || updatedResults[0].condition1 === true,
      condition2_enabled: updatedResults[0].condition2 === 1 || updatedResults[0].condition2 === '1' || String(updatedResults[0].condition2) === '1',
      candle1: updatedResults[0].candle1 ? String(updatedResults[0].candle1) : '1',
      candle2: updatedResults[0].candle2 ? String(updatedResults[0].candle2) : '1',
      kline_start: updatedResults[0].kline_start !== null && updatedResults[0].kline_start !== undefined ? Number(updatedResults[0].kline_start) : 10,
      kline_end: updatedResults[0].kline_end !== null && updatedResults[0].kline_end !== undefined ? Number(updatedResults[0].kline_end) : 100,
    } : null;

    console.log("[updateCondition] Returning updated condition:", JSON.stringify(updatedCondition, null, 2));

    return sendResponse({
      res,
      success: true,
      message: "Condition updated successfully",
      response_code: ResponseCodes.OK,
      data: updatedCondition,
    });
  });

  static fetchConditionById = catchAsync(async (req, res) => {
    console.log("[fetchConditionById] Request body:", req.body);
    const { id } = req.body;
    console.log("[fetchConditionById] ID:", id);
    if (!id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "ID parameter is required",
      });
    }

    let results;
    try {
      // Try with new filter columns first
      [results] = await db.sequelize.query(
        `
        SELECT
          name,
          lrcid,
          psar1,
          stochid,
          lrcangletype,
          lrcanglestart,
          lrcangleend,
          signaldirection,
          signalColor,
          IFNULL(lrc_filter_enabled, 0) as lrc_filter_enabled,
          lrc_filter_type,
          IFNULL(time_filter_enabled, 0) as time_filter_enabled,
          time_filter_start,
          time_filter_end,
          IFNULL(condition1, 0) as condition1,
          IFNULL(condition2, 0) as condition2,
          candle1,
          candle2,
          kline_start,
          kline_end
        FROM conditions
        WHERE id = ?;
      `,
        {
          replacements: [id],
        }
      );
    } catch (error) {
      // If error, try with minimal columns (fallback for old schema)
      console.warn("[fetchConditionById] Error with new columns, trying minimal columns:", error.message);
      console.warn("[fetchConditionById] Error stack:", error.stack);
      try {
        [results] = await db.sequelize.query(
          `
          SELECT
            name,
            lrcid,
            psar1,
            stochid,
            lrcangletype,
            lrcanglestart,
            lrcangleend,
            signaldirection,
            signalColor,
            0 as lrc_filter_enabled,
            NULL as lrc_filter_type,
            0 as time_filter_enabled,
            NULL as time_filter_start,
            NULL as time_filter_end,
            IFNULL(condition1, 0) as condition1,
            IFNULL(condition2, 0) as condition2,
            IFNULL(candle1, 1) as candle1,
            IFNULL(candle2, 1) as candle2,
            IFNULL(kline_start, 10) as kline_start,
            IFNULL(kline_end, 100) as kline_end
          FROM conditions
          WHERE id = ?;
        `,
          {
            replacements: [id],
          }
        );
      } catch (fallbackError) {
        console.error("Error fetching condition by id (both attempts failed):", fallbackError);
        // Last resort: try with only basic columns
        try {
          [results] = await db.sequelize.query(
            `
            SELECT
              name,
              lrcid,
              psar1,
              stochid,
              lrcangletype,
              lrcanglestart,
              lrcangleend,
              signaldirection,
              signalColor,
              0 as lrc_filter_enabled,
              NULL as lrc_filter_type,
              0 as time_filter_enabled,
              NULL as time_filter_start,
              NULL as time_filter_end,
              0 as condition1,
              0 as condition2,
              1 as candle1,
              1 as candle2,
              10 as kline_start,
              100 as kline_end
            FROM conditions
            WHERE id = ?;
          `,
            {
              replacements: [id],
            }
          );
        } catch (finalError) {
          console.error("Error fetching condition by id (all attempts failed):", finalError);
          throw new APIError({
            code: ResponseCodes.INTERNAL_SERVER_ERROR,
            message: `Database error: ${finalError.message}`,
          });
        }
      }
    }

    if (results.length === 0) {
      return sendResponse({
        res,
        success: false,
        message: "Condition not found",
        response_code: ResponseCodes.NOT_FOUND,
      });
    }

    // Safely extract fields with defaults
    const condition = {
      name: results[0].name || '',
      lrcid: results[0].lrcid || '1',
      psarid: results[0].psar1 || '2',
      stochid: results[0].stochid || '3',
      lrcangletype: results[0].lrcangletype || 'custom',
      lrcanglestart: results[0].lrcanglestart !== null && results[0].lrcanglestart !== undefined ? results[0].lrcanglestart : 40,
      lrcangleend: results[0].lrcangleend !== null && results[0].lrcangleend !== undefined ? results[0].lrcangleend : 80,
      signaldirection: results[0].signaldirection || '1',
      signalColor: results[0].signalColor || '#000000',
      hlfpid: 1, // Default value since column doesn't exist in table
      lrc_filter_enabled: results[0].lrc_filter_enabled === 1 || results[0].lrc_filter_enabled === '1' || results[0].lrc_filter_enabled === true,
      lrc_filter_type: results[0].lrc_filter_type || null,
      time_filter_enabled: results[0].time_filter_enabled === 1 || results[0].time_filter_enabled === '1' || results[0].time_filter_enabled === true,
      time_filter_start: results[0].time_filter_start || null,
      time_filter_end: results[0].time_filter_end || null,
      condition1_enabled: results[0].condition1 === 1 || results[0].condition1 === '1' || results[0].condition1 === true,
      condition2_enabled: results[0].condition2 === 1 || results[0].condition2 === '1' || String(results[0].condition2) === '1',
      candle1: results[0].candle1 ? String(results[0].candle1) : '1',
      candle2: results[0].candle2 ? String(results[0].candle2) : '1',
      kline_start: results[0].kline_start !== null && results[0].kline_start !== undefined ? Number(results[0].kline_start) : 10,
      kline_end: results[0].kline_end !== null && results[0].kline_end !== undefined ? Number(results[0].kline_end) : 100,
    };

    console.log("[fetchConditionById] Returning condition data:", JSON.stringify(condition, null, 2));

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
      `SELECT DATE_FORMAT(a.datetime, '%Y-%m-%d %H:%i:%s') AS datetime, a.id, a.symbol, s.name, a.timeframe, s.id as scanid FROM alerts a left join scans s on a.scanid = s.id 
      left join conditions c on a.conditionID = c.id where a.deleted = 0 order by a.datetime desc, a.system_time desc LIMIT ${_limit} offset ${offset};`
    );

    const alerts = results.map((result) => ({
      id: result.id,
      symbol: result.symbol,
      datetime: result.datetime,
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
      `SELECT DATE_FORMAT(a.datetime, '%Y-%m-%d %H:%i:%s') AS datetime, a.scanid, c.signalColor from alerts a left join conditions c on a.conditionID = c.id where symbol = ? and timeframe = ? and deleted = 0;
    `,
      {
        replacements: [symbol, timeframe],
      }
    );

    const alerts = results.map((result) => ({
      datetime: result.datetime,
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

  static getAvailableSymbols = catchAsync(async (req, res) => {
    const query = `
      SELECT DISTINCT name 
      FROM instruments 
      WHERE instrument_type IN ('CE', 'PE', 'FUT')
        AND exchange = 'NFO'
        AND name != ''
        AND name IS NOT NULL
      ORDER BY name
    `;

    const [results] = await db.sequelize.query(query);

    // Map symbol names for display (matching old PHP logic)
    const nameMappings = {
      'NIFTY': 'NIFTY 50',
      'BANKNIFTY': 'NIFTY BANK',
      'FINNIFTY': 'NIFTY FIN SERVICE',
      'MIDCPNIFTY': 'MIDCAP NIFTY',
    };

    const symbols = results.map((row) => ({
      name: row.name,
      displayName: nameMappings[row.name] || row.name,
    }));

    return sendResponse({
      res,
      success: true,
      message: "Symbols retrieved successfully",
      response_code: ResponseCodes.GET_SUCCESS,
      data: symbols,
    });
  });

  static getInstrumentsOptions = catchAsync(async (req, res) => {
    const { symbol, startDate, endDate, expiryDate } = req.query;

    console.log("[getInstrumentsOptions] Request params:", { symbol, startDate, endDate, expiryDate });

    if (!symbol) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "symbol parameter is required",
      });
    }

    // Build WHERE clause for expiry filtering
    let expiryFilter = "";
    const replacements = [symbol];

    if (expiryDate) {
      // Single date filter
      expiryFilter = "AND expiry = ?";
      replacements.push(expiryDate);
    } else if (startDate && endDate) {
      // Date range filter
      expiryFilter = "AND expiry BETWEEN ? AND ?";
      replacements.push(startDate, endDate);
    } else if (startDate) {
      // Only start date (from startDate onwards)
      expiryFilter = "AND expiry >= ?";
      replacements.push(startDate);
    } else {
      // No date filter - only show future expiries
      // Use CURDATE() directly in SQL (MySQL function)
      expiryFilter = "AND expiry >= CURDATE()";
    }

    const query = `
      SELECT 
        instrument_token,
        tradingsymbol,
        name,
        expiry,
        strike,
        instrument_type,
        exchange,
        tick_size,
        lot_size
      FROM instruments 
      WHERE name = ?
        AND instrument_type IN ('CE', 'PE', 'FUT')
        AND exchange = 'NFO'
        ${expiryFilter}
      ORDER BY expiry ASC, strike ASC, instrument_type ASC
    `;

    console.log("[getInstrumentsOptions] Query:", query);
    console.log("[getInstrumentsOptions] Replacements:", replacements);

    try {
      const [results] = await db.sequelize.query(query, {
        replacements,
      });

      console.log("[getInstrumentsOptions] Results count:", results?.length || 0);

      return sendResponse({
        res,
        success: true,
        message: "Instruments retrieved successfully",
        response_code: ResponseCodes.GET_SUCCESS,
        data: results,
      });
    } catch (error) {
      console.error("[getInstrumentsOptions] Database error:", error);
      console.error("[getInstrumentsOptions] Error stack:", error.stack);
      throw new APIError({
        code: ResponseCodes.INTERNAL_SERVER_ERROR,
        message: `Database error: ${error.message}`,
      });
    }
  });

  static addFilterOption = catchAsync(async (req, res) => {
    const {
      symbol,
      option_name,
      expiry,
      instrument_token,
      group_name,
      basket_id,
    } = req.body;

    if (!symbol || !option_name || !expiry || !instrument_token || !group_name || !basket_id) {
      throw new APIError({
        code: ResponseCodes.BAD_REQUEST,
        message: "Missing required fields: symbol, option_name, expiry, instrument_token, group_name, basket_id",
      });
    }

    // Use INSERT IGNORE so duplicate rows don't crash (affectedRows == 0 → already exists)
    const query = `
      INSERT IGNORE INTO filter_options (symbol, option_name, expiry, instrument_token, mode, group_name, basket_id)
      VALUES (?, ?, ?, ?, 'MAN', ?, ?)
    `;

    const [result] = await db.sequelize.query(query, {
      replacements: [symbol, option_name, expiry, instrument_token, group_name, basket_id],
    });

    const isDuplicate = result.affectedRows === 0;

    // Publish hot-reload event to Redis so tick_zerodha.py can subscribe the new token
    // without requiring a full restart. Only publish for genuinely new rows.
    if (!isDuplicate) {
      try {
        const redis = require('../db/redis');  // lazy require
        await redis.publish('new_symbol', JSON.stringify({
          symbol,
          option_name,
          instrument_token: Number(instrument_token),
          basket_id: Number(basket_id),
          group_name,
          expiry,
        }));
      } catch (pubErr) {
        // Non-fatal: don't fail the request if Redis publish fails
        console.warn('[addFilterOption] Redis publish error (non-fatal):', pubErr.message);
      }
    }

    return sendResponse({
      res,
      success: true,
      message: isDuplicate
        ? `${option_name} already exists in ${group_name} — skipped`
        : `Filter option added successfully`,
      response_code: isDuplicate ? ResponseCodes.OK : ResponseCodes.CREATE_SUCCESS,
      data: { insertId: result.insertId, duplicate: isDuplicate },
    });
  });
}

module.exports = DataController;
