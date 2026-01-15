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
const FastStochModal = ({ show, onHide, indicatorType }) => {
  const [Enabled, setIsEnabled] = useState(false);
  const [stoch_period, setPeriod] = useState(null);
  const [k_avg, setKAvg] = useState(null);
  const [d_avg, setDAvg] = useState("");
  const [k_color, setKColor] = useState("");
  const [d_color, setDColor] = useState("");
  const [k_line_size, setKLineSize] = useState("");
  const [d_line_size, setDLineSize] = useState("");

  const dispatch = useDispatch();

  const fetchData = async () => {
    try {
      const [response] = await Promise.all([ChartApis.getFastStochSettings()]);
      //console.log(response);
      if (response && response.data) {
        const {
          period,
          k_avg,
          d_avg,
          k_color,
          d_color,
          k_line_size,
          d_line_size,
          IsEnabled,
        } = response.data[0];
        console.log("Fast Stoch IsEnabled from response", IsEnabled);

        let isEnabledBoolean = IsEnabled === 1;

        setIsEnabled(isEnabledBoolean);
        setPeriod(period);
        setKAvg(k_avg);
        setDAvg(d_avg);
        setKColor(k_color);
        setDColor(d_color);
        setKLineSize(k_line_size);
        setDLineSize(d_line_size);
        console.log('initial Fast Stoch', initial);
        if(initial){
          console.log('initial Fast Stoch dispatch');
              dispatch(
                headerActions.setStochValue({
                  stoch_period: period,
                  k_avg,
                  d_avg,
                  k_color,
                  d_color,
                  k_line_size,
                  d_line_size,
                  stochEnabled: isEnabledBoolean,
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

  useEffect(() => {
    // console.log(
    //   "---------------------- stochEnabled after setIsEnabled",
    //   Enabled
    // );
  }, [Enabled]); // This effect runs every time 'Enabled' changes

  const handleSubmit = async () => {
    try {
      const res = await ChartApis.updateStochSettings({
        stoch_period,
        k_avg,
        d_avg,
        k_color,
        d_color,
        k_line_size,
        d_line_size,
        stochEnabled: Enabled,
      });

      dispatch(
        headerActions.setStochValue({
          stoch_period,
          k_avg,
          d_avg,
          k_color,
          d_color,
          k_line_size,
          d_line_size,
          stochEnabled: Enabled,
        })
      );
      onHide();
    } catch (err) {
      console.error("Error setStochValue:", err);
    }
  };
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Fast Stochastics</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="container">
          <Form>
            <Form.Group>
              <Form.Label htmlFor="period">Period</Form.Label>
              <Form.Control
                type="number"
                id="period"
                value={stoch_period}
                step="1"
                onChange={(e) => setPeriod(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="k_avg">%K Avg</Form.Label>
              <Form.Control
                type="number"
                id="k_avg"
                value={k_avg}
                step="1"
                onChange={(e) => setKAvg(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label htmlFor="d_avg">%D Avg</Form.Label>
              <Form.Control
                type="number"
                id="d_avg"
                value={d_avg}
                step="1"
                onChange={(e) => setDAvg(e.target.value)}
              />
            </Form.Group>

            <Form.Group>
              <h5 style={{ marginTop: "20px" }}>Chart Colors</h5>
              <div className="d-flex align-items-center mb-3">
                <span className="mr-auto">%K</span>
                <Form.Control
                  type="color"
                  value={k_color}
                  onChange={(e) => setKColor(e.target.value)}
                  style={{ width: "60px" }}
                />
                <Form.Select
                  value={k_line_size}
                  onChange={(e) => setKLineSize(e.target.value)}
                  style={{ width: "60px" }}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="d-flex align-items-center mb-3">
                <span className="mr-auto">%D</span>
                <Form.Control
                  type="color"
                  value={d_color}
                  onChange={(e) => setDColor(e.target.value)}
                  style={{ width: "60px" }}
                />
                <Form.Select
                  value={d_line_size}
                  onChange={(e) => setDLineSize(e.target.value)}
                  style={{ width: "60px" }}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Enabled}
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

export default FastStochModal;
