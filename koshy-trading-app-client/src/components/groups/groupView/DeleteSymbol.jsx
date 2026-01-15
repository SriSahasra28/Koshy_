import { CircularProgress } from "@mui/material";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { GroupApis } from "../../../api/groups.apis";

const DeleteSymbol = ({ group_id, symbol_id, handleSuccess }) => {
  const [state, setState] = useState({
    isLoading: false,
  });

  const DeleteSymbol = async () => {
    setState({ ...state, isLoading: true });

    const response = await GroupApis.deleteSymbol({
      group_id,
      symbol_id,
    });

    if (!response?.success) {
      setState({ ...state, isSubmitting: false, groups: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    toast.success("Symbol delete successfully");

    setState({ ...state, isLoading: false });

    handleSuccess();
  };
  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm symbol_delete_btn"
      onClick={DeleteSymbol}
    >
      {state?.isLoading ? (
        <CircularProgress style={{ color: "gray", width: 18, height: 18 }} />
      ) : (
        <i className="fas fa-times"></i>
      )}
    </button>
  );
};

export default DeleteSymbol;
