import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { ChartApis } from "../../api/charts.apis";
import { CheckBox } from "@mui/icons-material";
import { Checkbox, FormControlLabel, FormGroup } from "@mui/material";
import { headerActions } from "../../redux/features/header.slice";
import { useDispatch } from "react-redux";
let initial = true;
const IndicatorModal = ({ show, onHide, indicatorType }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [acceleration, setAcceleration] = useState(null);
  const [maxAcceleration, setMaxAcceleration] = useState(null);
  const [upColor, setUpColor] = useState("");
  const [downColor, setDownColor] = useState("");
  const dispatch = useDispatch();
  const fetchData = async () => {
    try {
      const [response] = await Promise.all([ChartApis.getPsarSettings()]);

      if (response && response.data) {
        const { acceleration, maxAcceleration, upColor, downColor, enabled } =
          response.data[0];

        setAcceleration(acceleration);
        setUpColor(upColor);
        setMaxAcceleration(maxAcceleration);
        setDownColor(downColor);
        setIsEnabled(enabled);
        console.log('initial PSAR', initial);
        if(initial){
          console.log('initial PSAR dispatch');
        dispatch(
          headerActions.setMarkersValue({
            acceleration,
            maxAcceleration,
            upColor,
            downColor,
            enabled,
          })
        );
        initial = false;
      }
      } else {
        console.error("No data received");
      }
    } catch (error) {
      console.error("Error fetching trading data:", error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleSubmit = async () => {
    try {
      const res = await ChartApis.updatePsarSettings({
        acceleration,
        maxAcceleration,
        upColor,
        downColor,
        isEnabled,
      });
      dispatch(
        headerActions.setMarkersValue({
          acceleration,
          maxAcceleration,
          upColor,
          downColor,
          enabled: isEnabled,
        })
      );
      onHide();
    } catch (err) {
      console.error("Error fetching trading data:", err);
    }
  };
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{indicatorType}</Modal.Title>
      </Modal.Header>
      <Modal.Body >
        <div className="container">
          <Form>
            <Form.Group>
              <Form.Label htmlFor="acceleration">Acceleration</Form.Label>
              <Form.Control
                type="number"
                id="acceleration"
                value={acceleration}
                step="0.01"
                onChange={(e) => setAcceleration(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="max_acceleration">
                Max Acceleration
              </Form.Label>
              <Form.Control
                type="number"
                id="max_acceleration"
                value={maxAcceleration}
                step="0.1"
                onChange={(e) => setMaxAcceleration(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <h5 style={{ marginTop: "20px" }}>Arrow Signal</h5>
              <div className="d-flex align-items-center mb-3">
                <FontAwesomeIcon icon={faArrowUp} className="mr-2" />
                <span className="mr-auto">Up</span>
                <Form.Control
                  type="color"
                  value={upColor}
                  onChange={(e) => setUpColor(e.target.value)}
                  style={{ width: "60px" }}
                />
              </div>
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faArrowDown} className="mr-2" />
                <span className="mr-auto">Down</span>
                <Form.Control
                  type="color"
                  value={downColor}
                  onChange={(e) => setDownColor(e.target.value)}
                  style={{ width: "60px" }}
                />
              </div>
              <div>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!isEnabled}
                        onChange={(e) => setIsEnabled(e.target.checked)}
                      />
                    }
                    label="Enable"
                  />
                </FormGroup>
              </div>
            </Form.Group>
            <Form.Group className="text-center">
              <Button
                variant="primary"
                onClick={handleSubmit}
                style={{ marginRight: "10px" }}
              >
                OK
              </Button>
              <Button variant="secondary" onClick={onHide}>
                Cancel
              </Button>
            </Form.Group>
          </Form>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default IndicatorModal;
