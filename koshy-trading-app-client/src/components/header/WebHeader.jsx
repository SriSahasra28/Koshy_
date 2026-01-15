import React from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { headerActions } from "../../redux/features/header.slice";
import { CommonEnums } from "../../enums/common.enums";
import { Dropdown, InputGroup, Modal } from "react-bootstrap";
import IndicatorModal from "./IndicatorModal";
import LRCModal from "./LRCModal";
import FastStochModal from "./FastStoch";

const WebHeader = () => {
  const dispatch = useDispatch();
  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  let minOption = [
    {
      id: "1",
      option: "1 min",
      value: 1,
    },
    {
      id: "2",
      option: "2 min",
      value: 2,
    },
    {
      id: "3",
      option: "3 min",
      value: 3,
    },
    {
      id: "4",
      option: "5 min",
      value: 5,
    },
    {
      id: "5",
      option: "10 min",
      value: 10,
    },
    {
      id: "6",
      option: "15 min",
      value: 15,
    },
    {
      id: "7",
      option: "30 min",
      value: 30,
    },
    {
      id: "8",
      option: "1 hour",
      value: 60,
    },
  ];

  const indicators = [
    {
      value: CommonEnums.indicators.linear_regression,
      label: "Linear Regression",
    },
    {
      value: CommonEnums.indicators.PSAR,
      label: "PSAR",
    },
    {
      value: CommonEnums.indicators.FastStochastics,
      label: "Fast Stochastics",
    },
    {
      value: CommonEnums.indicators.MACD,
      label: "MACD",
    },
  ];
  const openIndicatorsUpdateModal = (type) => {
    if (type === CommonEnums.indicators.PSAR) {
      setIndicatorsModalState({
        ...indicatorsModalState,
        open: true,
        selectedIndicator: type,
      });
    } else if (type === CommonEnums.indicators.linear_regression) {
      setLRCModalState({
        ...LRCModalState,
        open: true,
        selectedIndicator: type,
      });
    } else if (type === CommonEnums.indicators.FastStochastics) {
      setStochModalState({
        ...StochModalState,
        open: true,
        selectedIndicator: type,
      });
    }
  };

  const closeIndicatorsUpdateModal = () => {
    setIndicatorsModalState({
      ...indicatorsModalState,
      open: false,
      selectedIndicator: "",
    });
  };
  const closeLRCUpdateModal = () => {
    setLRCModalState({
      ...setLRCModalState,
      open: false,
      selectedIndicator: "",
    });
  };

  const closeFastStochModal = () => {
    setStochModalState({
      ...setStochModalState,
      open: false,
      selectedIndicator: "",
    });
  };

  const [indicatorsModalState, setIndicatorsModalState] = React.useState({
    open: false,
    selectedIndicator: CommonEnums.indicators.PSAR,
  });

  const [LRCModalState, setLRCModalState] = React.useState({
    open: false,
    selectedIndicator: CommonEnums.indicators.linear_regression,
  });

  const [StochModalState, setStochModalState] = React.useState({
    open: false,
    selectedIndicator: CommonEnums.indicators.FastStochastics,
  });

  const onChangeMinOption = (e) => {
    console.log("e>>>", e.target.value);
    dispatch(headerActions.setMinOptionValue({ value: e.target.value }));
  };
  const spanStyle = {
    backgroundColor: "white",
    padding: "8px",
    borderRadius: "8px",
  };
  // const onClickZoomIn = () => {
  //   dispatch(headerActions.setChartZoomIn());
  // };
  return (
    <>
      <div className="header-container web-header-container">
        <div className="content-left">
          <div className="input-container name-selector">
            {/* <Form.Label className="input-label" htmlFor="basic-url">
      Expiry
    </Form.Label> */}
            <Form.Select
              aria-label="Default select example"
              className="form-selector"
              onChange={(e) => {
                // formik.setFieldValue("expiry", e?.target?.value);
              }}
              // value={formik.values.expiry}
            >
              <option value={0}>Heikin Ashi</option>
            </Form.Select>
          </div>

          <div className="header-divider"></div>

          <div className="header-divider"></div>

          <div className="input-container time-selector">
            <Form.Select
              aria-label="Default select example"
              className="form-selector"
              onChange={onChangeMinOption}
              // value={formik.values.expiry}
            >
              {minOption.map((optionData) => (
                <option
                  key={optionData?.id}
                  // onClick={() => onClickOption(optionData?.value)}
                  onChange={() => {
                    debugger;
                  }}
                  value={optionData?.value}
                >
                  {optionData?.option}
                </option>
              ))}
            </Form.Select>
          </div>

          <div className="header-divider"></div>

          <div className="input-container type-selector">
            {/* <Form.Select
              aria-label="Default select example"
              className="form-selector"
              onChange={(e) => {
                // formik.setFieldValue("expiry", e?.target?.value);
              }}
              // value={formik.values.expiry}
            >
              <option>Linear Regression</option>
              <option>PSAR</option>
              <option>MACD</option>
            </Form.Select> */}
            <Dropdown className="d-inline mx-2" style={{ width: "100px" }}>
              <Dropdown.Toggle
                id="dropdown-autoclose-true"
                className="indicators-button"
              >
                <span className="d-flex align-items-center" style={spanStyle}>
                  Indicators
                </span>
              </Dropdown.Toggle>

              <Dropdown.Menu className="indicators-menu">
                {indicators.map((indicator) => {
                  return (
                    <Dropdown.Item
                      key={indicator.value}
                      onClick={() => {
                        openIndicatorsUpdateModal(indicator.value);
                      }}
                    >
                      {indicator.label}
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        <div className="content-right">
          <button type="button" className="btn " id="zoomInButton">
            <i className="fas fa-search-plus icon"></i>
          </button>

          <button type="button" className="btn " id="zoomOutButton">
            <i className="fas fa-search-minus icon"></i>
          </button>
          <button type="button" className="btn ">
            <i className="fas fa-sync-alt"></i>
          </button>
          <Link to={"/ci"}>
            <button type="button" className="btn ">
              CI
            </button>
          </Link>
          {/* <Link to={"/cn"}>
            <button
              type="button"
              className="btn "
              style={{ paddingRight: "5px" }}
            >
              CN
            </button>
          </Link> */}
          {/* <Link to={"/groups"}>
            <button type="button" className="btn ">
              Group
            </button>
          </Link> */}
          <Link to={"/scan"}>
            <button type="button" className="btn ">
              Scan
            </button>
          </Link>
          <button type="button" className="btn" onClick={logout}>
            Logout
          </button>
          <button type="button" className="btn ">
            <i className="fas fa-cogs icon"></i>
          </button>

          <div className="header-divider"></div>

          <div className="search-input">
            <Form.Control
              type="text"
              id=""
              aria-describedby="passwordHelpBlock"
              placeholder="Search..."
            />
          </div>
        </div>
      </div>
      <IndicatorModal
        show={indicatorsModalState.open}
        onHide={closeIndicatorsUpdateModal}
        indicatorType={indicatorsModalState.selectedIndicator}
      />
      <LRCModal
        show={LRCModalState.open}
        onHide={closeLRCUpdateModal}
        indicatorType={LRCModalState.selectedIndicator}
      />

      <FastStochModal
        show={StochModalState.open}
        onHide={closeFastStochModal}
        indicatorType={StochModalState.selectedIndicator}
      />
    </>
  );
};

export default WebHeader;
