import React from "react";
import { Button, Form } from "react-bootstrap";
import { useSelector } from "react-redux";
import MobileHeader from "../../MobileHeader";
import ModalMobileHeader from "../../ModalMobileHeader";
import "./GroupModal.scss";

const GroupsModal = () => {
  const headerModal = useSelector((state) => state?.header?.headerModal);

  return (
    <div
      className={`top_slider_container ${
        headerModal === "group" ? "top_slider_active" : ""
      }`}
    >
      {/* <MobileHeader/> */}
      <ModalMobileHeader />
      <div className="menu_modal_body_container">
        <div className="groups_container">
          <div className="button_container">
            <Button variant="light">Group 1</Button>
          </div>

          <div className="button_container">
            <Button variant="light">Group 2</Button>
          </div>

          <div className="button_container">
            <Button variant="light">Group 3</Button>
          </div>

          {/* <div className="button-container">
                  <Button variant="light">+ Add</Button>
                </div> */}
        </div>
      </div>
    </div>
  );
};

export default GroupsModal;
