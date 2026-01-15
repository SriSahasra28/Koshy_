import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Moving Average Exponential
  ema: {
    length: 9,
  },
  superTrend: {
    mutltiplier: 10,
    period: 3,
  },
  pivotPoint: {},
  current_indicator_type: "",
  add_to_chart: false,
  indicator_values_modal: {
    open: false,
  },
};

export const indicatorsSlice = createSlice({
  name: "indicatorsSlice",
  initialState,
  reducers: {
    setValues: (state, action) => {
      return {
        ...state,
        ...action.payload.values,
      };
    },
    disableAddToChart: (state, action) => {
      return {
        ...state,
        add_to_chart: false,
      };
    },
  },
});

export const indicatorActions = indicatorsSlice.actions;

export const indicatorsReducer = indicatorsSlice.reducer;
