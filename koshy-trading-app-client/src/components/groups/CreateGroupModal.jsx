import { useFormik } from "formik";
import React from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { GroupApis } from "../../api/groups.apis";
import toast from "react-hot-toast";

const CreateGroupModal = ({ open, handleClose, handleSuccess }) => {
  const [state, setState] = React.useState({
    isSubmitting: false,
  });

  const initialValues = {
    group_name: "",
  };

  const handleSubmit = async (values) => {
    setState({ ...state, isSubmitting: true });

    const response = await GroupApis.createGroup({
      group_name: values.group_name,
    });

    if (!response?.success) {
      setState({ ...state, isSubmitting: false, groups: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    toast.success("Group created successfully");

    setState({ ...state, isSubmitting: false });

    handleSuccess();
  };

  const formik = useFormik({
    initialValues,
    onSubmit: handleSubmit,
    validateOnChange: false,
    validateOnBlur: false,
    validateOnMount: false,
  });

  return (
    <div className="create-group-modal">
      <Modal
        show={open}
        size="lg"
        className="groups-modal"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleClose}
      >
        <Modal.Header className="justify-content-between" closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Create Group
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group md="4" controlId="validationCustom01">
            <Form.Label>Group name</Form.Label>
            <Form.Control
              required
              type="text"
              name="group_name"
              placeholder="Enter group name"
              defaultValue=""
              values={formik.values.group_name}
              onChange={formik.handleChange}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClose} variant="secondary">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={formik.handleSubmit}
            disabled={state.isSubmitting}
          >
            {state.isSubmitting ? "Creating..." : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CreateGroupModal;
