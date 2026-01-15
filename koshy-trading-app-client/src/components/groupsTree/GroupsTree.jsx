import * as React from "react";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { GroupApis } from "../../api/groups.apis";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useState } from "react";
import { SimpleTreeView } from "@mui/x-tree-view";
import { useDispatch } from "react-redux";
import { headerActions } from "../../redux/features/header.slice";
import { Button, Modal } from "react-bootstrap";
import { DataLoadingServices } from "../../utils/common.services";

//import { useSelector } from 'react-redux';

export default function GroupsTree() {
  const [state, setState] = useState({
    isLoading: false,
    groupsTree: [],
  });

  const [symbolModalState, setSymbolModalState] = useState({
    open: false,
    selected_symbol: null,
    deleting: false,
  });

  const dispatch = useDispatch();
  function CloseSquare(props) {
    return (
      <svg
        fill="#000000"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M7.8 10a2.2 2.2 0 0 0 4.4 0 2.2 2.2 0 0 0-4.4 0z" />
      </svg>
    );
  }

  const deleteSymbol = async (symbol) => {
    setSymbolModalState({
      ...symbolModalState,
      deleting: true,
    });

    const response = await GroupApis.disableSymbol({
      symbol: symbol,
    });

    //console.log("response>>", response);

    if (!response?.success) {
      setState({ ...state, isLoading: false, groupsTree: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    toast.success("Symbol deleted successfully");

    getGroupsTree();
    setSymbolModalState({
      ...symbolModalState,
      open: false,
      selected_symbol: null,
      deleting: false,
    });
  };

  const getGroupsTree = async () => {
    setState({ ...state, isLoading: true });
    const response = await GroupApis.getGroupsTree();

    //console.log("response>>", response);

    if (!response?.success) {
      setState({ ...state, isLoading: false, groupsTree: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    let treeData = response.data.map((mainData, idx) => {
      return {
        id: `${idx}${mainData?.groupName}`,
        label: mainData?.groupName,
        children: mainData?.stocks?.map((stock, idS) => {
          return {
            //id: `${idS}${stock?.stockName}`,
            id: `stock-${idx}-${idS}`,
            label: stock?.stockName,
            children: stock?.options.map((option, idO) => {
              return { id: `${idO}${option}`, label: option };
            }),
          };
        }),
      };
    });

    //console.log("treeData>>>", treeData);

    setState({
      ...state,
      isLoading: false,
      groupsTree: treeData,
    });
  };

  // const symbolSetHandler = (symbol) => {
  //   const currentTime = new Date();
  //   console.log('symbolSetHandler: ', currentTime.toISOString());
  //   dispatch(headerActions.setSymbolValue({ symbol }));
  // };

  const removePreviousActiveSymbols = () => {
    let activeSymbols = document.querySelectorAll(".selected-symbol");

    for (let i = 0; i < activeSymbols.length; i++) {
      const symbol = activeSymbols[i];
      if (!symbol) return;
      symbol.classList.remove("selected-symbol");
    }
  };

  const setSymbolAsActive = ({ symbol }) => {
    const symbolElement = document.querySelector(`.symbol-${symbol}`);
    if (!symbolElement) return;
    symbolElement.classList.add("selected-symbol");
  };

  const removeSelectedTreeItems = () => {
    let selectedItems = document.querySelectorAll(".Mui-selected");

    for (let i = 0; i < selectedItems.length; i++) {
      const treeItem = selectedItems[i];
      if (!treeItem) return;
      treeItem.classList.remove("Mui-selected");
    }
  };

  const symbolSetHandler = (symbol) => {
    const currentTime = new Date();
    const minutes = currentTime.getMinutes().toString().padStart(2, "0"); // Ensure two digits for minutes
    const seconds = currentTime.getSeconds().toString().padStart(2, "0"); // Ensure two digits for seconds
    console.log(`symbolSetHandler: ${minutes}:${seconds}`);

    removeSelectedTreeItems();
    removePreviousActiveSymbols();
    setSymbolAsActive({
      symbol,
    });
    dispatch(headerActions.setSymbolValue({ symbol }));

    DataLoadingServices.startLoadingForMainChart();
    DataLoadingServices.startLoadingForSecondaryChart();
    // DataLoadingServices.startLoadingForTable();
  };

  useEffect(() => {
    getGroupsTree();
  }, []);

  const handleModalClose = () => {
    setSymbolModalState({
      open: false,
      selected_symbol: null,
      deleting: false,
    });
  };

  // const openModal = ({ symbol }) => {
  //   setSymbolModalState({
  //     open: true,
  //     selected_symbol: symbol,
  //     deleting: false,
  //   });
  //   // setCreateModalState({ ...createModalState, open: false });
  // };

  return (
    <>
      <Modal
        show={symbolModalState.open}
        size="lg"
        className="groups-modal"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        onHide={handleModalClose}
      >
        <Modal.Header className="justify-content-between" closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
            Delete Symbol
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Are you sure you want to delete?</h5>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleModalClose} variant="secondary">
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={symbolModalState.deleting}
            onClick={() => {
              deleteSymbol();
            }}
          >
            {state.isSubmitting ? "Deleting..." : "Confirm"}
          </Button>
        </Modal.Footer>
      </Modal>

      <SimpleTreeView
        slots={{
          endIcon: CloseSquare,
        }}
      >
        {state?.groupsTree?.map((groupTree) => (
          <TreeItem
            key={groupTree?.id}
            itemId={groupTree?.id}
            label={groupTree?.label}
          >
            {groupTree?.children?.map((stock) => (
              <TreeItem key={stock?.id} itemId={stock?.id} label={stock?.label}>
                {stock?.children?.map((options) => (
                  <div
                    key={options?.id}
                    className={`inner_option_container symbol-${options?.label}`}
                    onClick={() => symbolSetHandler(options?.label)}
                  >
                    <div className="symbol-label">{options?.label}</div>
                    <button
                      type="button"
                      className="btn delete-button"
                      onClick={() => deleteSymbol(options?.label)}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                ))}
              </TreeItem>
            ))}
          </TreeItem>
        ))}
      </SimpleTreeView>

      {/* <SimpleTreeView
        slots={{
          endIcon: CloseSquare,
        }}
      >
        {state?.groupsTree?.map((groupTree) => (
          <TreeItem itemId={groupTree?.id} label={groupTree?.label}>
            {groupTree?.children?.map((stock) => (
              <TreeItem itemId={stock?.id} label={stock?.label}>
                {stock?.children?.map((options) => (
                  <div
                    key={options?.id}
                    className="inner_option_container"
                    onClick={() => symbolSetHandler(options?.label)}
                  >
                    <div className="symbol-label">{options?.label}</div>
                    <button
                      type="button"
                      className="btn delete-button"
                      onClick={() => deleteSymbol(options?.label)}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>

                  </div>
                ))}
              </TreeItem>
            ))}
          </TreeItem>
        ))}

      </SimpleTreeView> */}
    </>
  );
}
