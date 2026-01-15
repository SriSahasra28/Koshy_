import React, { useEffect } from "react";
import TradingChart from "./TradingChart";
import DashboardDataTable from "./DashboardDataTable";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import GroupsTree from "./groupsTree/GroupsTree";
import { useDispatch, useSelector } from "react-redux";
import GroupsTreeSideBar from "./groupsTree/mobile/GroupsTreeSideBar";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { headerActions } from "../redux/features/header.slice";
import { Skeleton } from "primereact/skeleton";
import { DataLoadingServices } from "../utils/common.services";

function HomePage() {
  const navigate = useNavigate();
  let symbolValue = useSelector((state) => state?.header?.symbolValue);
  const menuModal = useSelector((state) => state?.header?.menuModal);

  const dispatch = useDispatch();

  const geChartHeight = () => {
    const height = window?.innerHeight;
    let percentageHeight = (height * 20) / 100;
    let chartHeight = height + 235 - 1.8 - 48 - 5 - percentageHeight;

    return chartHeight ?? 780;
  };

  const onClickToggleSideBar = () => {
    dispatch(headerActions.setGroupsSideBar());
  };

  useEffect(() => {
    DataLoadingServices.stopLoadingForMainChart();
    DataLoadingServices.stopLoadingForSecondaryChart();
    DataLoadingServices.stopLoadingForTable();
  }, []);

  return (
    <div className="homepage">
      <Header />

      {/* Scroll Strip */}
      <div className="scroll-strip"></div>

      <GroupsTreeSideBar />

      {!menuModal && (
        <div
          className="side_bar_toggle_btn"
          title="hello"
          onClick={onClickToggleSideBar}
        >
          <ArrowForwardIosRoundedIcon />
        </div>
      )}

      <div className="container">
        <div className="row">
          <div
            className="col-2 left-sidebar"
            style={{ height: geChartHeight() }}
          >
            <div>
              <GroupsTree />
            </div>
          </div>
          <div className="col-10 data-container ">
            <div className="chart-container">
              <div id="homepage-charts-container">
                <TradingChart key={symbolValue} />
              </div>

              <div className="loading-containers">
                <div className="loading-container-for-top-chart">
                  <Skeleton
                    width="100%"
                    height="100%"
                    animation="wave"
                    shape="rectangle"
                    className="loading-skeleton-for-top-chart"
                  />
                </div>
              </div>
            </div>
            <div className="table-container homepage-table-container">
              <DashboardDataTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
