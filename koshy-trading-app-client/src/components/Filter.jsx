import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "./header";
import { GroupApis } from "../api/groups.apis";
import { FilterApis } from "../api/filters.apis";
import toast from "react-hot-toast";

const Filter = () => {
  const [groups, setGroups] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  // Separate bucket for futures vs options
  const [futOptions, setFutOptions] = useState([]); // [{...instrument}]
  const [cepeOptions, setCepeOptions] = useState([]); // [{strike, CE, PE}]
  const [selectedFuts, setSelectedFuts] = useState(new Set()); // set of instrument_tokens
  const [selectedCePe, setSelectedCePe] = useState(new Set()); // set of "{token}_CE" / "{token}_PE"
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [expiryFilterType, setExpiryFilterType] = useState("none");
  const [expiryDate, setExpiryDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [availableSymbols, setAvailableSymbols] = useState([]);

  // ──────────────────────────────────────────────
  // Data fetching helpers
  // ──────────────────────────────────────────────

  const fetchGroups = async () => {
    try {
      const res = await GroupApis.getGroups();
      if (res.success && res.data) setGroups(res.data);
    } catch (err) {
      console.error("Error fetching groups:", err);
      toast.error("Failed to fetch groups");
    }
  };

  const fetchAvailableSymbols = async () => {
    try {
      const res = await FilterApis.getAvailableSymbols();
      if (res.success && res.data) {
        setAvailableSymbols(res.data);
      } else {
        toast.error("Failed to fetch symbols");
      }
    } catch (err) {
      toast.error("Failed to fetch symbols");
    }
  };

  const fetchOptions = async () => {
    if (!selectedSymbol) {
      toast.error("Please select a symbol");
      return;
    }

    setLoading(true);
    setShowOptions(false);
    setFutOptions([]);
    setCepeOptions([]);
    setSelectedFuts(new Set());
    setSelectedCePe(new Set());

    try {
      const params = { symbol: selectedSymbol };
      if (expiryFilterType === "single" && expiryDate) {
        params.expiryDate = expiryDate;
      } else if (expiryFilterType === "range") {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await FilterApis.getInstrumentsOptions(params);

      if (res.success && res.data) {
        const instruments = res.data;

        // Separate FUT from CE/PE
        const futs = instruments.filter((i) => i.instrument_type === "FUT");
        const nonFuts = instruments.filter((i) => i.instrument_type !== "FUT");

        setFutOptions(futs);

        // Group CE/PE by strike
        const grouped = {};
        nonFuts.forEach((inst) => {
          const key = `${inst.expiry}_${inst.strike}`;
          if (!grouped[key]) {
            grouped[key] = { strike: inst.strike, expiry: inst.expiry, CE: null, PE: null };
          }
          if (inst.instrument_type === "CE") grouped[key].CE = inst;
          else if (inst.instrument_type === "PE") grouped[key].PE = inst;
        });
        const sorted = Object.values(grouped).sort((a, b) => {
          if (a.expiry !== b.expiry) return a.expiry < b.expiry ? -1 : 1;
          return a.strike - b.strike;
        });
        setCepeOptions(sorted);

        setShowOptions(true);
        toast.success(
          `Loaded ${futs.length} FUT + ${nonFuts.length} CE/PE instruments`
        );
      } else {
        toast.error(res.message || "Failed to fetch options");
      }
    } catch (err) {
      console.error("Error fetching options:", err);
      toast.error("Failed to fetch options");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Selection helpers
  // ──────────────────────────────────────────────

  const toggleFut = (token) => {
    setSelectedFuts((prev) => {
      const next = new Set(prev);
      next.has(token) ? next.delete(token) : next.add(token);
      return next;
    });
  };

  const toggleCePe = (token, type) => {
    const key = `${token}_${type}`;
    setSelectedCePe((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleCePeRow = (row) => {
    if (row.CE) toggleCePe(row.CE.instrument_token, "CE");
    if (row.PE) toggleCePe(row.PE.instrument_token, "PE");
  };

  const totalSelected = selectedFuts.size + selectedCePe.size;

  // ──────────────────────────────────────────────
  // Submit flow
  // ──────────────────────────────────────────────

  const handleAddToGroup = async () => {
    if (!selectedGroup) { toast.error("Please select a group"); return; }
    if (totalSelected === 0) { toast.error("Please select at least one instrument"); return; }

    setLoading(true);
    try {
      const group = groups.find((g) => g.group_name === selectedGroup);
      if (!group) { toast.error("Group not found"); return; }

      const nameMappings = {
        NIFTY: "NIFTY 50",
        BANKNIFTY: "NIFTY BANK",
        FINNIFTY: "NIFTY FIN SERVICE",
        MIDCPNIFTY: "NIFTY MIDCAP 50",
      };
      const displaySymbol = nameMappings[selectedSymbol] || selectedSymbol;

      // Collect all instruments to save
      const toSave = [];

      // FUT instruments
      futOptions
        .filter((inst) => selectedFuts.has(inst.instrument_token))
        .forEach((inst) => {
          toSave.push({
            symbol: displaySymbol,
            option_name: inst.tradingsymbol,
            expiry: inst.expiry,
            instrument_token: inst.instrument_token,
            group_name: group.group_name,
            basket_id: group.id,
          });
        });

      // CE/PE instruments
      cepeOptions.forEach((row) => {
        if (row.CE && selectedCePe.has(`${row.CE.instrument_token}_CE`)) {
          toSave.push({
            symbol: displaySymbol,
            option_name: row.CE.tradingsymbol,
            expiry: row.CE.expiry,
            instrument_token: row.CE.instrument_token,
            group_name: group.group_name,
            basket_id: group.id,
          });
        }
        if (row.PE && selectedCePe.has(`${row.PE.instrument_token}_PE`)) {
          toSave.push({
            symbol: displaySymbol,
            option_name: row.PE.tradingsymbol,
            expiry: row.PE.expiry,
            instrument_token: row.PE.instrument_token,
            group_name: group.group_name,
            basket_id: group.id,
          });
        }
      });

      if (toSave.length === 0) {
        toast.error("No instruments to save");
        return;
      }

      const results = await Promise.all(
        toSave.map((payload) => FilterApis.addFilterOption(payload))
      );

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        toast.success(`✅ Added ${successCount} instrument(s) to "${selectedGroup}"`);
      } else {
        toast.error(
          `Added ${successCount}/${toSave.length}. ${failCount} failed (may already exist).`
        );
      }

      // Reset selections on full success
      if (failCount === 0) {
        setSelectedFuts(new Set());
        setSelectedCePe(new Set());
        setShowOptions(false);
      }
    } catch (err) {
      console.error("Error adding options:", err);
      toast.error("Failed to add instruments");
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────────────────────────────────
  // Mount
  // ──────────────────────────────────────────────

  useEffect(() => {
    fetchGroups();
    fetchAvailableSymbols();
  }, []);

  // ──────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────

  return (
    <div className="container mt-5">
      <Header />
      <div className="row justify-content-lg-center">
        <div className="container mt-5">
          <div className="accordion-like">
            {/* ── Header bar ── */}
            <div className="title-cn d-flex flex-wrap align-items-center justify-content-between">
              <div className="m-2">Filter Options</div>
              <div className="home_back_btn text-end">
                <Link to="/" className="btn btn-link">
                  <i className="fa-solid fa-house"></i> Home
                </Link>
              </div>
            </div>

            <div className="body-cn">
              {/* ── Symbol + group selection ── */}
              <div
                className="condition-section mb-3 p-3"
                style={{ border: "1px solid #ddd", borderRadius: 4 }}
              >
                <h5 className="mb-3">Select Symbol and Group</h5>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="symbol" className="form-label">
                      Choose a Trading Symbol:
                    </label>
                    <select
                      className="form-control"
                      id="symbol"
                      value={selectedSymbol}
                      onChange={(e) => {
                        setSelectedSymbol(e.target.value);
                        setShowOptions(false);
                        setFutOptions([]);
                        setCepeOptions([]);
                        setSelectedFuts(new Set());
                        setSelectedCePe(new Set());
                      }}
                    >
                      <option value="">Select Symbol</option>
                      {availableSymbols.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="group" className="form-label">
                      Choose a Group:
                    </label>
                    <select
                      className="form-control"
                      id="group"
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                      <option value="">Select Group</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.group_name}>
                          {g.group_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ── Expiry filter ── */}
                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label">Filter by Expiry Date:</label>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      {["none", "single", "range"].map((val) => (
                        <div className="form-check" key={val}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name="expiryFilter"
                            id={`expiry_${val}`}
                            value={val}
                            checked={expiryFilterType === val}
                            onChange={(e) => {
                              setExpiryFilterType(e.target.value);
                              setExpiryDate("");
                              setStartDate("");
                              setEndDate("");
                            }}
                          />
                          <label className="form-check-label" htmlFor={`expiry_${val}`}>
                            {val === "none" ? "All Future" : val === "single" ? "Single Date" : "Date Range"}
                          </label>
                        </div>
                      ))}
                    </div>
                    {expiryFilterType === "single" && (
                      <div className="col-md-4">
                        <input
                          type="date"
                          className="form-control"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                        />
                      </div>
                    )}
                    {expiryFilterType === "range" && (
                      <div className="row">
                        <div className="col-md-5">
                          <label className="form-label small">Start Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label small">End Date:</label>
                          <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={fetchOptions}
                  disabled={!selectedSymbol || loading}
                >
                  {loading ? "Loading..." : "Load Instruments"}
                </button>
              </div>

              {/* ── FUT section ── */}
              {showOptions && futOptions.length > 0 && (
                <div
                  className="condition-section mb-3 p-3"
                  style={{ border: "1px solid #28a745", borderRadius: 4 }}
                >
                  <h5 className="mb-3">
                    Futures ({futOptions.length} available,{" "}
                    <span className="text-success">{selectedFuts.size} selected</span>)
                  </h5>
                  <div className="table-responsive">
                    <table className="table table-sm table-striped table-bordered">
                      <thead className="table-success">
                        <tr>
                          <th style={{ width: 40 }}>
                            <input
                              type="checkbox"
                              checked={selectedFuts.size === futOptions.length}
                              onChange={() => {
                                if (selectedFuts.size === futOptions.length) {
                                  setSelectedFuts(new Set());
                                } else {
                                  setSelectedFuts(
                                    new Set(futOptions.map((f) => f.instrument_token))
                                  );
                                }
                              }}
                            />
                          </th>
                          <th>Symbol</th>
                          <th>Expiry</th>
                          <th>Token</th>
                          <th>Exchange</th>
                        </tr>
                      </thead>
                      <tbody>
                        {futOptions.map((inst) => (
                          <tr key={inst.instrument_token}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedFuts.has(inst.instrument_token)}
                                onChange={() => toggleFut(inst.instrument_token)}
                              />
                            </td>
                            <td>
                              <strong>{inst.tradingsymbol}</strong>
                            </td>
                            <td>{inst.expiry}</td>
                            <td>
                              <small className="text-muted">{inst.instrument_token}</small>
                            </td>
                            <td>{inst.exchange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── CE/PE section ── */}
              {showOptions && cepeOptions.length > 0 && (
                <div
                  className="condition-section mb-3 p-3"
                  style={{ border: "1px solid #ddd", borderRadius: 4 }}
                >
                  <h5 className="mb-3">
                    Options — {selectedSymbol} (
                    <span className="text-success">{selectedCePe.size} selected</span>)
                  </h5>
                  <div className="table-responsive" style={{ maxHeight: 480, overflowY: "auto" }}>
                    <table className="table table-sm table-striped table-bordered">
                      <thead style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
                        <tr>
                          <th>Select Both</th>
                          <th>Strike</th>
                          <th>CE</th>
                          <th>PE</th>
                          <th>Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cepeOptions.map((row, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="checkbox"
                                checked={
                                  (row.CE
                                    ? selectedCePe.has(`${row.CE.instrument_token}_CE`)
                                    : true) &&
                                  (row.PE
                                    ? selectedCePe.has(`${row.PE.instrument_token}_PE`)
                                    : true)
                                }
                                onChange={() => toggleCePeRow(row)}
                              />
                            </td>
                            <td>{row.strike}</td>
                            <td>
                              {row.CE ? (
                                <div>
                                  <input
                                    type="checkbox"
                                    checked={selectedCePe.has(
                                      `${row.CE.instrument_token}_CE`
                                    )}
                                    onChange={() =>
                                      toggleCePe(row.CE.instrument_token, "CE")
                                    }
                                  />{" "}
                                  <span className="ms-1">{row.CE.tradingsymbol}</span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {row.PE ? (
                                <div>
                                  <input
                                    type="checkbox"
                                    checked={selectedCePe.has(
                                      `${row.PE.instrument_token}_PE`
                                    )}
                                    onChange={() =>
                                      toggleCePe(row.PE.instrument_token, "PE")
                                    }
                                  />{" "}
                                  <span className="ms-1">{row.PE.tradingsymbol}</span>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>{row.expiry}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Add button ── */}
              {showOptions && totalSelected > 0 && (
                <div className="condition-section p-3" style={{ border: "1px solid #007bff", borderRadius: 4 }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span>
                      <strong>{totalSelected}</strong> instrument(s) selected for group{" "}
                      <strong>&ldquo;{selectedGroup || "(none)"}&rdquo;</strong>
                    </span>
                    <button
                      className="btn btn-success"
                      onClick={handleAddToGroup}
                      disabled={!selectedGroup || totalSelected === 0 || loading}
                    >
                      {loading
                        ? "Adding..."
                        : `Add ${totalSelected} Instrument(s) to Group`}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Empty state ── */}
              {!showOptions && (
                <div
                  className="condition-section p-3"
                  style={{ border: "1px solid #ddd", borderRadius: 4 }}
                >
                  <p className="text-muted mb-0">
                    Select a symbol and optionally filter by expiry, then click{" "}
                    <strong>Load Instruments</strong> to see FUT / CE / PE instruments.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;
