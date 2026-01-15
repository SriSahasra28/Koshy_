import * as React from "react";
import { styled } from "@mui/material/styles";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view/TreeItem";
import { GroupApis } from "../../../api/groups.apis";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useState } from "react";
import { SimpleTreeView } from "@mui/x-tree-view";
import { useDispatch } from "react-redux";
import { headerActions } from "../../../redux/features/header.slice";
import { Button, Modal } from "react-bootstrap";

const ITEMS = [
  {
    id: "1",
    label: "Main",
    children: [
      {
        id: "3",
        label: "Subtree with children",
        children: [
          { id: "6", label: "Hello" },
          {
            id: "7",
            label: "Sub-subtree with children",
          },
          { id: "8", label: "Hello" },
        ],
      },
    ],
  },
];

const CustomTreeItem = styled(TreeItem)({
  [`& .${treeItemClasses.iconContainer}`]: {
    "& .close": {
      opacity: 0.3,
    },
  },
});

export default function GroupsTree() {
  const dispatch = useDispatch();
  const [state, setState] = useState({
    isLoading: false,
    groupsTree: [],
  });
  const [symbolModalState, setSymbolModalState] = useState({
    open: false,
    selected_symbol: null,
    deleting: false,
  });

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
            id: `${idS}${stock?.stockName}`,
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

  // const deleteSymbol = async () => {
  //   setSymbolModalState({
  //     ...symbolModalState,
  //     deleting: true,
  //   });
  //   const response = await GroupApis.disableSymbol({
  //     symbol: symbolModalState.selected_symbol,
  //   });

  //   console.log("response>>", response);

  //   if (!response?.success) {
  //     setState({ ...state, isLoading: false, groupsTree: [] });

  //     toast.error(
  //       response?.message ?? "Something went wrong while fetching groups!"
  //     );
  //     return;
  //   }

  //   toast.success("Symbol deleted successfully");

  //   getGroupsTree();
  //   setSymbolModalState({
  //     ...symbolModalState,
  //     open: false,
  //     selected_symbol: null,
  //     deleting: false,
  //   });
  // };
  const deleteSymbol = async (symbol) => {
    setSymbolModalState({
      ...symbolModalState,
      deleting: true,
    });
  
    const response = await GroupApis.disableSymbol({
      symbol: symbol,
    });
  
    console.log("response>>", response);
  
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
  
  const symbolSetHandler = (symbol) => {
    dispatch(headerActions.setSymbolValue({ symbol }));
    dispatch(headerActions.setGroupsSideBar());
  };

  // const onClickToggleSideBar = () => {
  //   dispatch(headerActions.setGroupsSideBar());
  // };

  useEffect(() => {
    getGroupsTree();
  }, []);

  const openModal = ({ symbol }) => {
    setSymbolModalState({
      open: true,
      selected_symbol: symbol,
      deleting: false,
    });
    // setCreateModalState({ ...createModalState, open: false });
  };

  const handleModalClose = () => {
    setSymbolModalState({
      open: false,
      selected_symbol: null,
      deleting: false,
    });
  };

  return (
    // <RichTreeView
    //   aria-label="customized"
    //   defaultExpandedItems={[""]}
    //   slots={{
    //     expandIcon: KeyboardArrowRightIcon,
    //     collapseIcon: ExpandMoreIcon,
    //     endIcon: CloseSquare,
    //     item: CustomTreeItem,
    //   }}
    //   sx={{ overflowX: "hidden", minHeight: 270, flexGrow: 1, maxWidth: 300 }}
    //   items={state?.groupsTree}
    // />

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
          <TreeItem itemId={groupTree?.id} label={groupTree?.label}>
            {groupTree?.children?.map((stock) => (
              <TreeItem itemId={stock?.id} label={stock?.label}>
                {stock?.children?.map((options) => (
                  <div key={options?.id} className="inner_option_container">
                    <div
                      className="symbol-label"
                      onClick={() => symbolSetHandler(options?.label)}
                    >
                      {options?.label}
                    </div>
                    <button
                        type="button"
                        className="btn delete-button"
                        onClick={() => deleteSymbol(options?.label)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    {/* <button
                      type="button"
                      className="btn delete-button"
                      onClick={() => {
                        // Call Delete 
                        openModal({
                          symbol: options?.label,
                        });
                      }}
                    >
                      <i class="fa-solid fa-trash"></i>
                    </button> */}
                  </div>
                ))}
              </TreeItem>
            ))}
          </TreeItem>
        ))}

        {/* <TreeItem itemId="pickers" label="Date and Time Pickers">
        <TreeItem itemId="pickers-community" label="@mui/x-date-pickers" />
        <TreeItem itemId="pickers-pro" label="@mui/x-date-pickers-pro" />
      </TreeItem> */}
      </SimpleTreeView>
    </>
  );
}
