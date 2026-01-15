import React, { useState, useEffect } from "react";
import "./Scan.scss";
import { ChartApis } from "../api/charts.apis";
import { GroupApis } from "../api/groups.apis";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import ScanChild from "./ScanChild";

const Scan = () => {
  const [dataScan, setDataScan] = useState([]);
  const [groups, setGroups] = useState([]);
  const [name, setName] = useState("");
  const [basketId, setBasketId] = useState("");
  const [basketName, setBasketName] = useState("");

  const [scanId, setScanId] = useState(null);
  const [addScan, setAddScan] = useState(true);
  const [editScan, setEditScan] = useState(false);

  const fetchScanData = async () => {
    try {
      const res = await ChartApis.getScans();
      if (res.success) {
        setDataScan(res.data);
      } else {
        console.error(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getGroups = async () => {
    const res = await GroupApis.getGroups();
    console.log(res, "GETGROUPS")
    setGroups(res.data);
    if (!res?.success) {
      toast.error(
        res?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }
  };

  const getBasketName = async () => {
    const res = await GroupApis.getGroupById(basketId);
    setBasketName(res.data.name);
  };

  useEffect(() => {
    fetchScanData();
    getGroups();
  }, []);

  const getScanById = async (id) => {
    try {
      const res = await ChartApis.getScanById(id);
      if (res.success) {
        setName(res.data.name);
        setBasketId(res.data.basketId);
        getBasketName();
      }
    } catch (error) {
      console.error("Something went wrong inserting scans", error);
    }
  };

  const insertScan = async (e) => {
    e.preventDefault();
    try {
      const res = await ChartApis.insertScans({
        name,
        basketId,
      });
      if (res.success) {
        toast.success("Scan inserted successfully");
        setAddScan(true);
        setEditScan(false);
        fetchScanData();
        setName("");
        setBasketId("");
      }
    } catch (error) {
      console.error("Something went wrong fetching scan by id", error);
    }
  };

  const updateScan = async (e) => {
    e.preventDefault();
    try {
      const res = await ChartApis.updateScans({
        id: scanId,
        name,
        basketId,
      });
      if (res.success) {
        toast.success("Scan updated successfully");
        setAddScan(true);
        setEditScan(false);
        fetchScanData(); // Refresh the scan data
      }
    } catch (error) {
      console.error("Something went wrong updating scans", error);
    }
  };

  const deleteScan = async (id) => {
    try {
      const res = await ChartApis.deleteScan(id);
      if (res.success) {
        toast.success("Scan item deleted");
        fetchScanData(); // Refresh the scan data
      }
    } catch (error) {
      console.error("Something went wrong deleting scans", error);
    }
  };

  const switchToAddScan = () => {
    setEditScan(false);
    setAddScan(true);
  };

  const restartScanProcesses = async () => {
    try {
      const res = await ChartApis.restartScanProcesses();
      if (res.success) {
        toast.success("Scan processes restarted successfully");
      } else {
        toast.error(res.error || "Failed to restart scan processes");
      }
    } catch (error) {
      console.error("Error restarting scan processes:", error);
      toast.error("Error restarting scan processes");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-lg-center groups-page-content">
        <div className="container mt-5">
          <div className="accordion-like">
            <div className="title-cn d-flex flex-wrap align-items-center justify-content-between">
              <div className="m-2">{addScan ? "Add Scan" : "Edit Scan"}</div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-warning btn-sm"
                  onClick={restartScanProcesses}
                  title="Restart Scan Processes"
                >
                  <i className="fa-solid fa-redo"></i> Restart Scan
                </button>
                <div className="home_back_btn text-end">
                  <Link to="/" className="btn btn-link">
                    <i className="fa-solid fa-house"></i> Home
                  </Link>
                </div>
              </div>
            </div>

            <div className="body-cn">
              <div className="left-panel">
                {dataScan &&
                  dataScan.map((item) => (
                    <div key={item.id} className="scan-item">
                      <span>{item.name}</span>
                      <span>
                        <i
                          className="fas fa-edit p-1"
                          onClick={() => {
                            setEditScan(true);
                            setAddScan(false);
                            setScanId(item.id);
                            setName(item.name);
                            setBasketId(item.basketId);
                            getScanById(item.basketId);
                          }}
                        />
                        <i
                          className="fas fa-trash-alt p-1"
                          onClick={() => deleteScan(item.id)}
                        />
                      </span>
                    </div>
                  ))}
              </div>
              {addScan && (
                <form onSubmit={insertScan} className="right-panel">
                  <div className="form-group d-flex justify-content-around gap-2 align-items-center">
                    <label htmlFor="groupSelect">Group</label>
                    <select
                      className="form-control"
                      id="groupSelect"
                      onChange={(e) => setBasketId(e.target.value)}
                    >
                      {groups &&
                        groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.group_name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="row-4">
                    <input
                      type="text"
                      className="form-control"
                      id="nameInput"
                      // value={name}
                      placeholder="Name"
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <button className="btn btn-success" type="submit">
                      Save
                    </button>
                  </div>
                </form>
              )}
              {editScan && (
                <form onSubmit={updateScan} className="right-panel">
                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-primary pl-3 pr-3 ml-2 align"
                      onClick={switchToAddScan}
                    >
                      +
                    </button>
                  </div>
                  <br />
                  <div className="form-group d-flex justify-content-around align-items-center gap-2">
                    <label htmlFor="groupSelect">Group</label>
                    <select
                      className="form-control"
                      id="groupSelect"
                      value={basketId}
                      onChange={(e) => {
                        console.log("Selected group id:", e.target.value);

                        setBasketId(e.target.value)}}
                    >
                      {groups &&
                        groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.group_name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="row-4">
                    <input
                      type="text"
                      className="form-control"
                      id="nameInput"
                      value={name}
                      placeholder="Name"
                      onChange={(e) => setName(e.target.value)}
                    />
                    <button className="btn btn-success" type="submit">
                      Save
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          {editScan && <ScanChild scanId={scanId} />}
        </div>
      </div>
    </div>
  );
};

export default Scan;
