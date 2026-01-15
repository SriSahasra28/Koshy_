import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createChart } from "lightweight-charts";
import {
  geChartHeight,
  geChart2Height,
  calculatePSAR,
  getPosSignals,
  getNegSignals,
  linearRegressionChannel,
  calcFastStochastics,
} from "../utils/common.utils";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { ChartApis } from "../api/charts.apis";
import { DataLoadingServices } from "../utils/common.services";

// Development mode check for console.logs
const isDev = process.env.NODE_ENV === 'development';
const log = isDev ? console.log : () => {};

let candleStickSeries = null;
let upperRLSeries = null;
let middleRLSeries = null;
let lowerRLSeries = null;
let stochKSeries = null;
let stochDSeries = null;
let chart = null;
// let chart2 = null;
let lineSeries = null;

let zoomFactor = 1;
let pDay = 1;

let _updatedTradingData = null;
let _updatedInstrumentToken = null;
let _updatedTickInterval = null;
let globalIndicatorsInstances = {};

let intervalInstance = null;

let previousDays = [];
let stochData = null;
let lrcData = null;
let markersData = null;

function TradingChart({ instrumentToken, tickInterval }) {
  // Memoize selectors to prevent unnecessary re-renders
  const markersData = useSelector((state) => state?.header?.markersValues);
  const symbolValue = useSelector((state) => state?.header?.symbolValue);
  const minOptionValue = useSelector((state) => state?.header?.minOptionValue);
  const lrcData = useSelector((state) => state?.header?.lrcValues);
  const stochData = useSelector((state) => state?.header?.stochValues);
  
  // Memoize destructured values
  const { acceleration, maxAcceleration, upColor, downColor, enabled } = useMemo(
    () => markersData || {},
    [markersData]
  );
  const {
    period,
    standardDeviation,
    upperColor,
    lowerColor,
    linColor,
    lrcenabled,
  } = useMemo(() => lrcData || {}, [lrcData]);
  const {
    stoch_period,
    k_avg,
    d_avg,
    k_color,
    d_color,
    k_line_size,
    d_line_size,
    stochEnabled,
  } = useMemo(() => stochData || {}, [stochData]);
  const chartContainerRef = useRef();
  const chartContainerRef2 = useRef();
  const [isChartPlotted, setIsChartPlotted] = useState(false);
  const [isHistoricalDataRefreshed, setRefreshHistoricalData] = useState(false);

  let [tradingData, setTradingData] = useState(null); // State to hold trading data

  const [LRLData, setLRLData] = useState([]);
  const [UCLData, setUCLData] = useState([]);
  const [LCLData, setLCLData] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [stochastics_K, setStochasticsK] = useState(null);
  const [stochastics_D, setStochasticsD] = useState(null);
  const [chart1, setChart1] = useState(null);
  const [chart2, setChart2] = useState(null);

  // Memoize fetchData to prevent recreation on every render
  const fetchData = useCallback(async () => {
    if (symbolValue === undefined || minOptionValue === undefined) {
      return;
    }

    try {
      const [response] = await Promise.all([
        ChartApis.getSymbolChartData({
          symbol: symbolValue,
          interval: minOptionValue,
        }),
      ]);
      
      if (response?.success) {
        const updatedData = response.data?.map((element) => ({
          timestamp: element?.datetime,
          open: element?.ha_open,
          high: element?.ha_high,
          low: element?.ha_low,
          close: element?.ha_close,
        }));

        const ohlcData = response.data?.map((element) => ({
          datetime: element?.datetime,
          open: element?.open,
          high: element?.high,
          low: element?.low,
          close: element?.close,
        }));

        const datetimeArray = ohlcData.map((dataPoint) => dataPoint.datetime);
        const closeArray = ohlcData.map((dataPoint) => dataPoint.close);
        const highArray = ohlcData.map((dataPoint) => dataPoint.high);
        const lowArray = ohlcData.map((dataPoint) => dataPoint.low);
        
        // Check if indicator data is present in API response
        const hasPreCalculatedPSAR = response.data && response.data.length > 0 && 
          (response.data[0].psar_value !== undefined || response.data[0].psar_signal !== undefined);
        const hasPreCalculatedStoch = response.data && response.data.length > 0 && 
          (response.data[0].stoch_k !== undefined || response.data[0].stoch_d !== undefined);
        
        // Calculate indicators in parallel using Promise.all for better performance
        const [markersResult, stochResult, lrcResult, alertResult] = await Promise.all([
          // PSAR markers - use pre-calculated if available, otherwise calculate
          enabled ? (async () => {
            if (hasPreCalculatedPSAR) {
              // Use pre-calculated PSAR data from API
              console.log('📊 Using pre-calculated PSAR data from API');
              let dataLength = closeArray.length;
              if (tickInterval !== '1min') {
                dataLength = Math.max(1, closeArray.length - 1);
              }
              
              const psarSignals = response.data.slice(0, dataLength).map((element) => element?.psar_signal || 0);
              
              const combinedDataLong = datetimeArray.slice(0, dataLength).map((datetime, index) => ({
                datetime: datetime,
                signal: psarSignals[index] === 1 ? 1 : 0,
              }));

              const combinedDataShort = datetimeArray.slice(0, dataLength).map((datetime, index) => ({
                datetime: datetime,
                signal: psarSignals[index] === -1 ? 1 : 0,
              }));

              const newMarkers1 = combinedDataLong
                ?.filter((element) => element?.signal === 1)
                ?.map((element) => ({
                  time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                  position: "belowBar",
                  color: upColor,
                  shape: "arrowUp",
                  text: "",
                  size: 1,
                }));

              const newMarkers2 = combinedDataShort
                ?.filter((element) => element?.signal === 1)
                ?.map((element) => ({
                  time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                  position: "aboveBar",
                  color: downColor,
                  shape: "arrowDown",
                  text: "",
                  size: 1,
                }));

              return [...newMarkers1, ...newMarkers2].sort((a, b) => a.time - b.time);
            } else {
              // Calculate PSAR on frontend (indicator data not available from API)
              console.log('📊 Calculating PSAR on frontend (indicator data not available)');
              let dataLength = closeArray.length;
              if (tickInterval !== '1min') {
                dataLength = Math.max(1, closeArray.length - 1);
              }
              
              const psar_values = calculatePSAR(
                highArray.slice(0, dataLength),
                lowArray.slice(0, dataLength),
                closeArray.slice(0, dataLength),
                parseFloat(acceleration),
                parseFloat(acceleration),
                parseFloat(maxAcceleration)
              );
              const longSignals = getPosSignals(closeArray.slice(0, dataLength), psar_values);
              const shortSignals = getNegSignals(closeArray.slice(0, dataLength), psar_values);
              
              const combinedDataLong = datetimeArray.slice(0, dataLength).map((datetime, index) => ({
                datetime: datetime,
                signal: longSignals[index],
              }));

              const combinedDataShort = datetimeArray.slice(0, dataLength).map((datetime, index) => ({
                datetime: datetime,
                signal: shortSignals[index],
              }));

              const newMarkers1 = combinedDataLong
                ?.filter((element) => element?.signal === 1)
                ?.map((element) => ({
                  time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                  position: "belowBar",
                  color: upColor,
                  shape: "arrowUp",
                  text: "",
                  size: 1,
                }));

              const newMarkers2 = combinedDataShort
                ?.filter((element) => element?.signal === 1)
                ?.map((element) => ({
                  time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                  position: "aboveBar",
                  color: downColor,
                  shape: "arrowDown",
                  text: "",
                  size: 1,
                }));

              return [...newMarkers1, ...newMarkers2].sort((a, b) => a.time - b.time);
            }
          })() : Promise.resolve([]),
          
          // Stochastic - use pre-calculated if available, otherwise calculate
          stochEnabled ? (async () => {
            if (hasPreCalculatedStoch) {
              // Use pre-calculated Stochastic data from API
              console.log('📊 Using pre-calculated Stochastic data from API');
              const combinedDataK = datetimeArray.map((datetime, index) => ({
                datetime: datetime,
                Stoch_K: response.data[index]?.stoch_k,
              }));

              const StochKData = combinedDataK
                ?.filter((element) => element?.Stoch_K !== null && element?.Stoch_K !== undefined && !isNaN(element?.Stoch_K))
                ?.map((element) => ({
                  time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                  value: element?.Stoch_K,
                }));

              const combinedDataD = datetimeArray.map((datetime, index) => ({
                datetime: datetime,
                Stoch_D: response.data[index]?.stoch_d,
              }));

              const StochDData = combinedDataD
                ?.filter((element) => element?.Stoch_D !== null && element?.Stoch_D !== undefined && !isNaN(element?.Stoch_D))
                ?.map((element) => ({
                  time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                  value: element?.Stoch_D,
                }));

              return { K: StochKData, D: StochDData };
            } else {
              // Calculate Stochastic on frontend (indicator data not available from API)
              console.log('📊 Calculating Stochastic on frontend (indicator data not available)');
              const { K, D } = calcFastStochastics(
                lowArray,
                highArray,
                closeArray,
                stoch_period,
                d_avg,
                k_avg
              );

              const combinedDataK = datetimeArray.map((datetime, index) => ({
                datetime: datetime,
                Stoch_K: K[index],
              }));

              const StochKData = combinedDataK
                ?.filter((element) => element?.Stoch_K !== null && !isNaN(element?.Stoch_K))
                ?.map((element) => ({
                  time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                  value: element?.Stoch_K,
                }));

              const combinedDataD = datetimeArray.map((datetime, index) => ({
                datetime: datetime,
                Stoch_D: D[index],
              }));

              const StochDData = combinedDataD
                ?.filter((element) => element?.Stoch_D !== null && !isNaN(element?.Stoch_D))
                ?.map((element) => ({
                  time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                  value: element?.Stoch_D,
                }));

              return { K: StochKData, D: StochDData };
            }
          })() : Promise.resolve({ K: [], D: [] }),
          
          // LRC
          lrcenabled ? (async () => {
            const { LRL, UCL, LCL } = linearRegressionChannel(
              closeArray,
              period,
              standardDeviation
            );

            const combinedLRL = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              LRL: LRL[index],
            }));

            const new_LRLData = combinedLRL
              ?.filter((element) => element?.LRL !== null)
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                value: element?.LRL,
              }));

            const combinedUCL = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              UCL: UCL[index],
            }));

            const new_UCLData = combinedUCL
              ?.filter((element) => element?.UCL !== null)
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                value: element?.UCL,
              }));

            const combinedLCL = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              LCL: LCL[index],
            }));

            const new_LCLData = combinedLCL
              ?.filter((element) => element?.LCL !== null)
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                value: element?.LCL,
              }));

            return { LRL: new_LRLData || [], UCL: new_UCLData || [], LCL: new_LCLData || [] };
          })() : Promise.resolve({ LRL: [], UCL: [], LCL: [] }),
          
          // Alerts
          ChartApis.getAlertsBySymbol({
            symbol: symbolValue,
            interval: minOptionValue,
          }).then(responseAlert => {
            if (responseAlert?.success) {
              const AlertData = responseAlert.data?.map((element) => ({
                timestamp: element?.datetime,
                scanID: element?.scan,
                color: element?.color,
              }));

              return AlertData?.map((element) => ({
                time: Math.floor(new Date(element?.timestamp).getTime() / 1000),
                position: "belowBar",
                color: element?.color,
                shape: "arrowUp",
                text: "Alert: " + element?.scanID,
                size: 2,
              })) || [];
            }
            return [];
          }).catch(() => [])
        ]);

        // Combine markers
        const finalMarkers = [...markersResult, ...alertResult].sort((a, b) => a.time - b.time);

        // Update all state in a single batch
        setTradingData(updatedData);
        setMarkers(finalMarkers);
        setStochasticsK(stochResult.K);
        setStochasticsD(stochResult.D);
        setLRLData(lrcResult.LRL);
        setUCLData(lrcResult.UCL);
        setLCLData(lrcResult.LCL);
        setRefreshHistoricalData(prev => !prev);

        DataLoadingServices.stopLoadingForMainChart();
        DataLoadingServices.stopLoadingForSecondaryChart();
      }
    } catch (error) {
      log("Error fetching trading data:", error);
    }
  }, [symbolValue, minOptionValue, enabled, acceleration, maxAcceleration, upColor, downColor, 
      tickInterval, stochEnabled, stoch_period, k_avg, d_avg, lrcenabled, period, standardDeviation]);

  useEffect(() => {
    fetchData();
  }, [symbolValue, fetchData]);

  useEffect(() => {

    const chartHeight = geChartHeight();
    chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          color: "#fff",
        },
        textColor: "#131722",
      },
      grid: {
        vertLines: { color: "#F2F3F3" },
        horzLines: { color: "#F2F3F3" },
      },
      rightPriceScale: {
        borderColor: "#E0E3EB",
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      crosshair: {
        // mode: 0,
        vertLine: {
          color: "#000000",
          labelBackgroundColor: "#000000",
        },
        horzLine: {
          color: "#000000",
          labelBackgroundColor: "#000000",
        },
      },
      localization: {
        timeFormatter: (time) => {
          return moment(new Date(time * 1000)).format("ddd D MMM 'YY HH:mm");
        },
      },
    });

    chart.timeScale().applyOptions({
      borderColor: "#E0E3EB",
      timeVisible: true,
      secondsVisible: true,
      fixRightEdge: true,
      fixLeftEdge: true,
      tickMarkFormatter: (time, tickMarkType, locale) => {
        const date = new Date(time * 1000);
        switch (tickMarkType) {
          case 0:
            return date.getFullYear();
          case 1:
            const monthFormatter = new Intl.DateTimeFormat(locale, {
              month: "short",
            });

            return monthFormatter.format(date);

          case 2:
            return moment(date).format("D-MMM");
          //return date.getDate();

          case 3:
            const timeFormatter = new Intl.DateTimeFormat(locale, {
              hour: "numeric",
              minute: "numeric",
            });

            return timeFormatter.format(date);

          case 4:
            const timeWithSecondsFormatter = new Intl.DateTimeFormat(locale, {
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            });

            return timeWithSecondsFormatter.format(date);
          default:
            console.log(`Sorry, we are out of .`);
        }
      },
    });

    candleStickSeries = chart.addCandlestickSeries();

    middleRLSeries = chart.addLineSeries({
      color: linColor,
      lineWidth: 3,
      lineStyle: 0,
    });

    upperRLSeries = chart.addLineSeries({
      color: upperColor,
      lineWidth: 3,
      lineStyle: 0,
    });

    lowerRLSeries = chart.addLineSeries({
      color: lowerColor,
      lineWidth: 3,
      lineStyle: 0,
    });

    candleStickSeries.applyOptions({
      wickUpColor: "#22ab94",    // Lighter green wick
      upColor: "#22ab94",        // Green candle
      wickDownColor: "#f7525f",  // Lighter red wick
      downColor: "#f7525f",      // Red candle
      borderVisible: false,
    });

    const handleResize = () => {
      const height = geChartHeight();

      chart.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: height,
      });
    };

    window.addEventListener("resize", handleResize);

    setChart1(chart);

    return () => {
      chart.remove();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousedown", handleResize);
      window.removeEventListener("mouseup", handleResize);
    };
  }, []);

  useEffect(() => {
    const chart2Height = geChart2Height();
    let chart2;
    chart2 = createChart(chartContainerRef2.current, {
      layout: {
        background: {
          color: "#fff",
        },
        textColor: "#131722",
      },
      grid: {
        vertLines: { color: "#F2F3F3" },
        horzLines: { color: "#F2F3F3" },
      },
      rightPriceScale: {
        borderColor: "#E0E3EB",
        minValue: 0,
        maxValue: 100,
        autoScale: true,
      },
      width: chartContainerRef2.current.clientWidth,
      height: chart2Height,
      crosshair: {
        // mode: 0,
        vertLine: {
          color: "#000000",
          labelBackgroundColor: "#000000",
        },
        horzLine: {
          color: "#000000",
          labelBackgroundColor: "#000000",
        },
      },
      timeScale: {
        visible: true, // Set `visible` to `false` to hide the time scale
      },
      localization: {
        timeFormatter: (time) => {
          return moment(new Date(time * 1000)).format("ddd D MMM 'YY HH:mm");
        },
      },
    });

    chart2.timeScale().applyOptions({
      borderColor: "#E0E3EB",
      timeVisible: true,
      secondsVisible: true,
      fixRightEdge: true,
      fixLeftEdge: true,
      tickMarkFormatter: (time, tickMarkType, locale) => {
        const date = new Date(time * 1000);
        switch (tickMarkType) {
          case 0:
            return date.getFullYear();
          case 1:
            const monthFormatter = new Intl.DateTimeFormat(locale, {
              month: "short",
            });

            return monthFormatter.format(date);

          case 2:
            return moment(date).format("D-MMM");
          //return date.getDate();

          case 3:
            const timeFormatter = new Intl.DateTimeFormat(locale, {
              hour: "numeric",
              minute: "numeric",
            });

            return timeFormatter.format(date);

          case 4:
            const timeWithSecondsFormatter = new Intl.DateTimeFormat(locale, {
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            });

            return timeWithSecondsFormatter.format(date);
          default:
            console.log(`Sorry, we are out of .`);
        }
      },
    });

    stochKSeries = chart2.addLineSeries({
      color: k_color,
      lineWidth: k_line_size,
      lineStyle: 0,
      // added here
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 100,
        },
      }),
      // upto here
    });

    stochDSeries = chart2.addLineSeries({
      color: d_color,
      lineWidth: d_line_size,
      lineStyle: 0,
      // added here
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: 0,
          maxValue: 100,
        },
      }),
      // upto here
    });

    const handleResize2 = () => {
      //const height = geChartHeight();
      const chart2Height = geChart2Height();
      chart2.applyOptions({
        width: chartContainerRef2.current.clientWidth,
        height: chart2Height,
      });
    };

    window.addEventListener("resize", handleResize2);

    setChart2(chart2);

    return () => {
      chart2.remove();
      window.removeEventListener("resize", handleResize2);
      window.removeEventListener("mousedown", handleResize2);
      window.removeEventListener("mouseup", handleResize2);
    };
  }, []);
  //Synchronization of Charts
  useEffect(() => {

    if (chart1 && chart2) {
      chart1.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
        //console.log('timeRange:', timeRange)
        if (timeRange !== null) {
          chart2.timeScale().setVisibleLogicalRange(timeRange);
        }
      });

      chart2.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
        //console.log('timeRange:', timeRange)
        if (timeRange !== null) {
          chart1.timeScale().setVisibleLogicalRange(timeRange);
        }
      });
    }
  }, [chart1, chart2]);

  // OLD fetchData removed - using optimized useCallback version above (lines 94-314)

  useEffect(() => {
    _updatedInstrumentToken = instrumentToken;
    _updatedTickInterval = tickInterval;
    fetchData();
    setupInterval();
    return () => clearInterval(intervalInstance);
  }, [
    instrumentToken,
    tickInterval,
    minOptionValue,
    fetchData, // Now memoized, so won't cause unnecessary re-renders
  ]);

  // Memoize refreshData to prevent recreation
  const refreshData = useCallback(async () => {
    if (symbolValue === undefined || minOptionValue === undefined) {
      return;
    }
    
    try {
      const [response] = await Promise.all([
        ChartApis.getSymbolChartData({
          symbol: symbolValue,
          interval: minOptionValue,
        }),
      ]);

      if (response.success) {
        const updatedData = response?.data?.map((element) => ({
          timestamp: element?.datetime,
          open: element?.ha_open,
          high: element?.ha_high,
          low: element?.ha_low,
          close: element?.ha_close,
        }));
        
        // Early return if no new data
        if (tradingData) {
          const lastTradingDataTimestamp = tradingData[tradingData.length - 1]?.timestamp;
          const lastUpdatedDataTimestamp = updatedData[updatedData.length - 1]?.timestamp;
          if (lastTradingDataTimestamp === lastUpdatedDataTimestamp) {
            return;
          }
        }

        const ohlcData = response.data?.map((element) => ({
          datetime: element?.datetime,
          open: element?.open,
          high: element?.high,
          low: element?.low,
          close: element?.close,
        }));
        //console.log('ohlcData', ohlcData);
        const datetimeArray = ohlcData.map((dataPoint) => dataPoint.datetime);
        const closeArray = ohlcData.map((dataPoint) => dataPoint.close);
        const highArray = ohlcData.map((dataPoint) => dataPoint.high);
        const lowArray = ohlcData.map((dataPoint) => dataPoint.low);

        // Check if indicator data is present in API response
        const hasPreCalculatedPSAR = response.data && response.data.length > 0 && 
          (response.data[0].psar_value !== undefined || response.data[0].psar_signal !== undefined);
        const hasPreCalculatedStoch = response.data && response.data.length > 0 && 
          (response.data[0].stoch_k !== undefined || response.data[0].stoch_d !== undefined);

        if (lrcenabled) {
          //console.log('in lrcenabled LRC period', period);
          const ohlcData = response.data?.map((element) => ({
            datetime: element?.datetime,
            open: element?.open,
            high: element?.high,
            low: element?.low,
            close: element?.close,
          }));

          const datetimeArray = ohlcData.map((dataPoint) => dataPoint.datetime);
          const closeArray = ohlcData.map((dataPoint) => dataPoint.close);

          const { LRL, UCL, LCL } = linearRegressionChannel(
            closeArray,
            period,
            standardDeviation
          );

          const combinedLRL = datetimeArray.map((datetime, index) => ({
            datetime: datetime,
            LRL: LRL[index],
          }));

          const new_LRLData = combinedLRL
            ?.filter((element) => element?.LRL !== null)
            ?.map((element) => ({
              time: Math.floor(new Date(element?.datetime).getTime() / 1000),
              value: element?.LRL,
            }));
          const combinedUCL = datetimeArray.map((datetime, index) => ({
            datetime: datetime,
            UCL: UCL[index],
          }));
          const combinedLCL = datetimeArray.map((datetime, index) => ({
            datetime: datetime,
            LCL: LCL[index],
          }));
          setLRLData(new_LRLData || []);

          const new_UCLData = combinedUCL
            ?.filter((element) => element?.UCL !== null)
            ?.map((element) => ({
              time: Math.floor(new Date(element?.datetime).getTime() / 1000),
              value: element?.UCL,
            }));

          setUCLData(new_UCLData || []);

          const new_LCLData = combinedLCL
            ?.filter((element) => element?.LCL !== null)
            ?.map((element) => ({
              time: Math.floor(new Date(element?.datetime).getTime() / 1000),
              value: element?.LCL,
            }));

          setLCLData(new_LCLData || []);
        } else {
          //console.log("in else lrcenabled refresh");
          setLCLData([]);
          setUCLData([]);
          setLRLData([]);
        }
        console.log("Refresh data enabled:", enabled);

        let newMarkers = [];
        if (enabled) {
          if (hasPreCalculatedPSAR) {
            // Use pre-calculated PSAR data from API
            console.log('📊 Refresh: Using pre-calculated PSAR data from API');
            const psarSignals = response.data.map((element) => element?.psar_signal || 0);
            
            const combinedDataLong = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              signal: psarSignals[index] === 1 ? 1 : 0,
            }));

            const combinedDataShort = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              signal: psarSignals[index] === -1 ? 1 : 0,
            }));

            const newMarkers1 = combinedDataLong
              ?.filter((element) => element?.signal === 1)
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                position: "belowBar",
                color: upColor,
                shape: "arrowUp",
                text: "",
                size: 1,
              }));

            const newMarkers2 = combinedDataShort
              ?.filter((element) => element?.signal === 1)
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                position: "aboveBar",
                color: downColor,
                shape: "arrowDown",
                text: "",
                size: 1,
              }));

            newMarkers = [...newMarkers1, ...newMarkers2].sort(
              (a, b) => a.time - b.time
            );
            setMarkers(newMarkers);
          } else {
            // Calculate PSAR on frontend (indicator data not available from API)
            console.log('📊 Refresh: Calculating PSAR on frontend (indicator data not available)');
            const psar_values = calculatePSAR(
              highArray,
              lowArray,
              closeArray,
              parseFloat(acceleration),
              parseFloat(acceleration),
              parseFloat(maxAcceleration)
            );
            const longSignals = getPosSignals(closeArray, psar_values);
            const shortSignals = getNegSignals(closeArray, psar_values);
            
            const combinedDataLong = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              signal: longSignals[index],
            }));

            const combinedDataShort = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              signal: shortSignals[index],
            }));

            const newMarkers1 = combinedDataLong
              ?.filter((element) => element?.signal === 1)
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                position: "belowBar",
                color: upColor,
                shape: "arrowUp",
                text: "",
                size: 1,
              }));

            const newMarkers2 = combinedDataShort
              ?.filter((element) => element?.signal === 1)
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                position: "aboveBar",
                color: downColor,
                shape: "arrowDown",
                text: "",
                size: 1,
              }));

            newMarkers = [...newMarkers1, ...newMarkers2].sort(
              (a, b) => a.time - b.time
            );
            setMarkers(newMarkers);
          }
        } else {
          setMarkers([]);
        }
        // ------------------------------------------------------- Stoch Logic -------------------------------------
        if (stochEnabled) {
          if (hasPreCalculatedStoch) {
            // Use pre-calculated Stochastic data from API
            console.log('📊 Refresh: Using pre-calculated Stochastic data from API');
            const combinedDataK = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              Stoch_K: response.data[index]?.stoch_k,
            }));

            const StochKData = combinedDataK
              ?.filter(
                (element) => element?.Stoch_K !== null && element?.Stoch_K !== undefined && !isNaN(element?.Stoch_K)
              )
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                value: element?.Stoch_K,
              }));
            setStochasticsK(StochKData);

            const combinedDataD = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              Stoch_D: response.data[index]?.stoch_d,
            }));

            const StochDData = combinedDataD
              ?.filter(
                (element) => element?.Stoch_D !== null && element?.Stoch_D !== undefined && !isNaN(element?.Stoch_D)
              )
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                value: element?.Stoch_D,
              }));

            setStochasticsD(StochDData);
          } else {
            // Calculate Stochastic on frontend (indicator data not available from API)
            console.log('📊 Refresh: Calculating Stochastic on frontend (indicator data not available)');
            const { K, D } = calcFastStochastics(
              lowArray,
              highArray,
              closeArray,
              stoch_period,
              d_avg,
              k_avg
            );
            
            const combinedDataK = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              Stoch_K: K[index],
            }));

            const StochKData = combinedDataK
              ?.filter(
                (element) => element?.Stoch_K !== null && !isNaN(element?.Stoch_K)
              )
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                value: element?.Stoch_K,
              }));
            setStochasticsK(StochKData);

            const combinedDataD = datetimeArray.map((datetime, index) => ({
              datetime: datetime,
              Stoch_D: D[index],
            }));

            const StochDData = combinedDataD
              ?.filter(
                (element) => element?.Stoch_D !== null && !isNaN(element?.Stoch_D)
              )
              ?.map((element) => ({
                time: Math.floor(new Date(element?.datetime).getTime() / 1000),
                value: element?.Stoch_D,
              }));

            setStochasticsD(StochDData);
          }
        } else {
          setStochasticsK([]);
          setStochasticsD([]);
        }

        // fetch Alerts Data
        const [responseAlert] = await Promise.all([
          ChartApis.getAlertsBySymbol({
            symbol: symbolValue,
            interval: minOptionValue,
          }),
        ]);

        if (responseAlert?.success) {
          const AlertData = responseAlert.data?.map((element) => ({
            timestamp: element?.datetime,
            scanID: element?.scan,
          }));
          //console.log('AlertData:', AlertData);

          const alertMarkers = AlertData?.map((element) => ({
            time: Math.floor(new Date(element?.timestamp).getTime() / 1000),
            position: "belowBar",
            color: "#0000FF",
            shape: "arrowUp",
            text: "Alert: " + element?.scanID,
            size: 2,
          }));
          //console.log('alertMarkets', alertMarkers);
          const finalMarkers = [...newMarkers, ...alertMarkers].sort(
            (a, b) => a.time - b.time
          );

          setMarkers(finalMarkers);
        }

        _updatedTradingData = updatedData;
        setTradingData(updatedData);
        setRefreshHistoricalData(!isHistoricalDataRefreshed);
      } else {
        console.log(
          "refreshData Failed to fetch trading data:",
          response?.error
        );
      }
    } catch (error) {
      log("Error refreshing trading data:", error);
    }
  }, [symbolValue, minOptionValue, enabled, acceleration, maxAcceleration, upColor, downColor,
      tickInterval, stochEnabled, stoch_period, k_avg, d_avg, lrcenabled, period, standardDeviation, tradingData]);

  const setupInterval = () => {
    // if (intervalInstance) clearInterval(intervalInstance);
    // intervalInstance = setInterval(refreshData, 60000); // Refresh every 1 minute
  };

  useEffect(() => {
    //console.log('symbolValue or minOptionValue changed, resetting interval');
    setupInterval();

    return () => clearInterval(intervalInstance); // Cleanup on dependency change
  }, [symbolValue, minOptionValue]);

  // Memoize chart data transformation to prevent recalculation
  const chartData = useMemo(() => {
    if (!tradingData) return null;
    return tradingData.map((element) => ({
      open: element?.open,
      high: element?.high,
      low: element?.low,
      close: element?.close,
      time: Math.floor(new Date(element?.timestamp).getTime() / 1000),
    }));
  }, [tradingData]);

  // Optimize chart updates - batch all updates together
  useEffect(() => {
    if (!chartData || !candleStickSeries) return;

    _updatedTradingData = tradingData;
    
    // Batch all chart updates in a single operation
    requestAnimationFrame(() => {
      candleStickSeries.setData(chartData);
      candleStickSeries.setMarkers(markers.length > 0 ? markers : []);
      
      if (stochKSeries && markers.length > 0) {
        stochKSeries.setMarkers(markers);
      }

      // LRC updates
      if (LRLData && LRLData.length > 0) {
        middleRLSeries?.setData(LRLData);
        upperRLSeries?.setData(UCLData);
        lowerRLSeries?.setData(LCLData);
        upperRLSeries?.applyOptions({ visible: true, color: upperColor, lineVisible: true });
        middleRLSeries?.applyOptions({ visible: true, color: linColor, lineVisible: true });
        lowerRLSeries?.applyOptions({ visible: true, color: lowerColor, lineVisible: true });
      } else if (upperRLSeries) {
        upperRLSeries.applyOptions({ visible: false });
        middleRLSeries?.applyOptions({ visible: false });
        lowerRLSeries?.applyOptions({ visible: false });
      }

      // Stochastic updates
      if (stochastics_K && stochastics_K.length > 0) {
        stochKSeries?.setData(stochastics_K);
        stochKSeries?.applyOptions({ visible: true, color: k_color, lineWidth: k_line_size, lineVisible: true });
      } else if (stochKSeries) {
        stochKSeries.applyOptions({ visible: false });
      }

      if (stochastics_D && stochastics_D.length > 0) {
        stochDSeries?.setData(stochastics_D);
        stochDSeries?.applyOptions({ visible: true, color: d_color, lineWidth: d_line_size, lineVisible: true });
      } else if (stochDSeries) {
        stochDSeries.applyOptions({ visible: false });
      }

      setIsChartPlotted(true);
    });
  }, [chartData, markers, LRLData, UCLData, LCLData, stochastics_K, stochastics_D, 
      upperColor, lowerColor, linColor, k_color, d_color, k_line_size, d_line_size, tradingData]);

  const zoomIn = useCallback((factor) => {

    const visibleRange = chart.timeScale().getVisibleRange();
    if (visibleRange !== null) {
      const centerTime = (visibleRange.from + visibleRange.to) / 2;
      const newRange = {
        from: centerTime - (visibleRange.to - visibleRange.from) * factor,
        to: centerTime + (visibleRange.to - visibleRange.from) * factor,
      };
      chart.timeScale().setVisibleRange(newRange);
    }
  }, [chart]);

  const zoomHandler = useCallback(() => {

    let zoomInFactor = 0.5;
    let zoomOutFactor = 0.5;
    const zoomInButton = document.getElementById("zoomInButton");
    const zoomOutButton = document.getElementById("zoomOutButton");
    zoomInButton?.addEventListener("click", function () {
      zoomOutFactor = 0.5;
      zoomInFactor = zoomInFactor - 0.005;
      zoomIn(zoomInFactor);
    });

    zoomOutButton?.addEventListener("click", function () {
      zoomInFactor = 0.5;
      zoomOutFactor = zoomOutFactor + 0.005;
      zoomIn(zoomOutFactor);
    });
  }, [zoomIn]);

  const zoomHandlerMobile = useCallback(() => {

    let zoomInFactor = 0.5;
    let zoomOutFactor = 0.5;
    const zoomInButton = document.getElementById("zoomInButton_mobile");
    const zoomOutButton = document.getElementById("zoomOutButton_mobile");
    zoomInButton?.addEventListener("click", function () {
      zoomOutFactor = 0.5;
      zoomInFactor = zoomInFactor - 0.005;
      zoomIn(zoomInFactor);
    });

    zoomOutButton?.addEventListener("click", function () {
      zoomInFactor = 0.5;
      zoomOutFactor = zoomOutFactor + 0.005;
      zoomIn(zoomOutFactor);
    });
  }, [zoomIn]);

  useEffect(() => {

    if (chart1 !== null) {
      zoomHandler();
      zoomHandlerMobile();
      // if (tradingData) {
      //   const timestamps = tradingData?.map((entry) =>
      //     Math.floor(new Date(entry?.timestamp).getTime() / 1000)
      //   );
      //   let minDate = timestamps[Math.ceil(timestamps?.length / 2)];
      //   const newRange = {
      //     from: Math.max(...timestamps) - 100000,
      //     to: Math.max(...timestamps),
      //   };
      //   if (timestamps.length !== 0 && chart1 !== null) {
      //     console.log('useEffect setVisibleRange');
      //     //chart1?.timeScale()?.setVisibleRange(newRange);
      //   }
      // }
    }
  }, [symbolValue]);

  return (
    <div className="graph-container">
      <div ref={chartContainerRef} id="main-chart-element"></div>
      <div ref={chartContainerRef2} id="secondary-chart-element"></div>
    </div>
  );
}

export default TradingChart;
