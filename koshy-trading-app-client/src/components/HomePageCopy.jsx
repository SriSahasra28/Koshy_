import React from "react";

function HomePageCopy() {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-7" style={{ backgroundColor: "#e0e0e0" }}>
          <div className="row">
            <div className="col-md-2">
              <select className="form-control">
                <option>Heikin Ashi</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-control">
                <option>1 day</option>
                <option>3 day</option>
                <option>5 day</option>
                <option>1 Month</option>
                <option>3 Month</option>
                <option>6 Month</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-control">
                <option>1 min</option>
                <option>5 min</option>
                <option>1 hour</option>
                <option>1 week</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-control">
                <option>Linear Regression</option>
                <option>PSAR</option>
                <option>MACD</option>
              </select>
            </div>
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
              />
            </div>
          </div>
        </div>
        <div className="col-md-5" style={{ backgroundColor: "#e0e0e0" }}>
          <div className="row">
            <div className="col-md-1">
              <button type="button" className="btn btn-light">
                <i className="fas fa-search-plus icon"></i>
              </button>
            </div>
            <div className="col-md-1">
              <button type="button" className="btn btn-light">
                <i className="fas fa-search-minus icon"></i>
              </button>
            </div>
            <div className="col-md-1">
              <button type="button" className="btn btn-light">
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            <div className="col-md-1">
              <button type="button" className="btn btn-light">
                CI
              </button>
            </div>
            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-light"
                style={{ paddingRight: "5px" }}
              >
                CN
              </button>
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-light">
                Group
              </button>
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-light">
                Scan
              </button>
            </div>
            <div className="col-md-1">
              <button type="button" className="btn btn-light">
                <i className="fas fa-cogs icon"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-2" style={{ backgroundColor: "#e0e0e0" }}>
          Group1
          <br />
          Group2
        </div>
        <div className="col-md-10" style={{ backgroundColor: "#ffffff" }}>
          <img src="NiftyPivot.jpeg" alt="Nifty Pivot" />
        </div>
      </div>
      <div className="row">
        <div className="col-md-2" style={{ backgroundColor: "#e0e0e0" }}></div>
        <div className="col-md-9" style={{ backgroundColor: "#ffffff" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Datetime</th>
                <th>Scan</th>
                <th>TimeFrame</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ABC</td>
                <td>2024-03-27 09:30:00</td>
                <td>XYZ</td>
                <td>1 day</td>
              </tr>
              <tr>
                <td>CDE</td>
                <td>2024-03-27 10:00:00</td>
                <td>ABC</td>
                <td>1 hour</td>
              </tr>
              <tr>
                <td>EFG</td>
                <td>2024-03-27 11:30:00</td>
                <td>PQR</td>
                <td>5 day</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="col-md-1" style={{ backgroundColor: "#ffffff" }}></div>
      </div>
    </div>
  );
}

export default HomePageCopy;
