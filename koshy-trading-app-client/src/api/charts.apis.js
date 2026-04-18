import axiosInstance from "./axios";

export class ChartApis {
  static getSymbolChartData = async ({ symbol, interval }) => {
    // Check if symbol and interval are defined and valid
    if (!symbol || !interval) {
      return {
        success: false,
        error: "Symbol and interval must be provided.",
        data: null,
      };
    }
    console.log("symbol:", symbol);
    console.log("interval:", interval);
    try {
      // Use v3 endpoint with improved resampling logic
      const res = await axiosInstance({
        method: "get",
        url: "/heikinv3",
        params: {
          symbol,
          interval,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong", error);

      return {
        success: false,
        error: "Something went wrong!",
        data: error?.response,
      };
    }
  };

  static getPsarSettings = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "/psar",
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong", error);

      return {
        success: false,
        error: "Something went wrong!",
        data: error?.response,
      };
    }
  };

  static getLRCSettings = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "/lrc",
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong", error);

      return {
        success: false,
        error: "Something went wrong!",
        data: error?.response,
      };
    }
  };

  static getFastStochSettings = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "/faststoch",
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong getFastStochSettings", error);

      return {
        success: false,
        error: "Something went wrong! getFastStochSettings",
        data: error?.response,
      };
    }
  };

  static updatePsarSettings = async (paramsValue) => {
    const enabledValue = paramsValue.isEnabled ? 1 : 0;
    console.log(paramsValue);
    try {
      const res = await axiosInstance({
        method: "put",
        url: `/update-psar-settings?acceleration=${
          paramsValue.acceleration
        }&max_acceleration=${
          paramsValue.maxAcceleration
        }&enabled=${enabledValue}&up_color=${encodeURIComponent(
          paramsValue.upColor
        )}&down_color=${encodeURIComponent(paramsValue.downColor)}`, // need from client
      });
      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong", error);

      return {
        success: false,
        error: "Something went wrong!",
        data: error?.response,
      };
    }
  };
  static updateLRCSettings = async (paramsValue) => {
    const enabledValue = paramsValue.isEnabled ? 1 : 0;
    console.log(paramsValue);
    try {
      const res = await axiosInstance({
        method: "put",
        url: `/update-lrc-settings?period=${paramsValue.period}&sdev=${
          paramsValue.standardDeviation
        }&enabled=${enabledValue}&up_color=${encodeURIComponent(
          paramsValue.upperColor
        )}&low_color=${encodeURIComponent(paramsValue.lowerColor)}
        &lin_color=${encodeURIComponent(paramsValue.linColor)}`,
      });
      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong", error);

      return {
        success: false,
        error: "Something went wrong!",
        data: error?.response,
      };
    }
  };

  static updateStochSettings = async ({
    stoch_period,
    k_avg,
    d_avg,
    k_color,
    d_color,
    k_line_size,
    d_line_size,
    stochEnabled,
  }) => {
    console.log(
      "charts.apis.js updateStochSettings stoch_period:",
      stoch_period
    );
    const enabledValue = stochEnabled ? 1 : 0;
    console.log("enabledValue:", enabledValue);
    try {
      const res = await axiosInstance({
        method: "put",
        url: `update-stoch-settings`,
        data: {
          stoch_period,
          k_avg,
          d_avg,
          k_color,
          d_color,
          k_line_size,
          d_line_size,
          enabledValue,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.message ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong updateStochSettings", error);

      return {
        success: false,
        error: "Something went wrong! updateStochSettings",
        data: error?.response,
      };
    }
  };

  static getIndicators = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "indicators",
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("indicators Something went wrong", error);

      return {
        success: false,
        error: "indicators Something went wrong !",
        data: error?.response,
      };
    }
  };
  static getCustomIndicators = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "custom_indicators",
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("custom_indicators Something went wrong", error);

      return {
        success: false,
        error: "custom_indicators Something went wrong !",
        data: error?.response,
      };
    }
  };

  static fetchCustomIndicatorById = async (id) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: "/custom_indicator_by_id",
        data: {
          id,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error(
        "Something went wrong fetching custom indicator by ID",
        error
      );
      return {
        success: false,
        error: "Something went wrong! fetchCustomIndicatorById",
        data: error?.response?.data ?? null,
      };
    }
  };

  static insertCustomIndicator = async ({ name, indicator_id, value }) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `insert-custom-indicators`,
        data: {
          name,
          indicator_id,
          value,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong insert-custom-indicators", error);
      return {
        success: false,
        error: "Something went wrong! insert-custom-indicators",
        data: error?.response?.data ?? null,
      };
    }
  };

  static updateCustomIndicator = async ({ name, id, value }) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `update-custom-indicators`,
        data: {
          name,
          id,
          value,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong update-custom-indicators", error);
      return {
        success: false,
        error: "Something went wrong! update-custom-indicators",
        data: error?.response?.data ?? null,
      };
    }
  };
  static deleteCustomIndicator = async ({ id }) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `delete-custom-indicators`,
        data: {
          id,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong delete-custom-indicators", error);
      return {
        success: false,
        error: "Something went wrong! delete-custom-indicators",
        data: error?.response?.data ?? null,
      };
    }
  };

  static getConditions = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "/conditions",
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("conditions Something went wrong", error);

      return {
        success: false,
        error: "conditions Something went wrong !",
        data: error?.response,
      };
    }
  };

  static deleteCondition = async ({ id }) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `/delete-condition`,
        data: {
          id,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong delete-condition", error);
      return {
        success: false,
        error: "Something went wrong! delete-condition",
        data: error?.response?.data ?? null,
      };
    }
  };

  static insertCondition = async ({
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
  }) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: "insert-condition",
        data: {
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
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong with insert-condition", error);
      return {
        success: false,
        error: "Something went wrong! insert-condition",
        data: error?.response?.data ?? null,
      };
    }
  };

  static updateCondition = async ({
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
    condition1,
    condition2,
    candle1,
    candle2,
    kline_start,
    kline_end,
  }) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: "update-condition",
        data: {
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
          condition1,
          condition2,
          candle1,
          candle2,
          kline_start,
          kline_end,
        },
      });

      return {
        success: res?.data?.success ?? true,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong with update-condition", error);
      return {
        success: false,
        error: "Something went wrong! update-condition",
        data: error?.response?.data ?? null,
      };
    }
  };

  static fetchConditionById = async (id) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: "fetch-condition-by-id",
        data: {
          id: id,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong fetching condition by id", error);
      return {
        success: false,
        error: "Something went wrong! fetchConditionById",
        data: error?.response?.data ?? null,
      };
    }
  };

  static getScans = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: `/scans`,
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong fetching scans", error);
      return {
        success: false,
        error: "Something went wrong! getScans",
        data: error?.response?.data ?? null,
      };
    }
  };

  static insertScans = async ({ name, basketId }) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `/insert-scans`,
        data: {
          name,
          basket_id: basketId,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong inserting scans", error);
      return {
        success: false,
        error: "Something went wrong! insertScans",
        data: error?.response?.data ?? null,
      };
    }
  };

  static deleteScan = async (id) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `/delete-scan-by-id`,
        data: {
          id,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong deleting scan", error);
      return {
        success: false,
        error: "Something went wrong! deleteScan",
        data: error?.response?.data ?? null,
      };
    }
  };

  static getScanById = async (id) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `/get-scan-by-id`,
        data: {
          id,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong fetching scan by id", error);
      return {
        success: false,
        error: "Something went wrong! getScanById",
        data: error?.response?.data ?? null,
      };
    }
  };

  static updateScans = async ({ id, name, basketId }) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: `/update-scan`,
        data: {
          id,
          name,
          basket_id: basketId,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong updating scan", error);
      return {
        success: false,
        error: "Something went wrong! updateScans",
        data: error?.response?.data ?? null,
      };
    }
  };

  //-----------

  static fetchScanItemsByScanID = async (scanID) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `/scanitem-by-scanid`,
        data: {
          scanID,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error(
        "Something went wrong fetching scan items by scan ID",
        error
      );
      return {
        success: false,
        error: "Something went wrong! fetchScanItemsByScanID",
        data: error?.response?.data ?? null,
      };
    }
  };

  static deleteScanItemById = async (id) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: `/delete-scanitem-by-id`,
        data: {
          id,
        },
      });

      return {
        success: res?.data?.success ?? false,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong deleting scan item by id", error);
      return {
        success: false,
        error: "Something went wrong! deleteScanItemById",
        data: error?.response?.data ?? null,
      };
    }
  };

  static updateScanItemById = async ({
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
  }) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: `/update-scanitem-by-id`,
        data: {
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
        },
      });

      return {
        success: res?.data?.success ?? false,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong updating scan item by id", error);
      return {
        success: false,
        error: "Something went wrong! updateScanItemById",
        data: error?.response?.data ?? null,
      };
    }
  };

  static insertScanItemById = async ({
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
  }) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: `/insert-scanitem-by-id`,
        data: {
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
        },
      });

      return {
        success: res?.data?.success ?? false,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong inserting scan item by id", error);
      return {
        success: false,
        error: "Something went wrong! insertScanItemById",
        data: error?.response?.data ?? null,
      };
    }
  };
  static fetchCustomIndicatorByType = async (indicator_id) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: "/custom_indicator_by_type",
        data: {
          indicator_id,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error(
        "Something went wrong fetching custom indicator by indicator_id",
        error
      );
      return {
        success: false,
        error: "Something went wrong! fetchCustomIndicatorByType",
        data: error?.response?.data ?? null,
      };
    }
  };

  static getAlerts = async ({ page, limit }) => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "alerts",
        params: { page, limit },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong fetching Alerts", error);
      return {
        success: false,
        error: "Something went wrong! getAlerts",
        data: error?.response?.data ?? null,
      };
    }
  };

  static deleteAlert = async (id) => {
    try {
      const res = await axiosInstance({
        method: "put",
        url: "delete-alert-by-id",
        data: {
          id,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong deleting Alert", error);
      return {
        success: false,
        error: "Something went wrong! delete Alert",
        data: error?.response?.data ?? null,
      };
    }
  };
  static getHlfp = async () => {
    try {
      const res = await axiosInstance({
        method: "get",
        url: "hlfp",
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong fetching HLFP", error);
      return {
        success: false,
        error: "Something went wrong! getHlfp",
        data: error?.response?.data ?? null,
      };
    }
  };

  static updateHLFP = async ({
    kLineThresholdOne,
    psarCandlesOne,
    kLineThresholdTwo,
    psarCandlesTwo,
    kLineThresholdThree,
    psarCandlesThree,
  }) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: "update-hlfp",
        data: {
          kLineThresholdOne,
          psarCandlesOne,
          kLineThresholdTwo,
          psarCandlesTwo,
          kLineThresholdThree,
          psarCandlesThree,
        },
      });

      return {
        success: res?.data?.success ?? false,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong updating HLFP", error);
      return {
        success: false,
        error: "Something went wrong! updateHLFP",
        data: error?.response?.data ?? null,
      };
    }
  };

  static getAlertsBySymbol = async ({ symbol, interval }) => {
    //console.log('getAlertsBySymbol', symbol, interval);
    try {
      const res = await axiosInstance({
        method: "post",
        url: "/alerts-by-symbol",
        data: {
          symbol: symbol,
          timeframe: interval,
        },
      });

      return {
        success: res?.data?.success ?? false,
        data: res?.data?.data ?? null,
        message: res?.data?.message ?? null,
        error: null,
      };
    } catch (error) {
      console.error("Something went wrong getAlertsBySymbol", error);
      return {
        success: false,
        error: "Something went wrong! getAlertsBySymbol",
        data: error?.response?.data ?? null,
      };
    }
  };
  static getScanIndicatorsById = async ({ scanid }) => {
    try {
      const res = await axiosInstance({
        method: "post",
        url: `/scan-indicators`,
        data: {
          scanid,
        },
      });

      return {
        success: res?.data?.success ?? false,
        message: res?.data?.message ?? null,
        data: res?.data?.data ?? null,
        error: null,
      };
    } catch (error) {
      console.error(
        "Something went wrong retrieving scan indicators by ID",
        error
      );
      return {
        success: false,
        error: "Something went wrong! getScanIndicatorsById",
        data: error?.response?.data ?? null,
      };
    }
  };
}
