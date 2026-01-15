import React, { useEffect } from "react";
import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { GroupApis } from "../api/groups.apis";
import toast from "react-hot-toast";

const GroupsModal = () => {
  const [state, setState] = React.useState({
    isLoading: false,
    groups: [],
  });

  const getGroups = async () => {
    setState({ ...state, isLoading: true });
    const response = await GroupApis.getGroups();

    if (!response?.success) {
      setState({ ...state, isLoading: false, groups: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    setState({
      ...state,
      isLoading: false,
      groups: [
        ...response.data,
        ...response.data,
        ...response.data,
        ...response.data,
        ...response.data,
      ],
    });
  };

  useEffect(() => {
    getGroups();
  }, []);

  return (
    <div className="groups-modal-container">
      <Modal
        show={true}
        size="lg"
        className="groups-modal"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header className="justify-content-between">
          <Modal.Title id="contained-modal-title-vcenter">Groups</Modal.Title>

          <Button onClick={() => {}}>+ Add</Button>
        </Modal.Header>
        <Modal.Body>
          <div>{state.isLoading ? "Loading groups...." : null}</div>
          <div className="groups-list">
            {state.groups.map((group) => {
              return (
                <div className="group-container" key={group?.id}>
                  <Link to={"#"} className="group-name">
                    {group?.group_name}
                  </Link>
                  <div className="action-buttons">
                    <button type="button" className="btn ">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => {}}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GroupsModal;
