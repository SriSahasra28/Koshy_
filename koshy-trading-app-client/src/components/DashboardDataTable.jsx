import React, { useEffect, useState, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import moment from "moment";
import { ChartApis } from "../api/charts.apis";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { headerActions } from "../redux/features/header.slice";
import { CircularProgress } from "@mui/material";
import { DataLoadingServices } from "../utils/common.services";

class DashboardDataTableState {
  static dataPaginationState = {
    page: 1,
    limit: 100,
    data: [],
  };

  static setTableData = ({ data }) => {
    this.dataPaginationState.data = data;
  };

  static getTableData = () => {
    return this.dataPaginationState.data;
  };

  static handleDataPaginationNext = () => {
    this.dataPaginationState.page = this.dataPaginationState.page + 1;
  };

  static resetDataPaginationState = () => {
    this.dataPaginationState.page = 1;
    this.dataPaginationState.limit = 100;
  };
}

const DashboardDataTable = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [data, setData] = useState([]);
  const intervalInstance = useRef(null);
  const dispatch = useDispatch(); // Add this line to use dispatch
  const lrcData = useSelector((state) => state?.header?.lrcValues);
  const stochData = useSelector((state) => state?.header?.stochValues);
  const psarData = useSelector((state) => state?.header?.markersValues);
  const websocketRef = useRef(null); // Ref to store the WebSocket connection

  const symbolSetHandler = (symbol, timeframe, scanid) => {
    const fetchIndicators = async (scanid) => {
      try {
        let res = await ChartApis.getScanIndicatorsById({ scanid });

        if (res.success) {
          const { lrc, psar, stoch } = res.data;

          // Separate values into string variables
          const lrcValue = lrc ? String(lrc) : "";
          const psarValue = psar ? String(psar) : "";
          const stochValue = stoch ? String(stoch) : "";

          const [lrc_period, lrc_standardDeviation] = lrcValue.split(",");
          const [psar_acceleration, psar_max_acceleration] =
            psarValue.split(",");
          const [period, k_avg, d_avg] = stochValue.split(",");

          console.log("DashboardDataTable: lrc_period:", lrc_period);
          console.log("lrc_standardDeviation:", lrc_standardDeviation);
          dispatch(
            headerActions.setLRCValue({
              period: lrc_period,
              standardDeviation: lrc_standardDeviation,
              upperColor: lrcData.upperColor,
              lowerColor: lrcData.lowerColor,
              linColor: lrcData.linColor,
              lrcenabled: lrcData.lrcenabled,
            })
          );

          dispatch(
            headerActions.setStochValue({
              stoch_period: period,
              k_avg: k_avg,
              d_avg: d_avg,
              k_color: stochData.k_color,
              d_color: stochData.d_color,
              k_line_size: stochData.k_line_size,
              d_line_size: stochData.d_line_size,
              stochEnabled: stochData.stochEnabled,
            })
          );
          // Update PSAR as per alert
          console.log("psar_acceleration:", psar_acceleration);
          console.log("psar_max_acceleration:", psar_max_acceleration);

          dispatch(
            headerActions.setMarkersValue({
              acceleration: psar_acceleration,
              maxAcceleration: psar_max_acceleration,
              upColor: psarData.upColor,
              downColor: psarData.downColor,
              enabled: psarData.enabled,
            })
          );
        } else {
          console.error("Failed to retrieve indicators:", res.message);
        }
      } catch (err) {
        console.error("Something went wrong fetching indicators", err);
      }
    };

    fetchIndicators(scanid);

    dispatch(headerActions.setSymbolValue({ symbol }));
    dispatch(headerActions.setMinOptionValue({ value: timeframe }));
    // console.log('set alertColor', alertColor);
    // dispatch(headerActions.setAlertColor({ value: alertColor }));
  };

  const fetchAlerts = async ({ resetAlerts = false }) => {
    try {
      DataLoadingServices.homepageLoaders.showDataTableLoader();

      if (resetAlerts) DashboardDataTableState.resetDataPaginationState();

      let page = DashboardDataTableState.dataPaginationState.page;
      let limit = DashboardDataTableState.dataPaginationState.limit;

      let res = await ChartApis.getAlerts({
        page,
        limit,
      });
      if (res.success) {
        let tableData = DashboardDataTableState.getTableData();
        let previousData = [...tableData];
        previousData = [...previousData, ...res.data];

        if (resetAlerts) previousData = [...res.data];

        DashboardDataTableState.setTableData({
          data: previousData,
        });

        setData(previousData);
        console.log("------ fetchAlerts -----------");

        if (res?.data?.length > 25) {
          DataLoadingServices.homepageLoaders.showDataTableLoader();
        } else DataLoadingServices.homepageLoaders.hideDataTableLoader();
      }
    } catch (err) {
      console.error("Something went wrong fetching Alerts", err);
    }
  };

  const deleteAlert = async () => {
    try {
      // Collect all delete promises
      const deletePromises = selectedProducts.map((product) =>
        ChartApis.deleteAlert(product.id)
      );

      // Wait for all promises to resolve
      await Promise.all(deletePromises);

      // Show success message
      toast.success("Alerts deleted successfully");

      // Refresh the data
      fetchAlerts({
        resetAlerts: false,
      });

      // Clear selected products
      setSelectedProducts([]);
    } catch (err) {
      console.error("Something went wrong deleting Alert", err);
      toast.error("Something went wrong deleting Alerts");
    }
  };

  const fetchMoreData = async () => {
    DashboardDataTableState.handleDataPaginationNext();

    fetchAlerts({
      resetAlerts: false,
    });
  };

  const handleScrollInDataTableContainer = () => {
    const container = document.querySelector(`#homepage-data-table-container`);

    if (!container) return;

    container.addEventListener("scroll", (_event) => {
      let eventData = _event?.target;

      if (
        eventData?.scrollHeight -
        eventData?.scrollTop -
        eventData?.clientHeight <
        1
      ) {
        fetchMoreData();
      }
    });
  };

  // const setupInterval = () => {
  //   if (intervalInstance.current) clearInterval(intervalInstance.current);
  //   intervalInstance.current = setInterval(fetchAlerts, 60000); // Refresh every 1 minute
  // };

  // useEffect(() => {
  //   fetchAlerts();
  //   setupInterval();

  //   return () => clearInterval(intervalInstance.current);
  // }, []);
  useEffect(() => {
    fetchAlerts({
      resetAlerts: false,
    });

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
    let websocketUrl = apiEndpoint
      .replace(":1000", ":8080")
      .replace("/api", "");

    if (websocketUrl.includes('103.160.145.141')) {
      websocketUrl = 'ws://103.160.145.141/ws';
    } else {
      if (websocketUrl.startsWith("http://")) {
        websocketUrl = websocketUrl.replace("http://", "ws://");
      } else if (websocketUrl.startsWith("https://")) {
        websocketUrl = websocketUrl.replace("https://", "wss://");
      }
    }
    console.log("WebSocket URL:", websocketUrl);
    websocketRef.current = new WebSocket(websocketUrl);

    websocketRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Only react to alert type messages
        if (msg.type === 'alert') {
          console.log("Received alert:", msg.data);
          fetchAlerts({ resetAlerts: true });
        }
      } catch {
        // Legacy plain-text alert message — still reload
        fetchAlerts({ resetAlerts: true });
      }
    };

    handleScrollInDataTableContainer();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close(); // Clean up the WebSocket connection
      }
    };
  }, []); // Empty dependency array to run the effect only once

  const onSelectionChangeHandler = (e) => {
    console.log("in onSelectionChangeHandler", e.value);
    setSelectedProducts(e.value);
  };

  const renderDateEndTimeBody = (data) => {
    let dateString = moment(data?.datetime).format("ll");
    let timeString = moment(data?.datetime).format("HH:mm");
    let dateStringArray = dateString?.split(",");
    let updateString = `${dateStringArray[0]} ${timeString}`;
    return updateString;
  };

  const symbolBodyTemplate = (rowData) => {
    //console.log('rowData', rowData);
    const handleClick = (event) => {
      event.stopPropagation(); // Prevents the click event from propagating
      symbolSetHandler(rowData.symbol, rowData.timeframe, rowData.scanid);
    };

    return (
      <span style={{ cursor: "pointer", color: "blue" }} onClick={handleClick}>
        {rowData.symbol}
      </span>
    );
  };

  return (
    <div className="table_container" id="homepage-data-table-container">
      <div
        className={`table_delete_container ${selectedProducts?.length > 0 ? "" : "display_none"
          }`}
      >
        <Button label="Delete" onClick={deleteAlert} />
      </div>
      <DataTable
        value={data}
        tableStyle={{ minWidth: "50rem" }}
        selection={selectedProducts}
        onSelectionChange={onSelectionChangeHandler}
        dataKey="id"
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "3rem" }}
          className="check_box_column"
        />
        <Column
          field="symbol"
          header="NAME"
          body={symbolBodyTemplate} // Use the custom cell renderer
          className="name_column"
        />
        <Column
          field="datetime"
          header="TIME"
          body={renderDateEndTimeBody}
          className="date_and_time_column"
        />
        <Column field="scan" header="SCAN" className="scan_column" />
        <Column field="timeframe" header="TF" className="timeframe_column" />
      </DataTable>

      <div id="homepage-data-table-loader" className="">
        <div className="loader-container">
          <CircularProgress size="25px" />
        </div>
      </div>
    </div>
  );
};

export default DashboardDataTable;
