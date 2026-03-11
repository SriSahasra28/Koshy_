import React, { useState, useEffect, useRef } from "react";
import "./Condition.scss";
import { ChartApis } from "../api/charts.apis";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const Condition = () => {
  const [conditions, setConditions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [lrc, setLrc] = useState([]);
  const [psar, setPsar] = useState([]);
  const [fastStoch, setFastStoch] = useState([]);
  const [hlfp, setHlfp] = useState([]);

  const [form, setForm] = useState({
    // Core condition config
    name: "",
    lrcid: "1",
    psarid: "2",
    stochid: "3",
    lrcangletype: "custom",
    lrcanglestart: 40,
    lrcangleend: 80,
    signaldirection: "1",
    signalColor: "#000000",
    hlfpid: "1", // candle type mapping

    // Old \"3-block\" editor style flags
    condition1_enabled: true,
    condition2_enabled: false,
    condition3_enabled: false,

    // Old editor style fields (mapped to existing DB columns where possible)
    candle1: "1", // maps to hlfpid
    candle2: "1",
    kline_start: 10,
    kline_end: 100,

    // LRC / Time filter (new fields)
    lrc_filter_enabled: false,
    lrc_filter_type: null,
    time_filter_enabled: false,
    time_filter_start: null,
    time_filter_end: null,
  });

  // Use ref to track latest form state for async operations
  const formRef = useRef(form);

  // Update ref whenever form changes
  useEffect(() => {
    console.log("[useEffect] Updating formRef with latest form state:", {
      condition1_enabled: form.condition1_enabled,
      condition2_enabled: form.condition2_enabled,
      lrc_filter_enabled: form.lrc_filter_enabled,
    });
    formRef.current = form;
  }, [form]);

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
      if (res.success && res.data && res.data.length > 0) {
        setLrc(res.data);
        setForm((prevForm) => ({ ...prevForm, lrcid: res.data[0]?.id }));
      } else {
        setLrc([]);
        console.warn("No LRC indicators found. Please add indicators first.");
      }
    } catch (err) {
      console.error("Something went wrong! fetchCustomIndicatorByType", err);
      setLrc([]);
    }
  };

  const fetchPsar = async () => {
    try {
      const res = await ChartApis.fetchCustomIndicatorByType(2);
      if (res.success && res.data && res.data.length > 0) {
        setPsar(res.data);
        setForm((prevForm) => ({ ...prevForm, psarid: res.data[0]?.id }));
      } else {
        setPsar([]);
        console.warn("No PSAR indicators found. Please add indicators first.");
      }
    } catch (err) {
      console.error("Something went wrong! fetchCustomIndicatorByType", err);
      setPsar([]);
    }
  };

  const fetchFastStoch = async () => {
    try {
      const res = await ChartApis.fetchCustomIndicatorByType(3);
      if (res.success && res.data && res.data.length > 0) {
        setFastStoch(res.data);
        setForm((prevForm) => ({ ...prevForm, stochid: res.data[0]?.id }));
      } else {
        setFastStoch([]);
        console.warn("No Stochastic indicators found. Please add indicators first.");
      }
    } catch (err) {
      console.error("Something went wrong! fetchCustomIndicatorByType", err);
      setFastStoch([]);
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

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    console.log(`[Checkbox] ${name} changed to:`, checked);
    console.log(`[Checkbox] Current form state before update:`, form[name]);
    // Use functional update to ensure we get the latest state
    setForm((prevForm) => {
      const updated = {
        ...prevForm,
        [name]: checked,
      };
      console.log(`[Checkbox] Updated form state for ${name}:`, updated[name]);
      console.log(`[Checkbox] Full updated form:`, updated);
      // Force a re-render by returning the updated object
      return { ...updated };
    });
  };

  const changeEditData = async (id) => {
    const res = await ChartApis.fetchConditionById(id);
    console.log("Fetched condition data:", res.data);
    if (res?.success && res?.data) {
      // Merge with existing form to preserve any fields not in response
      console.log("[changeEditData] Setting form with data:", res.data);
      setForm((prevForm) => {
        const merged = {
          ...prevForm,
          ...res.data,
          // Ensure boolean fields are properly set
          lrc_filter_enabled: res.data.lrc_filter_enabled === true || res.data.lrc_filter_enabled === 1 || res.data.lrc_filter_enabled === '1',
          time_filter_enabled: res.data.time_filter_enabled === true || res.data.time_filter_enabled === 1 || res.data.time_filter_enabled === '1',
          condition1_enabled: res.data.condition1_enabled === true || res.data.condition1_enabled === 1 || res.data.condition1_enabled === '1',
          condition2_enabled: res.data.condition2_enabled === true || res.data.condition2_enabled === 1 || res.data.condition2_enabled === '1',
          condition3_enabled: res.data.condition3_enabled === true || res.data.condition3_enabled === 1 || res.data.condition3_enabled === '1',
        };
        console.log("[changeEditData] Merged form state:", merged);
        return merged;
      });
    } else {
      console.error("Failed to fetch condition data:", res);
      toast.error("Failed to load condition data");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedCondition) {
        // Read from ref to get the latest form state (avoids stale closure)
        // The ref is updated in useEffect whenever form changes
        const currentForm = formRef.current;

        console.log("[handleSave] Reading from formRef.current:", {
          condition1_enabled: currentForm.condition1_enabled,
          condition2_enabled: currentForm.condition2_enabled,
          lrc_filter_enabled: currentForm.lrc_filter_enabled,
          time_filter_enabled: currentForm.time_filter_enabled,
        });
        console.log("[handleSave] Also checking form state directly:", {
          condition1_enabled: form.condition1_enabled,
          condition2_enabled: form.condition2_enabled,
        });

        // ⚠️ CRITICAL: Use form state directly if ref is stale
        // Sometimes formRef.current might not be updated yet, so use form directly
        // Check multiple fields to ensure we have the latest state
        const formToUse = (form.condition1_enabled !== undefined || form.lrc_filter_enabled !== undefined) ? form : currentForm;
        console.log("[handleSave] Using form state from:", formToUse === form ? "form (direct)" : "formRef.current");
        console.log("[handleSave] formToUse state check:", {
          condition1_enabled: formToUse.condition1_enabled,
          lrc_filter_enabled: formToUse.lrc_filter_enabled,
          time_filter_enabled: formToUse.time_filter_enabled,
        });

        // Update existing condition - ensure all required fields are present
        // Use formToUse which prioritizes direct form state if available
        const updateData = {
          id: selectedCondition.id,
          name: formToUse.name || "",
          lrcid: formToUse.lrcid || "1",
          psarid: formToUse.psarid || "2",
          stochid: formToUse.stochid || "3",
          lrcangletype: formToUse.lrcangletype || "custom",
          lrcanglestart: formToUse.lrcanglestart !== undefined && formToUse.lrcanglestart !== null ? formToUse.lrcanglestart : 40,
          lrcangleend: formToUse.lrcangleend !== undefined && formToUse.lrcangleend !== null ? formToUse.lrcangleend : 80,
          signaldirection: formToUse.signaldirection || "1",
          signalColor: formToUse.signalColor || "#000000",
          hlfpid: formToUse.hlfpid || "1",
          // Map editor-style fields into payload so backend can use them if available
          candle1: formToUse.candle1 || "1",
          candle2: formToUse.candle2 || "1",
          kline_start: formToUse.kline_start ?? 10,
          kline_end: formToUse.kline_end ?? 100,
          // ⚠️ CRITICAL: condition1 and condition2 must be explicitly included
          condition1: (() => {
            const val = formToUse.condition1_enabled;
            const result = val === true || val === 1 || val === '1' ? 1 : 0;
            console.log("[handleSave] condition1_enabled value:", val, "type:", typeof val, "converted to:", result);
            return result;
          })(),
          condition2: (() => {
            const val = formToUse.condition2_enabled;
            // Explicitly handle all cases: true/1/'1' -> '1', everything else -> '0'
            let result = '0';
            if (val === true || val === 1 || val === '1') {
              result = '1';
            } else if (val === false || val === 0 || val === '0' || val === null || val === undefined) {
              result = '0';
            }
            console.log("[handleSave] condition2_enabled value:", val, "type:", typeof val, "converted to:", result);
            return result;
          })(),
          lrc_filter_enabled: (() => {
            const val = formToUse.lrc_filter_enabled;
            const result = val === true || val === 1 || val === '1' ? 1 : 0;
            console.log("[handleSave] lrc_filter_enabled value:", val, "type:", typeof val, "converted to:", result);
            return result;
          })(),
          lrc_filter_type: formToUse.lrc_filter_type || null,
          time_filter_enabled: (() => {
            const val = formToUse.time_filter_enabled;
            const result = val === true || val === 1 || val === '1' ? 1 : 0;
            console.log("[handleSave] time_filter_enabled value:", val, "type:", typeof val, "converted to:", result);
            return result;
          })(),
          time_filter_start: formToUse.time_filter_start || null,
          time_filter_end: formToUse.time_filter_end || null,
        };

        // ⚠️ CRITICAL: Verify condition1 and condition2 are in the payload
        console.log("[handleSave] ⚠️ VERIFICATION - updateData contains:", {
          has_condition1: 'condition1' in updateData,
          condition1_value: updateData.condition1,
          condition1_type: typeof updateData.condition1,
          has_condition2: 'condition2' in updateData,
          condition2_value: updateData.condition2,
          condition2_type: typeof updateData.condition2,
          has_lrc_filter_enabled: 'lrc_filter_enabled' in updateData,
          lrc_filter_enabled_value: updateData.lrc_filter_enabled,
          lrc_filter_enabled_type: typeof updateData.lrc_filter_enabled,
          updateData_keys: Object.keys(updateData),
          full_updateData: JSON.stringify(updateData, null, 2),
        });

        console.log("Sending update data:", updateData);
        console.log("Form state before save (from ref):", {
          condition1_enabled: currentForm.condition1_enabled,
          condition2_enabled: currentForm.condition2_enabled,
          lrc_filter_enabled: currentForm.lrc_filter_enabled,
          time_filter_enabled: currentForm.time_filter_enabled,
          condition1_value_in_payload: updateData.condition1,
          condition2_value_in_payload: updateData.condition2,
          fullForm: currentForm,
        });

        const res = await ChartApis.updateCondition(updateData);
        if (res?.success) {
          setConditions(conditions.map((cond) => (cond.id === selectedCondition.id ? res.data : cond)));
          toast.success("Condition Saved successfully");
          setSelectedCondition(null);
          // Reset form
          setForm({
            name: "",
            lrcid: "1",
            psarid: "2",
            stochid: "3",
            lrcangletype: "custom",
            lrcanglestart: 40,
            lrcangleend: 80,
            signaldirection: "1",
            signalColor: "#000000",
            hlfpid: "1",
            condition1_enabled: true,
            condition2_enabled: false,
            condition3_enabled: false,
            candle1: "1",
            candle2: "1",
            kline_start: 10,
            kline_end: 100,
            lrc_filter_enabled: false,
            lrc_filter_type: null,
            time_filter_enabled: false,
            time_filter_start: null,
            time_filter_end: null,
          });
          fetchConditions();
        } else {
          toast.error(res?.error ?? res?.message ?? "Failed to save condition");
          console.error("Update condition error:", res.error);
        }
      } else {
        // Insert new condition
        const res = await ChartApis.insertCondition(form);
        if (res.success) {
          setConditions([...conditions, res.data]);
          toast.success("Condition Created successfully");
          // Reset form
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
            lrc_filter_enabled: false,
            lrc_filter_type: null,
            time_filter_enabled: false,
            time_filter_start: null,
            time_filter_end: null,
          });
          fetchConditions();
        } else {
          toast.error(res?.error ?? res?.message ?? "Failed to create condition");
          console.error("Insert condition error:", res.error);
        }
      }
    } catch (err) {
      toast.error("An error occurred while saving condition");
      console.error("Error saving condition", err);
    }
  };
  return (
    <div className="container mt-5">
      <div className="row justify-content-lg-center groups-page-content">
        <div className="container mt-5">
          <div className="accordion-like">
            <div className="title-cn d-flex flex-wrap align-items-center justify-content-between">
              <div className="m-2">Conditions Editor</div>
              <div className="home_back_btn text-end">
                <Link to="/" className="btn btn-link">
                  <i className="fa-solid fa-house"></i> Home
                </Link>
              </div>
            </div>
            <div className="body-cn">
              <div className="left-panel">
                <button
                  className="btn btn-primary w-100 mb-3"
                  onClick={() => {
                    setSelectedCondition(null);
                    setForm({
                      name: "New Condition",
                      lrcid: lrc.length > 0 ? lrc[0].id : "1",
                      psarid: psar.length > 0 ? psar[0].id : "2",
                      stochid: fastStoch.length > 0 ? fastStoch[0].id : "3",
                      lrcangletype: "custom",
                      lrcanglestart: 40,
                      lrcangleend: 80,
                      signaldirection: "1",
                      signalColor: "#000000",
                      hlfpid: hlfp.length > 0 ? hlfp[0].id : "1",
                      condition1_enabled: true,
                      condition2_enabled: false,
                      condition3_enabled: false,
                      candle1: "1",
                      candle2: "1",
                      kline_start: 10,
                      kline_end: 100,
                      lrc_filter_enabled: false,
                      lrc_filter_type: null,
                      time_filter_enabled: false,
                      time_filter_start: null,
                      time_filter_end: null,
                    });
                  }}
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Condition
                </button>
                {conditions.map((condition) => (
                  <div key={condition.id} className="scan-item">
                    <span>{condition?.name}</span>
                    <span>
                      <i
                        className="fas fa-edit m-1"
                        onClick={() => {
                          setSelectedCondition(condition);
                          changeEditData(condition.id);
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
                <div className="tab-control-container">
                  <h4 className="tab-heading text-start">Conditions Editor</h4>
                  <br />
                  {/* Warning if indicators are missing */}
                  {(lrc.length === 0 || psar.length === 0 || fastStoch.length === 0) && (
                    <div className="alert alert-warning d-flex align-items-center justify-content-between mb-3">
                      <span>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Missing indicators detected. Please add indicators before creating a condition.
                      </span>
                      <Link to="/ci" className="btn btn-sm btn-primary">
                        <i className="fas fa-plus"></i> Add Indicators
                      </Link>
                    </div>
                  )}
                  <div className="tab-content" id="myTabContent">
                    {/* Block 1 - Condition 1 */}
                    <div className="condition-section mb-3 p-3" style={{ border: "1px solid #ddd", borderRadius: 4 }}>
                      <div className="checkbox-section mb-2">
                        <label htmlFor="condition1" style={{ cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            id="condition1"
                            name="condition1_enabled"
                            checked={form.condition1_enabled === true}
                            style={{ marginRight: '8px', cursor: 'pointer' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("[Condition1 Checkbox] onClick fired, current checked:", e.target.checked, "form.condition1_enabled:", form.condition1_enabled);
                              // Manually toggle the state
                              const newValue = !form.condition1_enabled;
                              console.log("[Condition1 Checkbox] Manually setting to:", newValue);
                              setForm(prev => ({ ...prev, condition1_enabled: newValue }));
                            }}
                            onChange={(e) => {
                              e.stopPropagation();
                              console.log("[Condition1 Checkbox] onChange fired, checked:", e.target.checked, "Current form value:", form.condition1_enabled);
                              handleCheckboxChange(e);
                            }}
                          />
                          Enable this condition
                        </label>
                      </div>
                      <div className="form-section d-flex flex-wrap align-items-center mb-2">
                        <label className="me-2 mb-1">PSAR signals on a HeikinAshi candle</label>
                        <select
                          className="form-control me-2 mb-1"
                          style={{ maxWidth: 200 }}
                          name="candle1"
                          value={form.candle1}
                          onChange={handleFormChange}
                        >
                          <option value="1">Green HA Candle</option>
                          <option value="2">Green pin bar</option>
                          <option value="3">Green wickless bar</option>
                        </select>
                        <label className="me-2 mb-1">between Stochastics K line levels</label>
                        <input
                          type="text"
                          className="form-control me-2 mb-1"
                          style={{ maxWidth: 80 }}
                          name="kline_start"
                          value={form.kline_start}
                          onChange={handleFormChange}
                          placeholder="Start"
                        />
                        <input
                          type="text"
                          className="form-control mb-1"
                          style={{ maxWidth: 80 }}
                          name="kline_end"
                          value={form.kline_end}
                          onChange={handleFormChange}
                          placeholder="End"
                        />
                      </div>
                      <div className="form-section d-flex flex-wrap align-items-center">
                        <label className="me-2 mb-1">Indicator</label>
                        <select
                          className="form-control me-2 mb-1"
                          style={{ maxWidth: 200 }}
                          name="psarid"
                          value={form.psarid}
                          onChange={handleFormChange}
                        >
                          {Array.isArray(psar) &&
                            psar.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                        </select>
                        <select
                          className="form-control me-2 mb-1"
                          style={{ maxWidth: 200 }}
                          name="stochid"
                          value={form.stochid}
                          onChange={handleFormChange}
                        >
                          {Array.isArray(fastStoch) &&
                            fastStoch.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                        </select>
                        <Link to="/ci" className="btn btn-sm btn-outline-primary mb-1" title="Add/Edit Indicators">
                          <i className="fas fa-plus"></i> Add Indicator
                        </Link>
                      </div>
                    </div>

                    {/* Block 2 - Condition 2 */}
                    <div className="condition-section mb-3 p-3" style={{ border: "1px solid #ddd", borderRadius: 4 }}>
                      <div className="checkbox-section mb-2">
                        <input
                          type="checkbox"
                          id="condition2"
                          name="condition2_enabled"
                          checked={form.condition2_enabled === true || form.condition2_enabled === 1 || form.condition2_enabled === '1'}
                          onChange={(e) => {
                            console.log("[Condition2 Checkbox] onChange fired, checked:", e.target.checked, "Current form value:", form.condition2_enabled);
                            handleCheckboxChange(e);
                          }}
                        />
                        <label htmlFor="condition2" className="ms-2">
                          Enable this condition
                        </label>
                      </div>
                      <div className="form-section d-flex flex-wrap align-items-center mb-2">
                        <label className="me-2 mb-1">PSAR signals on a HeikinAshi candle</label>
                        <select
                          className="form-control me-2 mb-1"
                          style={{ maxWidth: 200 }}
                          name="candle2"
                          value={form.candle2}
                          onChange={handleFormChange}
                        >
                          <option value="1">Green HA Candle</option>
                          <option value="2">Green pin bar</option>
                          <option value="3">Green wickless bar</option>
                        </select>
                      </div>
                      <div className="form-section d-flex flex-wrap align-items-center">
                        <label className="me-2 mb-1">Indicator</label>
                        <select
                          className="form-control mb-1"
                          style={{ maxWidth: 200 }}
                          name="psarid"
                          value={form.psarid}
                          onChange={handleFormChange}
                        >
                          {Array.isArray(psar) &&
                            psar.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Block 3 - Filters (LRC + Time filter combined with new fields) */}
                    <div className="condition-section mb-3 p-3" style={{ border: "1px solid #ddd", borderRadius: 4 }}>
                      <div className="checkbox-section mb-2">
                        <input
                          type="checkbox"
                          id="condition3"
                          name="condition3_enabled"
                          checked={form.condition3_enabled}
                          onChange={handleCheckboxChange}
                        />
                        <label htmlFor="condition3" className="ms-2">
                          Enable this condition
                        </label>
                      </div>

                      {/* LRC configuration + filter */}
                      <div className="mb-3">
                        <h6 className="mb-2">LRC</h6>
                        {/* LRC configuration selector (from Custom Indicator / CI) */}
                        <div className="mb-2">
                          <label className="form-label d-block mb-1">
                            LRC configuration (from CI)
                          </label>
                          <div className="d-flex align-items-center gap-2">
                            <select
                              className="form-control"
                              id="lrcSelect"
                              name="lrcid"
                              value={form.lrcid}
                              onChange={handleFormChange}
                            >
                              {Array.isArray(lrc) &&
                                lrc.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}{" "}
                                    {item.value ? `(${item.value})` : ""}
                                  </option>
                                ))}
                            </select>
                            <Link to="/ci" className="btn btn-sm btn-outline-primary" title="Add/Edit Indicators">
                              <i className="fas fa-plus"></i> Add Indicator
                            </Link>
                          </div>
                        </div>

                        {/* LRC Filter (uses selected LRC config) */}
                        <h6 className="mb-2">LRC Filter</h6>
                        <label className="radio-label d-block mb-1">
                          <input
                            type="checkbox"
                            name="lrc_filter_enabled"
                            checked={form.lrc_filter_enabled || false}
                            onChange={(e) => {
                              console.log("[LRC Filter Checkbox] Changed to:", e.target.checked);
                              setForm((prev) => ({ ...prev, lrc_filter_enabled: e.target.checked }));
                            }}
                          />{" "}
                          Enable LRC Filter
                        </label>
                        {form.lrc_filter_enabled && (
                          <div>
                            <label className="radio-label d-block">
                              <input
                                type="radio"
                                name="lrc_filter_type"
                                value="1"
                                checked={form.lrc_filter_type === "1" || form.lrc_filter_type === 1}
                                onChange={(e) => {
                                  setForm((prev) => ({ ...prev, lrc_filter_type: e.target.value }));
                                }}
                              />{" "}
                              High is below middle LRC
                            </label>
                            <label className="radio-label d-block">
                              <input
                                type="radio"
                                name="lrc_filter_type"
                                value="2"
                                checked={form.lrc_filter_type === "2" || form.lrc_filter_type === 2}
                                onChange={(e) => {
                                  setForm((prev) => ({ ...prev, lrc_filter_type: e.target.value }));
                                }}
                              />{" "}
                              High is below lower LRC
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Time Filter (new) */}
                      <div>
                        <h6 className="mb-2">Time Filter</h6>
                        <label className="radio-label d-block mb-1">
                          <input
                            type="checkbox"
                            name="time_filter_enabled"
                            checked={form.time_filter_enabled || false}
                            onChange={(e) => {
                              console.log("[Time Filter Checkbox] Changed to:", e.target.checked);
                              setForm((prev) => ({ ...prev, time_filter_enabled: e.target.checked }));
                            }}
                          />{" "}
                          Enable Time Filter (exclude alerts in time range)
                        </label>
                        {form.time_filter_enabled && (
                          <div className="d-flex flex-wrap align-items-center">
                            <span className="me-2 mb-1">Exclude alerts from:</span>
                            <input
                              type="time"
                              className="form-control me-2 mb-1"
                              style={{ width: "auto" }}
                              name="time_filter_start"
                              value={form.time_filter_start || ""}
                              onChange={(e) => {
                                setForm({ ...form, time_filter_start: e.target.value });
                              }}
                            />
                            <span className="me-2 mb-1">to</span>
                            <input
                              type="time"
                              className="form-control mb-1"
                              style={{ width: "auto" }}
                              name="time_filter_end"
                              value={form.time_filter_end || ""}
                              onChange={(e) => {
                                setForm({ ...form, time_filter_end: e.target.value });
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Signal Arrow + Name + Save */}
                    <div className="condition-section p-3" style={{ border: "1px solid #ddd", borderRadius: 4 }}>
                      <h6 className="mb-3">Signal Arrow</h6>
                      <div className="d-flex flex-wrap align-items-center mb-3">
                        <span className="me-2 mb-1">Direction:</span>
                        <label className="radio-label me-3 mb-1">
                          <input
                            type="radio"
                            name="signaldirection"
                            value="1"
                            checked={form.signaldirection === "1"}
                            onChange={handleFormChange}
                          />{" "}
                          UP
                        </label>
                        <label className="radio-label mb-1">
                          <input
                            type="radio"
                            name="signaldirection"
                            value="-1"
                            checked={form.signaldirection === "-1"}
                            onChange={handleFormChange}
                          />{" "}
                          Down
                        </label>
                        <span className="ms-4 me-2 mb-1">Colour:</span>
                        <input
                          type="color"
                          className="form-control mb-1"
                          name="signalColor"
                          value={form.signalColor}
                          onChange={handleFormChange}
                          style={{ width: 40, height: 30, padding: 0 }}
                        />
                      </div>
                      <div className="d-flex flex-wrap align-items-center">
                        <label htmlFor="nameInput" className="mt-1 me-2">
                          Name
                        </label>
                        <input
                          type="text"
                          className="form-control me-2"
                          id="nameInput"
                          name="name"
                          value={form.name}
                          onChange={handleFormChange}
                          placeholder="Enter condition name"
                          style={{ maxWidth: 250 }}
                        />
                        <button className="btn btn-success mt-2 mt-sm-0" onClick={handleSave}>
                          {selectedCondition ? "Update Condition" : "Save New Condition"}
                        </button>
                      </div>
                    </div>
                  </div>
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
