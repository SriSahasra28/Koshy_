import { CircularProgress } from "@mui/material";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { GroupApis } from "../api/groups.apis";
import "./styles/GroupView.scss";
import { useParams } from "react-router";
import AddStockSearch from "../components/groups/groupView/AddStockSearch";
import DeleteSymbol from "../components/groups/groupView/DeleteSymbol";
import { Link } from "react-router-dom";

const GroupView = () => {
  const [state, setState] = React.useState({
    isLoading: false,
    groups: [],
    isLoadingSymbols: false,
    groupSymbols: [],
  });
  const params = useParams();

  console.log("params>>", params);

  const getGroupById = async () => {
    const response = await GroupApis.getGroupById({
      group_id: params?.group_id,
    });

    if (!response?.success) {
      setState({ ...state, isLoading: false, groups: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    return response.data;
  };

  const getSymbolsInitial = async () => {
    const response = await GroupApis.getGroupSymbols({
      group_id: params?.group_id,
    });

    if (!response?.success) {
      setState({ ...state, isLoadingSymbols: false, groupSymbols: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    return response.data;
  };

  const getSymbols = async () => {
    setState({ ...state, isLoadingSymbols: true });
    const response = await GroupApis.getGroupSymbols({
      group_id: params?.group_id,
    });

    if (!response?.success) {
      setState({ ...state, isLoadingSymbols: false, groupSymbols: [] });

      toast.error(
        response?.message ?? "Something went wrong while fetching groups!"
      );
      return;
    }

    setState({
      ...state,
      isLoadingSymbols: false,
      groupSymbols: response.data,
    });
  };

  const handleCreateGroupSuccess = () => {
    getSymbols();
  };

  const getDataApi = async () => {
    setState({ ...state, isLoading: true });
    const res = await Promise.all([getGroupById(), getSymbolsInitial()]);
    setState({
      ...state,
      isLoading: false,
      groups: res[0],
      groupSymbols: res[1],
    });
  };

  useEffect(() => {
    getDataApi();
  }, []);

  return (
    <>
      {state?.isLoading ? (
        <div className="initial_loading">
          <CircularProgress style={{ color: "gray" }} />
          <p>Loading...</p>
        </div>
      ) : (
        <>
          {/* <div className="back_button">
            <i class="fa-solid fa-arrow-left"></i>
          </div> */}
          <div className="group_view_main_container">
            <div className="container">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <span>{state?.groups?.group_name}</span>
                  <div>
                    <Link to="/groups" className="btn btn-link">
                      <i class="fa-solid fa-arrow-left"></i> Back
                    </Link>
                    <Link to="/" className="btn btn-link">
                      <i class="fa-solid fa-house"></i> Home
                    </Link>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <AddStockSearch
                      group_id={params?.group_id}
                      handleSuccess={handleCreateGroupSuccess}
                    />

                    <div className="col-md-6">
                      {state?.isLoadingSymbols ? (
                        <div className="table_initial_loading">
                          <CircularProgress
                            style={{ color: "gray", width: 30, height: 30 }}
                          />
                          <p>Loading...</p>
                        </div>
                      ) : (
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Stock</th>
                              <th>Type</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {state?.groupSymbols.length === 0 ? (
                              <p className="table_data_not_found">
                                Data not found!
                              </p>
                            ) : (
                              state?.groupSymbols?.map((groupSymbol, idx) => (
                                <tr key={idx}>
                                  <td>{groupSymbol?.symbol}</td>
                                  <td>{groupSymbol?.option_type}</td>
                                  <td>
                                    <DeleteSymbol
                                      group_id={params?.group_id}
                                      symbol_id={groupSymbol?.id}
                                      handleSuccess={handleCreateGroupSuccess}
                                    />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GroupView;
