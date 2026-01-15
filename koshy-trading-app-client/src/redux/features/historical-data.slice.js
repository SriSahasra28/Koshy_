import { createSlice, current } from "@reduxjs/toolkit";
import { cloneDeep, forEach, includes } from "lodash";

const initialState = {
  data: [],
  updated_historical_data: [],
  pivot_points: [],
  selected_index: "NIFTYBANK",
  selected_interval: null,
};

export const historicalDataSlice = createSlice({
  name: "historicalDataSlice",
  initialState,
  reducers: {
    setData: (state, action) => {
      return {
        ...state,
        data: [...action.payload.data],
        pivot_points: [...action.payload.pivot_points],
      };
    },
    // setUpdatedHistoricalData: (state, action) => {
    //   const updatedData = [...action.payload?.updated_historical_data];

    //   const data = cloneDeep(current(state.data));

    //   let isAdded = false;

    //   updatedData.forEach((item, index) => {
    //     // const isExists = includes(data, item);

    //     // console.log("item >>>>", item, "isExists >>>>", isExists);
    //     // console.log("isExists >>>>", isExists);

    //     let _isExists = false;
    //     let indexToReplace = null;
    //     let lastIndex = null;

    //     data.forEach((oldRecord, _index) => {
    //       if (oldRecord?.timestamp == item?.timestamp) {
    //         // console.log("isExists >>>>", true);
    //         // data[_index] = item;

    //         _isExists = true;
    //         indexToReplace = _index;
    //       }

    //       lastIndex = index;
    //       // else data.push(item);
    //     });

    //     if (_isExists) {
    //       if (isAdded) {
    //         return;
    //       }
    //       // data[indexToReplace] = item;

    //       console.log("Updated >>>", item?.timestamp);
    //     } else {
    //       data.push(item);
    //       isAdded = true;

    //       // data[lastIndex] = item;

    //       console.log("New Added >>>", item?.timestamp);
    //     }
    //   });

    //   // isAdded = false;

    //   return {
    //     ...state,
    //     updated_historical_data: [...action.payload.updated_historical_data],
    //     pivot_points: [...action.payload.pivot_points],
    //     data: data,
    //   };
    // },
    // setIndex: (state, action) => {
    //   return {
    //     ...state,
    //     selected_index: action.payload?.index,
    //   };
    // },
    // setInterval: (state, action) => {
    //   return {
    //     ...state,
    //     selected_interval: action.payload?.interval,
    //   };
    // },
  },
});

export const historicalDataActions = historicalDataSlice.actions;

export const historicalDataReducer = historicalDataSlice.reducer;
