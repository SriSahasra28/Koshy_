import React from "react";
import { useState } from "react";
import toast from "react-hot-toast";
import { GroupApis } from "../../../api/groups.apis";

let searchTimeout = null;

const AddStockSearch = ({ group_id, handleSuccess }) => {
  const [state, setState] = useState({
    isLoading: false,
    selectData: "",
    dropDown: false,
    isLoadingSearch: false,
    groupSymbols: [],
    ceOption: true,
    peOption: true,
  });

  const dropDownHandler = () => {
    let bg_container = document.getElementById("drop_down_bg_container_id");
    let drop_down = document.getElementById("drop_down_container_id");

    if (drop_down.classList.contains("display_none")) {
      drop_down.classList.remove("display_none");
      bg_container.classList.remove("display_none");
    } else {
      drop_down.classList.add("display_none");
      bg_container.classList.add("display_none");
    }
  };

  const getSymbols = async (search) => {
    setState({ ...state, isLoading: true });
    const response = await GroupApis.getSymbolsSearch({ search });

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
      groupSymbols: response.data,
    });
  };

  const onChangeHandler = (e) => {
    let input_value = e.target.value;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
      getSymbols(input_value);
    }, 300);
  };

  const onClickSelectHandler = (select) => {
    setState({
      ...state,
      dropDown: false,
      selectData: select,
      groupSymbols: [],
    });
    dropDownHandler();
  };
  const onClickCancle = () => {
    setState({
      ...state,
      selectData: "",
    });
  };

  const onClickCEhandler = () => {
    setState({
      ...state,
      ceOption: !state?.ceOption,
    });
  };

  const onClickPEhandler = () => {
    setState({
      ...state,
      peOption: !state?.peOption,
    });
  };

  const onClickAdd = async () => {
    if (state?.selectData) {
      setState({ ...state, isSubmitting: true });

      let optionTypes = [];

      if (state?.ceOption) {
        optionTypes.push("CE");
      }

      if (state?.peOption) {
        optionTypes.push("PE");
      }

      const response = await GroupApis.addSymbol({
        group_id,
        option_types: optionTypes,
        symbol: state?.selectData,
      });

      if (!response?.success) {
        setState({ ...state, isSubmitting: false, groups: [] });

        toast.error(
          response?.message ?? "Something went wrong while fetching groups!"
        );
        return;
      }

      toast.success("Symbol added successfully");

      setState({ ...state, isSubmitting: false, selectData: "" });

      handleSuccess();
    } else {
      toast.error("Please select symbol");
    }
  };

  const onClickCloseDropDown = () => {
    dropDownHandler();
  };

  const onFocushandler = () => {
    dropDownHandler();
    getSymbols("");
  };

  return (
    <>
      <div
        className="drop_down_bg_container display_none"
        onClick={onClickCloseDropDown}
        id="drop_down_bg_container_id"
      ></div>

      <div className="col-md-6 input_container">
        <div className="add_stock_search_container">
          {state?.selectData ? (
            <div className="selected_contain">
              <p>{state?.selectData}</p>
              <i class="fa-regular fa-circle-xmark" onClick={onClickCancle}></i>
            </div>
          ) : (
            <div className="input-group mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Stock Name"
                onFocus={onFocushandler}
                onChange={onChangeHandler}
              />
              <button className="btn btn-outline-secondary" type="button">
                <i className="fas fa-search"></i>
              </button>
            </div>
          )}

          <div
            className={`drop_down_container display_none`}
            id="drop_down_container_id"
          >
            {state.isLoading ? (
              <p className="not_fount_data">Loading ...</p>
            ) : state?.groupSymbols?.length == 0 ? (
              <p className="not_fount_data">Search data not found</p>
            ) : (
              <div className="drop_down_contain">
                {state?.groupSymbols.map((symbol, idx) => (
                  <p
                    key={idx}
                    onClick={() => onClickSelectHandler(symbol?.tradingsymbol)}
                  >
                    {symbol?.tradingsymbol}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 d-flex align-items-center">
          <div className="form-check mr-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="ceCheckbox"
              // defaultChecked
              checked={state?.ceOption}
              onClick={onClickCEhandler}
            />
            <label className="form-check-label" for="ceCheckbox">
              CE
            </label>
          </div>
          <div className="form-check mr-3" style={{ marginLeft: 10 }}>
            <input
              type="checkbox"
              className="form-check-input"
              id="peCheckbox"
              // defaultChecked
              checked={state?.peOption}
              onClick={onClickPEhandler}
            />
            <label className="form-check-label" for="peCheckbox">
              PE
            </label>
          </div>
        </div>

        <button type="button" className="btn btn-primary" onClick={onClickAdd}>
          {state.isLoading ? (
            "Loading..."
          ) : (
            <>
              <i className="fas fa-plus"></i> Add
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default AddStockSearch;
