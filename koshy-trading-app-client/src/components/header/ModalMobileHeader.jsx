import React from "react";
import { Form } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { headerActions } from "../../redux/features/header.slice";
import MenuModal from "./headerModal/menuModal/MenuModal";
import "./MobileHeader.scss";

const ModalMobileHeader = () => {
  const dispatch = useDispatch();
  const headerModal = useSelector((state) => state?.header?.headerModal);

  const onClickModalHandler = () => {
    dispatch(headerActions.setHeaderModal({ type: "" }));
  };
  return (
    <>
      <div className="mobile_header_container">
        <div className="left_container">
          <button
            type="button"
            className={`button menu_bar_icon ${
              headerModal === "menu" ? "icon_active" : ""
            }`}
            onClick={onClickModalHandler}
          >
            <i class="fa-solid fa-bars"></i>
          </button>

          {/* <button
            type="button"
            className={`text_button ${
              headerModal === "group" ? "active_link" : ""
            }`}
            onClick={onClickModalHandler}
          >
            Group
          </button> */}
          <button type="button" className="text_button ">
            CI
          </button>
          {/* <button type="button" className="text_button ">
            CN
          </button> */}

          <button type="button" className="text_button ">
            Scan
          </button>
        </div>

        <div className="right_container">
          <button type="button" className="button ">
            <i className="fas fa-search-plus icon"></i>
          </button>

          <button type="button" className="button ">
            <i className="fas fa-search-minus icon"></i>
          </button>
          <button type="button" className="button ">
            <i className="fas fa-sync-alt"></i>
          </button>
          <button type="button" className="button ">
            <i className="fas fa-cogs icon"></i>
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalMobileHeader;
