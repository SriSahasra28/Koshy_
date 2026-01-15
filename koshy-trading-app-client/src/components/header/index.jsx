import React from "react";
import MobileHeader from "./MobileHeader";
import WebHeader from "./WebHeader";
import "./MobileHeader.scss";

const Header = () => {
  return (
    <div className="header_main_container">
      <WebHeader />
      <MobileHeader />
    </div>
  );
};

export default Header;
