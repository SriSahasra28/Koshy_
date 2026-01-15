import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  menuModal: false,
  groupModal: false,
  headerModal: "",
  symbolValue: "",
  groupsSideBar: false,
  chartZoomIn: false,
  minOptionValue: 1,
  markersValues:{},
  lrcValues:{},
  stochValues:{}
};

export const headerSlice = createSlice({
  name: "headerSlice",
  initialState,
  reducers: {
    setMenuModal: (state, action) => {
      state.menuModal = !state?.menuModal;
    },

    setMarkersValue:(state,action)=>{
      state.markersValues=action.payload;
    },

    setLRCValue:(state,action)=>{
      state.lrcValues=action.payload;
    },
    // --------
    setStochValue:(state,action)=>{
      state.stochValues=action.payload;
    },
    // ----------
    setGroupModal: (state, action) => {
      state.groupModal = !state?.groupModal;
    },

    setHeaderModal: (state, action) => {
      state.headerModal = action.payload.type;
    },
    setSymbolValue: (state, action) => {
      state.symbolValue = action?.payload?.symbol;
    },

    setGroupsSideBar: (state) => {
      state.groupsSideBar = !state?.groupsSideBar;
    },

    setChartZoomIn: (state) => {
      state.chartZoomIn = !state?.chartZoomIn;
    },

    setMinOptionValue: (state, action) => {
      state.minOptionValue = action?.payload?.value;
    },

  },
});

export const headerActions = headerSlice.actions;

export const headerReducer = headerSlice.reducer;
