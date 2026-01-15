import React from "react";
import { Form } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { headerActions } from "../../redux/features/header.slice";
import GroupModal from "./headerModal/groupModal/GroupModal";
import MenuModal from "./headerModal/menuModal/MenuModal";
import MobileMenu from "./headerModal/mobileMenu/MobileMenu";

const MobileHeader = () => {
  const dispatch = useDispatch();

  const onClickModalHandler = (type) => {
    dispatch(headerActions.setMenuModal());
  };
  const menuModal = useSelector((state) => state?.header?.menuModal);

  return (
    <>
      <div className="mobile_header_container">
        <div className="left_container">
          <button
            type="button"
            className={`button menu_bar_icon ${menuModal ? "icon_color" : ""}`}
            onClick={() => onClickModalHandler()}
          >
            <i className="fa-solid fa-bars"></i>
          </button>

        </div>
        <div className="search_input">
          <Form.Control
            type="text"
            id=""
            aria-describedby="passwordHelpBlock"
            placeholder="Search..."
          />
        </div>

        <div className="right_container">
          <button type="button" className="button "    id="zoomInButton_mobile">
            <i className="fas fa-search-plus icon"></i>
          </button>

          <button type="button" className="button " id="zoomOutButton_mobile">
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
      <MobileMenu />
    </>
  );
};

export default MobileHeader;
