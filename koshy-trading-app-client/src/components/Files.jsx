import React from "react";
import { Link } from "react-router-dom";
import Header from "./header";

const Files = () => {
  return (
    <div className="container mt-5">
      <Header />
      <div className="row justify-content-lg-center">
        <div className="container mt-5">
          <div className="accordion-like">
            <div className="title-cn d-flex flex-wrap align-items-center justify-content-between">
              <div className="m-2">Files</div>
              <div className="home_back_btn text-end">
                <Link to="/" className="btn btn-link">
                  <i className="fa-solid fa-house"></i> Home
                </Link>
              </div>
            </div>
            <div className="body-cn">
              <p>Files page - Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Files;
