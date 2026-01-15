import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { ChartApis } from "../api/charts.apis";
import toast from "react-hot-toast";

const ScanChild = ({ scanId }) => {
  const [scanItems, setScanItems] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [conditionID, setConditionID] = useState(null);
  const [data, setData] = useState({
    scanId: scanId,
    conditionId: conditions[0]?.id,
    oneMin: 0,
    twoMin: 0,
    threeMin: 0,
    fiveMin: 0,
    tenMin: 0,
    fifteenMin: 0,
    thirtyMin: 0,
    sixtyMin: 0,
  });

  const fetchScanItemsByScanID = async (scanId) => {
    try {
      const res = await ChartApis.fetchScanItemsByScanID(scanId);
      if (res.success) {
        setScanItems(res.data);
      }
    } catch (error) {
      console.error("Something went wrong fetching scan items", error);
      toast.error("Failed to fetch scan items.");
    }
  };

  const fetchConditions = async () => {
    try {
      const res = await ChartApis.getConditions();
      if (res.success) {
        setConditions(res.data);
        if (res.data.length > 0) {
          setConditionID(res.data[0].id);
        }
      } else {
        console.error(res.error);
        toast.error("Failed to fetch conditions.");
      }
    } catch (err) {
      console.error("Error fetching conditions", err);
      toast.error("Error fetching conditions.");
    }
  };

  useEffect(() => {
    if (scanId) {
      fetchScanItemsByScanID(scanId);
      fetchConditions();
    }
  }, [scanId]);

  const handleAdd = async () => {
    try {
      const res = await ChartApis.insertScanItemById({
        scanID: scanId,
        conditionID,
        ...data,
      });
      if (res.success) {
        // toast.success("Scan item added successfully");
        fetchScanItemsByScanID(scanId);
      } else {
        console.error(res.error);
        toast.error("Failed to add scan item.");
      }
    } catch (err) {
      console.error("Something went wrong inserting scan item by id", err);
      toast.error("Error inserting scan item.");
    }
  };

  const handleSave = async () => {
    try {
      for (const item of scanItems) {
        const { id, ...data } = item;
        const res = await ChartApis.updateScanItemById({
          id,
          ...data,
        });
        console.log(`Scan item with id ${id} updated:`, res.data);
      }
      toast.success("All scan items updated successfully");
    } catch (error) {
      console.error("Error saving scan items:", error);
      toast.error("Error saving scan items.");
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedScanItems = [...scanItems];
    updatedScanItems[index][field] = value;
    setScanItems(updatedScanItems);
  };

  const handleCheckboxChange = (index, field) => {
    const updatedScanItems = [...scanItems];
    updatedScanItems[index][field] =
      updatedScanItems[index][field] === 1 ? 0 : 1;
    setScanItems(updatedScanItems);
  };

  const handleDelete = async (id) => {
    try {
      const res = await ChartApis.deleteScanItemById(id);
      if (res.success) {
        toast.success("Scan deleted successfully");
        fetchScanItemsByScanID(scanId);
      } else {
        console.error(res.error);
        toast.error("Failed to delete scan item.");
      }
    } catch (err) {
      console.error("Something went wrong deleting scan item by id", err);
      toast.error("Error deleting scan item.");
    }
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>1 Min</th>
            <th>2 Min</th>
            <th>3 Min</th>
            <th>5 Min</th>
            <th>10 Min</th>
            <th>15 Min</th>
            <th>30 Min</th>
            <th>60 Min</th>
            <th>CN</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {scanItems.map((item, index) => (
            <tr key={item.id}>
              <td>
                <input
                  type="checkbox"
                  checked={item.oneMin === 1}
                  onChange={() => handleCheckboxChange(index, "oneMin")}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={item.twoMin === 1}
                  onChange={() => handleCheckboxChange(index, "twoMin")}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={item.threeMin === 1}
                  onChange={() => handleCheckboxChange(index, "threeMin")}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={item.fiveMin === 1}
                  onChange={() => handleCheckboxChange(index, "fiveMin")}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={item.tenMin === 1}
                  onChange={() => handleCheckboxChange(index, "tenMin")}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={item.fifteenMin === 1}
                  onChange={() => handleCheckboxChange(index, "fifteenMin")}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={item.thirtyMin === 1}
                  onChange={() => handleCheckboxChange(index, "thirtyMin")}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={item.sixtyMin === 1}
                  onChange={() => handleCheckboxChange(index, "sixtyMin")}
                />
              </td>
              <td>
                <select
                  className="form-control"
                  id="groupSelect"
                  value={item.conditionID}
                  onChange={(e) =>
                    handleInputChange(index, "conditionID", e.target.value)
                  }
                >
                  {conditions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <FontAwesomeIcon
                  icon={faTrashAlt}
                  style={{ cursor: "pointer", color: "gray" }}
                  onClick={() => handleDelete(item.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          gap: "10px",
        }}
      >
        <button className="btn btn-success mt-2" onClick={handleAdd}>
          Add +
        </button>
        <button className="btn btn-success mt-2" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default ScanChild;
