import { useFormik } from "formik";
import React from "react";
import { GroupApis } from "../../api/groups.apis";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { Button, Form, Modal } from "react-bootstrap";

const EditGroupModal = ({ open, handleClose, handleSuccess, editData }) => {
  const [state, setState] = React.useState({
    isSubmitting: false,
  });

  const initialValues = {
    group_name: editData?.group_name,
  };

  const handleSubmit = async (values) => {
    setState({ ...state, isSubmitting: true });

    if (values.group_name == editData?.group_name) {
      setState({ ...state, isSubmitting: false, isNameSame: true });

      toast.success("Group edited successfully");

      handleSuccess();

      return;
    }

    const response = await GroupApis.editGroup({
      group_name: values.group_name,
      group_id: editData?.id,
    });

    if (!response?.success) {
      setState({ ...state, isSubmitting: false, groups: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    toast.success("Group edit successfully");

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

  useEffect(() => {
    formik.setFieldValue("group_name", editData?.group_name);
  }, [editData]);

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
            Edit Group
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
              defaultValue={editData?.group_name}
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
            {state.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EditGroupModal;
