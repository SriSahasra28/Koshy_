import React, { useState, useEffect } from "react";
import "./CustomIndicator.scss";
import { ChartApis } from "../api/charts.apis";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const CustomIndicator = () => {
  const [dataCI, setDataCI] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [id, setId] = useState(1);
  const [value, setValue] = useState("");
  const [valueError, setValueError] = useState("");
  const [name, setName] = useState("");
  const [currentIndicator, setCurrentIndicator] = useState(null);
  const [addIndicator, setAddIndicator] = useState(true);
  const [editIndicator, setEditIndicator] = useState(false);
  const [indicatorName, setIndicatorName] = useState("Linear Regression");

  const fetchIndicators = async () => {
    try {
      const res = await ChartApis.getIndicators();
      if (res.success) {
        setDataCI(res.data);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchIndicators();
  }, []);
  const fetchCustomIndicators = async () => {
    try {
      const res = await ChartApis.getCustomIndicators();
      if (res.success) {
        setIndicators(res.data);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Error getting Custom Indicators", err);
    }
  };
  useEffect(() => {
    fetchCustomIndicators();
  }, []);

  const insertCustomIndicators = async (e) => {
    e.preventDefault();
    if (!validateLRCValue(value, id)) return;
    try {
      const res = await ChartApis.insertCustomIndicator({
        name,
        indicator_id: id,
        value,
      });
      if (res.success) {
        refreshCustomIndicators();
      } else {
        console.error(res.error);
      }
      fetchCustomIndicators();
    } catch (err) {
      console.error("Error inserting Custom Indicator", err);
    }
  };

  const deleteCustomIndicator = async (id) => {
    try {
      const res = await ChartApis.deleteCustomIndicator({ id });
      if (res.success) {
        refreshCustomIndicators();
        if (!res?.success) {
          toast.error(
            res?.message ?? "Something went wrong delete-custom-indicators"
          );
          return;
        }
        toast.success("Custom indicator delete successfully");
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Error deleting Custom Indicator", err);
    }
  };

  const getCustomIndicatorByID = async (id) => {
    try {
      const res = await ChartApis.fetchConditionById(id);
      if (res.success) {
        setName(res.data.name);
        setValue(res.data.value);
      }
    } catch (err) {
      console.error(
        "Something went wrong fetching custom indicator by ID",
        err
      );
    }
  };

  const updateCustomIndicator = async (e) => {
    e.preventDefault();
    if (!validateLRCValue(value, id)) return;
    getCustomIndicatorByID(currentIndicator.id);
    try {
      const res = await ChartApis.updateCustomIndicator({
        id: currentIndicator.id,
        name,
        value,
      });
      if (res.success) {
        setAddIndicator(true);
        setEditIndicator(false);
        refreshCustomIndicators();
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Error updating Custom Indicator", err);
    }
    fetchCustomIndicators();
  };

  const refreshCustomIndicators = async () => {
    try {
      const res = await ChartApis.getCustomIndicators();
      if (res.success) {
        setIndicators(res.data);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const validateLRCValue = (val, indicatorId) => {
    // Only validate for Linear Regression (id === 1)
    if (indicatorId !== 1) {
      setValueError("");
      return true;
    }
    const parts = val.split(",").map((p) => p.trim());
    if (parts.length !== 2 || parts.some((p) => p === "" || isNaN(Number(p)))) {
      setValueError('Linear Regression requires exactly 2 numbers. Example: 20,2 or 15,3');
      return false;
    }
    setValueError("");
    return true;
  };

  const handleValueChange = (e) => {
    const newVal = e.target.value;
    setValue(newVal);
    validateLRCValue(newVal, id);
  };

  const handleIdChange = (e) => {
    setId(parseInt(e.target.value));
  };

  const changeIndicatorName = (indicator) => {
    let indicatorName;

    switch (indicator) {
      case 1:
        indicatorName = "Linear Regression";
        break;
      case 2:
        indicatorName = "PSAR";
        break;
      case 3:
        indicatorName = "Fast Stochastics";
        break;
      default:
        indicatorName = "";
    }
    return indicatorName;
  };

  const handleEditClick = (indicator) => {
    console.log("Indicator", indicator);
    setCurrentIndicator(indicator);
    setName(indicator.name);
    setValue(indicator.value);
    setId(indicator.indicator_id);
    setAddIndicator(false);
    setEditIndicator(true);
    setIndicatorName(changeIndicatorName(indicator.indicatorId));
  };

  const switchToAddIndicator = () => {
    setAddIndicator(true);
    setEditIndicator(false);
  };
  return (
    <div className="container mt-5">
      <div className="row justify-content-lg-center groups-page-content">
        <div className="container mt-5">
          <div className="accordion-like">
            <br />
            <div className="title-cn d-flex flex-wrap align-items-center justify-content-between">
              <div className="m-2">Custom Indicator</div>
              <div className="home_back_btn text-end">
                <Link to="/" className="btn btn-link">
                  <i class="fa-solid fa-house"></i> Home
                </Link>
              </div>
            </div>
            <div className="responsive-row d-flex flex-row-reverse flex-wrap justify-content-around">
              {editIndicator && (
                <div className="col-lg-5 col-md-4 col-sm-10">
                  <div className="form-group form-inline">
                    <div className="d-flex justify-content-between mt-3">
                      <h3>Edit Indicator</h3>
                      <button
                        className="btn btn-primary pl-3 pr-3 "
                        onClick={switchToAddIndicator}
                      >
                        +
                      </button>
                    </div>
                    <br />
                    <label>
                      Indicator: <u> {indicatorName} </u>
                    </label>
                    <br />
                  </div>
                  <form onSubmit={updateCustomIndicator}>
                    <div className="form-group form-inline text-start">
                      <label htmlFor="name">Name</label>
                      <input
                        type="text"
                        id="name"
                        required
                        className="form-control"
                        onChange={handleNameChange}
                        value={name}
                      />
                    </div>
                    <div className="form-group form-inline text-start">
                      <label htmlFor="value">Value</label>
                      <input
                        type="text"
                        id="value"
                        required
                        className={`form-control ${valueError ? 'is-invalid' : ''}`}
                        onChange={handleValueChange}
                        value={value}
                        placeholder={id === 1 ? "e.g. 20,2" : ""}
                      />
                      {valueError && (
                        <div className="invalid-feedback d-block" style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '4px' }}>
                          ⚠️ {valueError}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <button className="btn btn-primary" type="submit">
                        Update Indicator
                      </button>
                    </div>
                  </form>
                </div>
              )}
              {addIndicator && (
                <div className="col-lg-5 col-md-4 col-sm-10">
                  <div className="form-group form-inline text-start">
                    <h3>Add Indicator</h3>
                    <br />
                    <form onSubmit={insertCustomIndicators}>
                      <label htmlFor="groupSelect">Indicator</label>
                      <select
                        id="groupSelect"
                        className="form-control"
                        required
                        onChange={handleIdChange}
                      >
                        {dataCI &&
                          dataCI.map((ind) => (
                            <option key={ind.id} value={ind.id}>
                              {ind.name}
                            </option>
                          ))}
                      </select>

                      <div className="form-group form-inline text-start">
                        <label htmlFor="name">Name</label>
                        <input
                          type="text"
                          id="name"
                          required
                          className="form-control"
                          onChange={handleNameChange}
                        />
                      </div>
                      <div className="form-group form-inline text-start">
                        <label htmlFor="value">Value</label>
                        <input
                          type="text"
                          id="value"
                          required
                          className={`form-control ${valueError ? 'is-invalid' : ''}`}
                          onChange={handleValueChange}
                          placeholder={id === 1 ? "e.g. 20,2" : ""}
                        />
                        {valueError && (
                          <div className="invalid-feedback d-block" style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '4px' }}>
                            ⚠️ {valueError}
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <button className="btn btn-primary" type="submit">
                          Add Indicator
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="col-lg-3 col-md-4 col-sm-10">
                <table className="table mt-3">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Name</th>
                      <th style={{ textAlign: "left" }}>Value</th>
                      <th style={{ textAlign: "left" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicators &&
                      indicators.map((indicator) => (
                        <tr key={indicator.id}>
                          <td>{indicator.name}</td>
                          <td>{indicator.value}</td>
                          <td>
                            <i
                              className="fas fa-edit m-1"
                              onClick={() => handleEditClick(indicator)}
                            />

                            <i
                              className="fas fa-trash-alt m-1"
                              onClick={() =>
                                deleteCustomIndicator(indicator.id)
                              }
                            />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomIndicator;
