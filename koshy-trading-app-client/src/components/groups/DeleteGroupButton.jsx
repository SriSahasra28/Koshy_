import { CircularProgress } from "@mui/material";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { GroupApis } from "../../api/groups.apis";

const DeleteGroupButton = ({ handleSuccess, group_id }) => {
  const [state, setState] = useState({
    isLoading: false,
  });

  const DeleteGroup = async () => {
    setState({ ...state, isLoading: true });

    const response = await GroupApis.deleteGroup({
      group_id,
    });

    if (!response?.success) {
      setState({ ...state, isSubmitting: false, groups: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    toast.success("Group delete successfully");

    setState({ ...state, isLoading: false });

    handleSuccess();
  };

  return (
    <button className="delete_btn btn" onClick={() => DeleteGroup()}>
      {state?.isLoading ? (
        <CircularProgress style={{ color: "gray", width: 18, height: 18 }} />
      ) : (
        <i class="fa fa-trash"></i>
      )}
    </button>
  );
};

export default DeleteGroupButton;
