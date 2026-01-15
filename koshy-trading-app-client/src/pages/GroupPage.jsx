import React, { useEffect } from "react";
import { GroupApis } from "../api/groups.apis";
import toast from "react-hot-toast";
import { Button, Form, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";

import "./styles/GroupsPage.scss";
import CreateGroupModal from "../components/groups/CreateGroupModal";
import EditGroupModal from "../components/groups/EditGroupModal";
import { CircularProgress } from "@mui/material";
import DeleteGroupButton from "../components/groups/DeleteGroupButton";

const GroupPage = () => {
  const [state, setState] = React.useState({
    isLoading: false,
    groups: [],
    isLoadingDelete: true,
  });

  const [createModalState, setCreateModalState] = React.useState({
    open: false,
  });

  const [editModalState, setEditModalState] = React.useState({
    open: false,
    editData: null,
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
      groups: response.data,
    });
  };

  useEffect(() => {
    getGroups();
  }, []);

  const handleCreateGroupSuccess = () => {
    setCreateModalState({ ...createModalState, open: false });
    getGroups();
  };

  const handleEditGroupSuccess = () => {
    setEditModalState({ ...createModalState, open: false });
    getGroups();
  };

  const handleCreateGroupModalClose = () => {
    setCreateModalState({ ...createModalState, open: false });
  };

  const openCreateGroupModal = () => {
    setCreateModalState({ ...createModalState, open: true });
  };

  const handleEditGroupModalClose = () => {
    setEditModalState({ ...editModalState, open: false });
  };

  const openEditGroupModal = (group) => {
    setEditModalState({ ...editModalState, open: true, editData: group });
  };

  const handleDeleteGroupSuccess = () => {
    getGroups();
  };

  return (
    <div className="groups-page">
      <CreateGroupModal
        handleClose={handleCreateGroupModalClose}
        handleSuccess={handleCreateGroupSuccess}
        open={createModalState.open}
      />

      <EditGroupModal
        handleClose={handleEditGroupModalClose}
        handleSuccess={handleEditGroupSuccess}
        open={editModalState?.open}
        editData={editModalState?.editData}
      />

      <div class="container">
        <div className="row justify-content-lg-center groups-page-content">
          <div className="page-header">
            <h1>Groups</h1>
            <div className="home_back_btn">
              <Link to="/" className="btn btn-link">
                <i class="fa-solid fa-house"></i> Home
              </Link>
            </div>
            <Button onClick={() => openCreateGroupModal()}>+ Add</Button>
          </div>

          <div className="groups-list">
            <div>{state.isLoading ? "Loading groups...." : null}</div>
            <div className="groups-list">
              {state.groups.map((group) => {
                return (
                  <div className="group-container" key={group?.id}>
                    <Link to={`/groups/${group?.id}`} className="group-name">
                      {group?.group_name}
                    </Link>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="btn "
                        onClick={() => openEditGroupModal(group)}
                      >
                        <i class="fa-solid fa-pen-to-square"></i>
                      </button>
                      <DeleteGroupButton
                        handleSuccess={handleDeleteGroupSuccess}
                        group_id={group?.id}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
