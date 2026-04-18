const moment = require("moment-timezone");
const db = require("../db/sequelize");
const { catchAsync } = require("../utils/catchAsync.utils");
const ResponseCodes = require("../utils/responseCodes");
const { sendResponse } = require("../utils/utils.common");
const { CommonEnums } = require("../utils/common.enums");
const { APIError } = require("../middlewares/errorHandler.middleware");
const { calcHeikinAshi } = require("../utils/utils.common");
const { Op } = require("sequelize");

class ImprovedDataController {

  // Fail-proof resampling method with multiple fallback strategies
  static resampleOHLCData(data, intervalMinutes) {
    console.log(`🔍 Improved Resampling ${data.length} candles to ${intervalMinutes}-minute intervals`);

    // Strategy 1: Try simple time-based grouping first (most reliable)
    try {
      const simpleResampled = this.simpleTimeBasedResampling(data, intervalMinutes);
      if (simpleResampled && simpleResampled.length >= Math.floor(data.length / intervalMinutes * 0.5)) {
        console.log(`✅ Simple resampling successful: ${simpleResampled.length} candles`);
        return simpleResampled;
      }
    } catch (error) {
      console.log(`⚠️ Simple resampling failed: ${error.message}`);
    }

    // Strategy 2: Try market-aligned resampling (current method)
    try {
      const marketResampled = this.marketAlignedResampling(data, intervalMinutes);
      if (marketResampled && marketResampled.length >= Math.floor(data.length / intervalMinutes * 0.3)) {
        console.log(`✅ Market-aligned resampling successful: ${marketResampled.length} candles`);
        return marketResampled;
      }
    } catch (error) {
      console.log(`⚠️ Market-aligned resampling failed: ${error.message}`);
    }

    // Strategy 3: Fallback to pandas-style resampling
    try {
      const pandasResampled = this.pandasStyleResampling(data, intervalMinutes);
      if (pandasResampled && pandasResampled.length > 0) {
        console.log(`✅ Pandas-style resampling successful: ${pandasResampled.length} candles`);
        return pandasResampled;
      }
    } catch (error) {
      console.log(`⚠️ Pandas-style resampling failed: ${error.message}`);
    }

    // Strategy 4: Last resort - naive grouping
    console.log(`⚠️ All resampling strategies failed, using naive grouping`);
    return this.naiveGrouping(data, intervalMinutes);
  }

  // Strategy 1: Simple time-based grouping (most reliable)
  static simpleTimeBasedResampling(data, intervalMinutes) {
    if (!data || data.length === 0) return [];

    const groups = {};
    const intervalMs = intervalMinutes * 60 * 1000;

    data.forEach(item => {
      const timestamp = new Date(item.datetime).getTime();
      // Round down to nearest interval boundary
      const groupKey = Math.floor(timestamp / intervalMs) * intervalMs;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(groupKey => this.createOHLCFromGroup(groups[groupKey], new Date(parseInt(groupKey))));
  }

  // Strategy 2: Market-aligned resampling (current improved method)
  static marketAlignedResampling(data, intervalMinutes) {
    if (!data || data.length === 0) return [];

    const groups = {};
    const MARKET_START_MINUTES = 9 * 60 + 15; // 555 minutes (9:15 AM)

    data.forEach(item => {
      const dateTime = moment(item.datetime).tz('Asia/Kolkata');
      if (!dateTime.isValid()) return;

      const totalMinutesFromMidnight = dateTime.hours() * 60 + dateTime.minutes();

      // Skip pre-market data
      if (totalMinutesFromMidnight < MARKET_START_MINUTES) return;

      const minutesFromMarketStart = totalMinutesFromMidnight - MARKET_START_MINUTES;
      const intervalGroup = Math.floor(minutesFromMarketStart / intervalMinutes) * intervalMinutes;
      const groupTotalMinutes = MARKET_START_MINUTES + intervalGroup;

      const groupHours = Math.floor(groupTotalMinutes / 60);
      const groupMinutes = groupTotalMinutes % 60;

      const groupKey = moment.tz(
        [dateTime.year(), dateTime.month(), dateTime.date(), groupHours, groupMinutes, 0, 0],
        'Asia/Kolkata'
      ).valueOf();

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(groupKey => this.createOHLCFromGroup(groups[groupKey], moment(parseInt(groupKey)).tz('Asia/Kolkata').toDate()));
  }

  // Strategy 3: Pandas-style resampling
  static pandasStyleResampling(data, intervalMinutes) {
    if (!data || data.length === 0) return [];

    // Sort data by datetime
    const sortedData = data.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const groups = [];
    const intervalMs = intervalMinutes * 60 * 1000;

    let currentGroup = [];
    let groupStartTime = null;

    sortedData.forEach(item => {
      const itemTime = new Date(item.datetime).getTime();

      if (!groupStartTime) {
        groupStartTime = Math.floor(itemTime / intervalMs) * intervalMs;
        currentGroup = [item];
      } else if (itemTime < groupStartTime + intervalMs) {
        currentGroup.push(item);
      } else {
        // Finish current group and start new one
        if (currentGroup.length > 0) {
          groups.push({
            data: currentGroup,
            startTime: new Date(groupStartTime)
          });
        }
        groupStartTime = Math.floor(itemTime / intervalMs) * intervalMs;
        currentGroup = [item];
      }
    });

    // Add final group
    if (currentGroup.length > 0) {
      groups.push({
        data: currentGroup,
        startTime: new Date(groupStartTime)
      });
    }

    return groups.map(group => this.createOHLCFromGroup(group.data, group.startTime));
  }

  // Strategy 4: Naive grouping (last resort)
  static naiveGrouping(data, intervalMinutes) {
    if (!data || data.length === 0) return [];

    const result = [];
    const groupSize = Math.max(1, intervalMinutes); // Use interval as group size

    for (let i = 0; i < data.length; i += groupSize) {
      const group = data.slice(i, i + groupSize);
      if (group.length > 0) {
        result.push(this.createOHLCFromGroup(group, new Date(group[0].datetime)));
      }
    }

    return result;
  }

  // Helper method to create OHLC from group
  static createOHLCFromGroup(groupData, groupDateTime) {
    if (!groupData || groupData.length === 0) {
      throw new Error('Empty group data');
    }

    // Sort group data by datetime
    const sortedData = groupData.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    const openValues = sortedData.map(candle => parseFloat(candle.open));
    const highValues = sortedData.map(candle => parseFloat(candle.high));
    const lowValues = sortedData.map(candle => parseFloat(candle.low));
    const closeValues = sortedData.map(candle => parseFloat(candle.close));
    const volumeValues = sortedData.map(candle => parseFloat(candle.volume || 0));

    return {
      datetime: moment(groupDateTime).format('YYYY-MM-DD HH:mm:ss'),
      open: openValues[0],
      high: Math.max(...highValues),
      low: Math.min(...lowValues),
      close: closeValues[closeValues.length - 1],
      volume: volumeValues.reduce((sum, vol) => sum + vol, 0)
    };
  }

  // Improved main data method with better error handling
  static getDataV2 = catchAsync(async (req, res) => {
    const { symbol, interval } = req.query;

    // Map intervals with validation
    const intervalMap = {
      [CommonEnums.intervals.one_min]: 1,
      [CommonEnums.intervals.two_min]: 2,
      [CommonEnums.intervals.three_min]: 3,
      [CommonEnums.intervals.five_min]: 5,
      [CommonEnums.intervals.ten_min]: 10,
      [CommonEnums.intervals.fifteen_min]: 15,
      [CommonEnums.intervals.thirty_min]: 30,
      [CommonEnums.intervals.one_hour]: 60
    };

    const resampleMinutes = intervalMap[interval] || 1;

    console.log(`📊 Processing request: symbol=${symbol}, interval=${interval}, resampleMinutes=${resampleMinutes}`);

    try {
      // Enhanced data fetching with longer time range for better resampling
      const currentDate = new Date();
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 45); // Increased from 30 to 45 days
      startDate.setHours(9, 15, 0, 0);

      const from_date_str = startDate.toISOString().slice(0, 19).replace("T", " ");

      console.log(`📅 Fetching data from ${from_date_str} for symbol: ${symbol}`);

      const results = await db.sequelize.query(
        `SELECT DATE_FORMAT(datetime, '%Y-%m-%d %H:%i:%s') AS datetime, open, high, low, close
         FROM one_min_ohlc
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

      console.log(`📈 Found ${results.length} raw 1-minute records`);

      // Convert and validate data
      let allData = results.map(row => ({
        datetime: row.datetime,
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close)
      })).filter(row =>
        !isNaN(row.open) && !isNaN(row.high) && !isNaN(row.low) && !isNaN(row.close)
      );

      console.log(`✅ After validation: ${allData.length} valid records`);

      // Apply improved resampling for intervals > 1 minute
      if (resampleMinutes > 1) {
        console.log(`🔄 Starting improved resampling to ${resampleMinutes}-minute intervals`);
        allData = this.resampleOHLCData(allData, resampleMinutes);

        if (!allData || allData.length === 0) {
          throw new Error(`Resampling failed - no data produced for ${resampleMinutes}-minute interval`);
        }

        console.log(`✅ Resampling complete: ${allData.length} candles`);
      }

      // Calculate Heikin-Ashi
      const openPrices = allData.map(row => row.open);
      const highPrices = allData.map(row => row.high);
      const lowPrices = allData.map(row => row.low);
      const closePrices = allData.map(row => row.close);

      const { haOpen, haHigh, haLow, haClose } = calcHeikinAshi(
        openPrices, highPrices, lowPrices, closePrices
      );

      // Build final chart data
      const chartData = allData.map((row, index) => ({
        datetime: row.datetime,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        ha_open: haOpen[index],
        ha_high: haHigh[index],
        ha_low: haLow[index],
        ha_close: haClose[index]
      }));

      console.log(`🎯 Final result: ${chartData.length} candles for ${resampleMinutes}-minute interval`);

      return sendResponse({
        res,
        success: true,
        message: `Data retrieved successfully for ${resampleMinutes}-minute interval`,
        response_code: ResponseCodes.GET_SUCCESS,
        data: chartData,
      });

    } catch (error) {
      console.error("❌ Error in improved getDataV2:", error);
      return sendResponse({
        res,
        success: false,
        message: `Error retrieving data: ${error.message}`,
        response_code: ResponseCodes.GET_ERROR,
        error: error.message,
      });
    }
  });
}

module.exports = ImprovedDataController;