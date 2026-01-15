import React from "react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { headerActions } from "../../../../redux/features/header.slice";
import "./MobileMenu.scss";
import IndicatorModal from "../../IndicatorModal";
import { CommonEnums } from "../../../../enums/common.enums";
import LRCModal from "../../LRCModal";
import FastStochModal from "../../FastStoch";

const MobileMenu = () => {
  const [menuData, setMenuData] = useState(sideBarData);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const menuModal = useSelector((state) => state?.header?.menuModal);
  let minOptionValue = useSelector((state) => state?.header?.minOptionValue);

  const [StochModalState, setStochModalState] = React.useState({
    open: false,
    selectedIndicator: CommonEnums.indicators.FastStochastics,
  });
  const onClose = () => {
    dispatch(headerActions.setMenuModal());
  };

  const onClickText = (item) => {
    if (item?.options?.length === 0) {
      onClose();
    }
    if (item?.text === "Group") {
      navigate("/groups");
    } else if (item?.text === "CI") {
      navigate("/ci");
    } else if (item?.text === "CN") {
      navigate("/cn");
    } else if (item?.text === "Scan") {
      navigate("/scan");
    }
  };

  const onClickTextOption = (data) => {
    dispatch(headerActions.setMinOptionValue({ value: data?.value }));
    onClose();
    const optionValue = data?.option;
    console.log("Option Value:", optionValue);
    // console.log("tesdatat>>>", data);
    if (optionValue === "PSAR") {
      openIndicatorsUpdateModal(CommonEnums.indicators.PSAR);
    } else if (optionValue === "Linear Regression Channel") {
      openLRCUpdateModal(CommonEnums.indicators.linear_regression);
    } else if (optionValue === CommonEnums.indicators.FastStochastics) {
      setStochModalState({
        ...StochModalState,
        open: true,
        selectedIndicator: optionValue,
      });
    }
  };

  const onChangeMinOption = (e) => {
    // console.log("e>>>", e.target.value);
    dispatch(headerActions.setMinOptionValue({ value: e.target.value }));
  };

  const openIndicatorsUpdateModal = (type) => {
    if (type === CommonEnums.indicators.PSAR) {
      setIndicatorsModalState({
        ...indicatorsModalState,
        open: true,
        selectedIndicator: type,
      });
    }
  };

  const openLRCUpdateModal = (type) => {
    if (type === CommonEnums.indicators.linear_regression) {
      setLRCModalState({
        ...lrcModalState,
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
      ...lrcModalState,
      open: false,
      selectedIndicator: "",
    });
  };
  const [indicatorsModalState, setIndicatorsModalState] = React.useState({
    open: false,
    selectedIndicator: CommonEnums.indicators.PSAR,
  });

  const [lrcModalState, setLRCModalState] = React.useState({
    open: false,
    selectedIndicator: CommonEnums.indicators.linear_regression,
  });

  const closeFastStochModal = () => {
    setStochModalState({
      ...setStochModalState,
      open: false,
      selectedIndicator: "",
    });
  };

  return (
    <>
      <div
        className={`bg_container ${menuModal ? "" : "display_none"}`}
        onClick={onClose}
      ></div>
      <div
        className={`mobile_menu_container ${menuModal ? "" : "display_none"}`}
      >
        <div className="mobile_menu_box">
          {menuData.map((item) => (
            <div
              className={`menu_item ${
                item?.options?.length > 0 ? "menu_item_hover" : ""
              }`}
              key={item?.id}
            >
              <p
                className={`menu_item_text ${
                  item?.id === "10" ? "menu_item_border" : ""
                }`}
                onClick={() => onClickText(item)}
              >
                {item.text}
              </p>
              <div
                className={`inner_option ${
                  item?.options?.length > 0 ? "" : "display_none"
                }`}
              >
                {item?.options.map((option) => (
                  <p
                    className={`menu_option_text ${
                      minOptionValue === option?.value ? "active_text" : ""
                    } `}
                    onClick={() => onClickTextOption(option)}
                    key={option?.id}
                  >
                    {option.option}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <IndicatorModal
        show={indicatorsModalState.open}
        onHide={closeIndicatorsUpdateModal}
        indicatorType={indicatorsModalState.selectedIndicator}
      />
      <LRCModal
        show={lrcModalState.open}
        onHide={closeLRCUpdateModal}
        indicatorType={lrcModalState.selectedIndicator}
      />
      <FastStochModal
        show={StochModalState.open}
        onHide={closeFastStochModal}
        indicatorType={StochModalState.selectedIndicator}
      />
    </>
  );
};

export default MobileMenu;

const sideBarData = [
  {
    id: "1",
    text: "Chart",
    options: [],
  },
  {
    id: "2",
    text: "Indicator",
    options: [
      {
        id: "2-1",
        option: "Linear Regression Channel",
        active: false,
      },
      {
        id: "2-2",
        option: "PSAR",
        active: false,
      },
      {
        id: "2-3",
        option: "FastStochastics",
        active: false,
      },
    ],
  },
  {
    id: "3",
    text: "Interval",
    options: [
      {
        id: "3-1",
        option: "1 min",
        active: false,
        value: 1,
      },
      {
        id: "3-2",
        option: "2 min",
        active: false,
        value: 2,
      },
      {
        id: "3-3",
        option: "3 min",
        active: false,
        value: 3,
      },
      {
        id: "3-4",
        option: "5 min",
        active: false,
        value: 5,
      },
      {
        id: "3-5",
        option: "10 min",
        active: false,
        value: 10,
      },
      {
        id: "3-6",
        option: "15 min",
        active: false,
        value: 15,
      },
      {
        id: "3-7",
        option: "30 min",
        active: false,
        value: 30,
      },
      {
        id: "3-8",
        option: "60 min",
        active: false,
        value: 60,
      },
    ],
  },

  {
    id: "7",
    text: "CI",
    options: [],
  },
  {
    id: "8",
    text: "CN",
    options: [],
  },
  {
    id: "9",
    text: "Scan",
    options: [],
  },
  {
    id: "10",
    text: "Group",
    options: [],
  },
];
