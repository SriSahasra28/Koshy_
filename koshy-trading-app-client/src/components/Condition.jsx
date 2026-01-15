import React, { useState, useEffect } from "react";
import "./Condition.scss";
import { ChartApis } from "../api/charts.apis";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Condition = () => {
  const [activeTab, setActiveTab] = useState("tab4");
  const [conditions, setConditions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [addCondition, setAddCondition] = useState(true);
  const [editCondition, setEditCondition] = useState(false);
  const [editData, setEditData] = useState({});
  const [lrc, setLrc] = useState([]);
  const [psar, setPsar] = useState([]);
  const [fastStoch, setFastStoch] = useState([]);
  const [hlfp, setHlfp] = useState([]);

  const [form, setForm] = useState({
    name: "test-name",
    lrcid: "1",
    psarid: "2",
    stochid: "3",
    lrcangletype: "custom",
    lrcanglestart: 40,
    lrcangleend: 80,
    signaldirection: "1",
    signalColor: "#000000",
    hlfpid: "1",
  });

  const fetchConditions = async () => {
    try {
      const res = await ChartApis.getConditions();
      if (res.success) {
        setConditions(res.data);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Error fetching conditions", err);
    }
  };

  const fetchHlfp = async () => {
    try {
      const res = await ChartApis.getHlfp();
      if (res.success) {
        setHlfp(res.data);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Something went wrong fetching HLFP", err);
    }
  };

  const updateHlfp = async (e) => {
    e.preventDefault();
    try {
      const res = await ChartApis.updateHLFP({
        ...hlfp[0],
      });
      if (res.success) {
        toast.success("HLFP updated successfully");
        fetchHlfp();
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Something went wrong updating HLFP", err);
    }
  };

  const fetchLrc = async () => {
    try {
      const res = await ChartApis.fetchCustomIndicatorByType(1);
      if (res.success) {
        setLrc(res.data);
        setForm((prevForm) => ({ ...prevForm, lrcid: res.data[0]?.id }));
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Something went wrong! fetchCustomIndicatorByType", err);
    }
  };

  const fetchPsar = async () => {
    try {
      const res = await ChartApis.fetchCustomIndicatorByType(2);
      if (res.success) {
        setPsar(res.data);
        setForm((prevForm) => ({ ...prevForm, psarid: res.data[0]?.id }));
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Something went wrong! fetchCustomIndicatorByType", err);
    }
  };

  const fetchFastStoch = async () => {
    try {
      const res = await ChartApis.fetchCustomIndicatorByType(3);
      if (res.success) {
        setFastStoch(res.data);
        setForm((prevForm) => ({ ...prevForm, stochid: res.data[0]?.id }));
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Something went wrong! fetchCustomIndicatorByType", err);
    }
  };

  useEffect(() => {
    fetchConditions();
    fetchLrc();
    fetchFastStoch();
    fetchPsar();
    fetchHlfp();
  }, []);

  const handleHlfpInputChange = (index, field, value) => {
    setHlfp((prevHlfp) => {
      const updatedHlfp = [...prevHlfp];
      updatedHlfp[index] = { ...updatedHlfp[index], [field]: parseInt(value) };
      return updatedHlfp;
    });
  };

  const handleDelete = async (id) => {
    try {
      const res = await ChartApis.deleteCondition({ id });
      if (res.success) {
        setConditions(conditions.filter((condition) => condition.id !== id));
        if (!res?.success) {
          toast.error(res?.message ?? "Something went wrong delete-condition");
          return;
        }

        toast.success("Condition delete successfully");
        setEditCondition(false);
        setAddCondition(true);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Error deleting condition", err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const changeEditData = async (id) => {
    const res = await ChartApis.fetchConditionById(id);
    console.log(res.data);
    setForm(res.data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedCondition) {
        // Update existing condition
        const res = await ChartApis.updateCondition({
          id: selectedCondition.id,
          ...form,
        });
        if (res?.success) {
          setConditions(
            conditions.map((cond) =>
              cond.id === selectedCondition.id ? res.data : cond
            )
          );
          if (!res?.success) {
            toast.error(
              res?.message ?? "Something went wrong delete-condition"
            );
            return;
          }
          toast.success("Condition Saved successfully");
          setEditCondition(false);
          setAddCondition(true);
        } else {
          console.error(res.error);
        }
      } else {
        // Insert new condition
        const res = await ChartApis.insertCondition(form);
        if (res.success) {
          setConditions([...conditions, res.data]);
        } else {
          console.error(res.error);
        }
      }
      // setSelectedCondition(null);
      setForm({
        name: "test-name",
        lrcid: "1",
        psarid: "2",
        stochid: "3",
        lrcangletype: "custom",
        lrcanglestart: 40,
        lrcangleend: 80,
        signaldirection: "1",
        signalColor: "#000000",
        hlfpid: "1",
      });
      fetchConditions();
    } catch (err) {
      console.error("Error saving condition", err);
    }
  };
  return (
    <div className="container mt-5">
      <div className="row justify-content-lg-center groups-page-content">
        <div className="container mt-5">
          <div className="accordion-like">
            <div className="title-cn d-flex flex-wrap align-items-center justify-content-between">
              <div className="m-2">Condition</div>
              <div className="home_back_btn text-end">
                <Link to="/" className="btn btn-link">
                  <i className="fa-solid fa-house"></i> Home
                </Link>
              </div>
            </div>
            <div className="body-cn">
              <div className="left-panel">
                {conditions.map((condition, index) => (
                  <div key={condition.id} className="scan-item">
                    <span>{condition?.name}</span>
                    <span>
                      <i
                        className="fas fa-edit m-1"
                        onClick={() => {
                          setSelectedCondition(condition);
                          setAddCondition(false);
                          setEditCondition(true);
                          changeEditData(condition.id);
                          setActiveTab("tab4");
                        }}
                      />
                      <i
                        className="fas fa-trash-alt m-1"
                        onClick={() => handleDelete(condition.id)}
                      />
                    </span>
                  </div>
                ))}
              </div>
              <div className="right-panel">
                {/* here */}
                <div className="tab-control-container ">
                  <h4 className="tab-heading text-start">Add H LFP 1</h4>
                  <br />
                  <div className="tab-content" id="myTabContent">
                    <div>
                      {hlfp && hlfp.length > 0 && (
                        <>
                          <p className="text-left">
                            1. K line crosses below
                            <input
                              type="text"
                              className="form-control"
                              id="kLineThresholdOne"
                              name="kLineThresholdOne"
                              value={hlfp[0].kLineThresholdOne || ""}
                              onChange={(e) =>
                                handleHlfpInputChange(
                                  0,
                                  "kLineThresholdOne",
                                  e.target.value
                                )
                              }
                              style={{
                                maxWidth: 50,
                                marginLeft: 10,
                                display: "inline-block",
                              }}
                            />
                            level and within
                            <input
                              type="text"
                              className="form-control"
                              id="psarCandlesOne"
                              name="psarCandlesOne"
                              value={hlfp[0].psarCandlesOne || ""}
                              onChange={(e) =>
                                handleHlfpInputChange(
                                  0,
                                  "psarCandlesOne",
                                  e.target.value
                                )
                              }
                              style={{
                                maxWidth: 50,
                                marginLeft: 10,
                                display: "inline-block",
                              }}
                            />
                            candles PSAR is positive on a green HA candle not
                            crossing or touching middle LRC.
                          </p>
                          <p className="text-left">
                            2. K line crosses below
                            <input
                              type="text"
                              className="form-control"
                              id="kLineThresholdTwo"
                              name="kLineThresholdTwo"
                              value={hlfp[0].kLineThresholdTwo || ""}
                              onChange={(e) =>
                                handleHlfpInputChange(
                                  0,
                                  "kLineThresholdTwo",
                                  e.target.value
                                )
                              }
                              style={{
                                maxWidth: 50,
                                marginLeft: 10,
                                display: "inline-block",
                              }}
                            />
                            level and within
                            <input
                              type="text"
                              className="form-control"
                              id="psarCandlesTwo"
                              name="psarCandlesTwo"
                              value={hlfp[0].psarCandlesTwo || ""}
                              onChange={(e) =>
                                handleHlfpInputChange(
                                  0,
                                  "psarCandlesTwo",
                                  e.target.value
                                )
                              }
                              style={{
                                maxWidth: 50,
                                marginLeft: 10,
                                display: "inline-block",
                              }}
                            />
                            candles PSAR is positive on a green pin bar candle not crossing or touching middle LRC.
                          </p>
                          <p className="text-left">
                            3. K line crosses below
                            <input
                              type="text"
                              className="form-control"
                              id="kLineThresholdThree"
                              name="kLineThresholdThree"
                              value={hlfp[0].kLineThresholdThree || ""}
                              onChange={(e) =>
                                handleHlfpInputChange(
                                  0,
                                  "kLineThresholdThree",
                                  e.target.value
                                )
                              }
                              style={{
                                maxWidth: 50,
                                marginLeft: 10,
                                display: "inline-block",
                              }}
                            />
                            level and within
                            <input
                              type="text"
                              className="form-control"
                              id="psarCandlesThree"
                              name="psarCandlesThree"
                              value={hlfp[0].psarCandlesThree || ""}
                              onChange={(e) =>
                                handleHlfpInputChange(
                                  0,
                                  "psarCandlesThree",
                                  e.target.value
                                )
                              }
                              style={{
                                maxWidth: 50,
                                marginLeft: 10,
                                display: "inline-block",
                              }}
                            />
                            candles PSAR is positive on a wickless green HA
                            candle not crossing or touching middle LRC.
                          </p>
                        </>
                      )}
                    </div>
                    <div className="d-flex">
                      <button
                        className="btn btn-success ms-auto"
                        onClick={updateHlfp}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  {/* till here */}

                  {addCondition && (
                    <div>
                      <div className="form-inline mt-3">
                        <table>
                          <tbody>
                            <tr>
                              <td
                                colSpan={2}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                H LFP
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <select
                                  className="form-control"
                                  id="hlfpidSelect"
                                  name="hlfpid"
                                  value={form.hlfpid}
                                  onChange={handleFormChange}
                                >
                                  <option value="1">Green HA Candle</option>
                                  <option value="2">Green Pin Bar</option>
                                  <option value="3">
                                    Wickless Green Candle
                                  </option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={1}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                LRC
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <select
                                  className="form-control"
                                  id="lrcSelect"
                                  name="lrcid"
                                  value={form.lrcid}
                                  onChange={handleFormChange}
                                >
                                  {Array.isArray(lrc) &&
                                    lrc.map((item, index) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={1}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                PSAR
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <select
                                  className="form-control"
                                  id="psarSelect"
                                  name="psarid"
                                  value={form.psarid}
                                  onChange={handleFormChange}
                                >
                                  {Array.isArray(psar) &&
                                    psar.map((item, index) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="text-start"
                                colSpan={1}
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                Fast Stoch
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <select
                                  className="form-control"
                                  id="macdSelect"
                                  name="stochid"
                                  value={form.stochid}
                                  onChange={handleFormChange}
                                >
                                  {Array.isArray(fastStoch) &&
                                    fastStoch.map((item, index) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <table>
                          <tbody>
                            <tr>
                              <td
                                colSpan={1}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                LRC Angle
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="lrcangletype"
                                    value="normal"
                                    checked={form.lrcangletype === "normal"}
                                    onChange={handleFormChange}
                                  />{" "}
                                  Normal
                                </label>
                              </td>
                              <td>
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="lrcangletype"
                                    value="custom"
                                    checked={form.lrcangletype === "custom"}
                                    onChange={handleFormChange}
                                  />{" "}
                                  Custom
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="lrcanglestart"
                                  value={form.lrcanglestart}
                                  onChange={handleFormChange}
                                  placeholder="From"
                                />
                                <span> to </span>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="lrcangleend"
                                  value={form.lrcangleend}
                                  onChange={handleFormChange}
                                  placeholder="To"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={2}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                Signal Arrow
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span> Direction </span>
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="signaldirection"
                                    value="1"
                                    checked={form.signaldirection === "1"}
                                    onChange={handleFormChange}
                                  />{" "}
                                  UP
                                </label>
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="signaldirection"
                                    value="-1"
                                    checked={form.signaldirection === "-1"}
                                    onChange={handleFormChange}
                                  />{" "}
                                  Down
                                </label>
                              </td>
                              <td>
                                <span> Colour </span>
                                <input
                                  type="color"
                                  className="form-control"
                                  name="signalColor"
                                  value={form.signalColor}
                                  onChange={handleFormChange}
                                  style={{ width: 25, height: 25, padding: 0 }}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="d-flex  justify-content-between  form-inline mt-3">
                        <label
                          htmlFor="nameInput"
                          className="mt-1"
                          style={{ marginLeft: 10 }}
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="nameInput"
                          name="name"
                          placeholder="Name"
                          // value={form.name}
                          onChange={handleFormChange}
                          style={{ maxWidth: 200, marginLeft: 30 }}
                        />
                        <button
                          className="btn btn-success"
                          onClick={handleSave}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                  {editCondition && (
                    <div>
                      <div className="form-inline mt-3">
                        <table>
                          <tbody>
                            <tr>
                              <td
                                colSpan={2}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                H LFP
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <select
                                  className="form-control"
                                  id="hlfpSelect"
                                  name="hlfpid"
                                  value={form.hlfpid}
                                  onChange={handleFormChange}
                                >
                                  <option value="1">Green HA Candle</option>
                                  <option value="2">Green Pin Bar</option>
                                  <option value="3">
                                    Wickless Green Candle
                                  </option>
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={2}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                LRC
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <select
                                  className="form-control"
                                  id="lrcSelect"
                                  name="lrcid"
                                  value={form.lrcid}
                                  onChange={handleFormChange}
                                >
                                  {Array.isArray(lrc) &&
                                    lrc.map((item, index) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={2}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                PSAR
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <select
                                  className="form-control"
                                  id="psarSelect"
                                  name="psarid"
                                  value={form.psarid}
                                  onChange={handleFormChange}
                                >
                                  {Array.isArray(psar) &&
                                    psar.map((item, index) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                            </tr>
                            <tr>
                              <td
                                className="text-start"
                                colSpan={2}
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                Fast Stoch
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <select
                                  className="form-control"
                                  id="macdSelect"
                                  name="stochid"
                                  value={form.stochid}
                                  onChange={handleFormChange}
                                >
                                  {Array.isArray(fastStoch) &&
                                    fastStoch.map((item, index) => (
                                      <option key={item.id} value={item.id}>
                                        {item.name}
                                      </option>
                                    ))}
                                </select>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <table>
                          <tbody>
                            <tr>
                              <td
                                colSpan={2}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                LRC Angle
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="lrcangletype"
                                    value="normal"
                                    checked={form.lrcangletype === "normal"}
                                    onChange={handleFormChange}
                                  />{" "}
                                  Normal
                                </label>
                              </td>
                              <td>
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="lrcangletype"
                                    value="custom"
                                    checked={form.lrcangletype === "custom"}
                                    onChange={handleFormChange}
                                  />{" "}
                                  Custom
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="lrcanglestart"
                                  value={form.lrcanglestart}
                                  onChange={handleFormChange}
                                  placeholder="From"
                                />
                                <span> to </span>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="lrcangleend"
                                  value={form.lrcangleend}
                                  onChange={handleFormChange}
                                  placeholder="To"
                                />
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={2}
                                className="text-start"
                                style={{ backgroundColor: "#f8f9fa" }}
                              >
                                Signal Arrow
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span> Direction </span>
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="signaldirection"
                                    value="1"
                                    checked={form.signaldirection == "1"}
                                    onChange={handleFormChange}
                                  />{" "}
                                  UP
                                </label>
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="signaldirection"
                                    value="-1"
                                    checked={form.signaldirection == "-1"}
                                    onChange={handleFormChange}
                                  />{" "}
                                  Down
                                </label>
                              </td>
                              <td>
                                <span> Colour </span>
                                <input
                                  type="color"
                                  className="form-control"
                                  name="signalColor"
                                  value={form.signalColor}
                                  onChange={handleFormChange}
                                  style={{ width: 25, height: 25, padding: 0 }}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="d-flex  justify-content-between  form-inline mt-3">
                        <label
                          htmlFor="nameInput"
                          className="mt-1"
                          style={{ marginLeft: 10 }}
                        >
                          Name
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="nameInput"
                          name="name"
                          value={form.name}
                          onChange={handleFormChange}
                          style={{ maxWidth: 200, width: "100%" }}
                        />
                        <button
                          className="btn btn-success"
                          onClick={handleSave}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Condition;
