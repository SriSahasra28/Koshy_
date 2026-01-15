import React from "react";
import { Button, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import MobileHeader from "../../MobileHeader";
import ModalMobileHeader from "../../ModalMobileHeader";
import "./MenuModal.scss";

const MenuModal = () => {
  const headerModal = useSelector((state) => state?.header?.headerModal);
  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };
  return (
    <div
      className={`top_slider_container ${
        headerModal === "menu" ? "top_slider_active" : ""
      }`}
    >
      {/* <MobileHeader/> */}
      <ModalMobileHeader />
      <div className="menu_modal_body_container">
        <div className="search_input">
          <Form.Control
            type="text"
            id=""
            aria-describedby="passwordHelpBlock"
            placeholder="Search..."
          />
        </div>
        <div className="name_select">
          <select class="form-select" aria-label="Default select example">
            <option selected>Heikin Aishi</option>
            <option value="1">Heikin Aishi</option>
            <option value="2">Heikin Aishi</option>
            <option value="3">Heikin Aishi</option>
          </select>
        </div>

        <div className="category_select">
          <select class="form-select" aria-label="Default select example">
            <option selected>Linear Regression</option>
            <option value="1">Linear Regression</option>
            <option value="2">Linear Regression</option>
            <option value="3">Linear Regression</option>
          </select>
        </div>
        <div className="time_select_container">
          <div className="day_select">
            <select class="form-select" aria-label="Default select example">
              <option selected>1 day</option>
              <option value="1">2 day</option>
              <option value="2">3 day</option>
              <option value="3">4 day</option>
            </select>
          </div>{" "}
          <div className="min_select">
            <select class="form-select" aria-label="Default select example">
              <option selected>1 min</option>
              <option value="1">2 min</option>
              <option value="2">3 min</option>
              <option value="3">4 min</option>
            </select>
          </div>
        </div>
      </div>

      <div className="login_button_container">
        <Button variant="light" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default MenuModal;
