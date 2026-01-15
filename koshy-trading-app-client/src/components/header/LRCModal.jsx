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
const LRCModal = ({ show, onHide, indicatorType }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [period, setPeriod] = useState(null);
  const [standardDeviation, setStandardDeviation] = useState(null);
  const [upperColor, setUpperColor] = useState("");
  const [lowerColor, setLowerColor] = useState("");
  const [linColor, setLinColor] = useState("");
  const dispatch = useDispatch();
  
  const fetchData = async () => {
    try {
      const [response] = await Promise.all([ChartApis.getLRCSettings()]);
      //console.log(response);
      if (response && response.data) {
        const { period, standardDeviation, upperColor, lowerColor, linColor, isEnabled: isEnabledFromResponse } = response.data[0];
        const isEnabledBoolean = isEnabledFromResponse === 1;
        
        setPeriod(period);
        setUpperColor(upperColor);
        setStandardDeviation(standardDeviation);
        setLowerColor(lowerColor);
        setLinColor(linColor);
        setIsEnabled(isEnabledBoolean);
        console.log('initial Fast Stoch', initial);
        if(initial){
          console.log('initial Fast Stoch dispatch');
          dispatch(
            headerActions.setLRCValue({
              period, standardDeviation, upperColor, lowerColor, linColor, lrcenabled: isEnabledBoolean,
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
    console.log('in handle submit');
    try {
      const res = await ChartApis.updateLRCSettings({
        period, standardDeviation, upperColor, lowerColor, linColor, isEnabled,
      });
      console.log(res);
      dispatch(
        headerActions.setLRCValue({
          period, 
          standardDeviation, 
          upperColor, 
          lowerColor, 
          linColor, 
          lrcenabled: isEnabled,
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
        <Modal.Title>Linear Regression Channel</Modal.Title>
      </Modal.Header>
      <Modal.Body >
        <div className="container">
          <Form>
            <Form.Group>
              <Form.Label htmlFor="period">Period</Form.Label>
              <Form.Control
                type="number"
                id="period"
                value={period}
                step="1"
                onChange={(e) => setPeriod(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="standardDeviation">
              Standard Deviation
              </Form.Label>
              <Form.Control
                type="number"
                id="standardDeviation"
                value={standardDeviation}
                step="1"
                onChange={(e) => setStandardDeviation(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <h5 style={{ marginTop: "20px" }}>Chart Colors</h5>
              <div className="d-flex align-items-center mb-3">
                
                <span className="mr-auto">Upper Lin Reg</span>
                <Form.Control
                  type="color"
                  value={upperColor}
                  onChange={(e) => setUpperColor(e.target.value)}
                  style={{ width: "60px" }}
                />
              </div>
              <div className="d-flex align-items-center mb-3">
                <span className="mr-auto">Lower Lin Reg</span>
                <Form.Control
                  type="color"
                  value={lowerColor}
                  onChange={(e) => setLowerColor(e.target.value)}
                  style={{ width: "60px" }}
                />
              </div>

              <div className="d-flex align-items-center">
                <span className="mr-auto">Lin Reg</span>
                <Form.Control
                  type="color"
                  value={linColor}
                  onChange={(e) => setLinColor(e.target.value)}
                  style={{ width: "60px" }}
                />
              </div>

              <div>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isEnabled}
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

export default LRCModal;
