export class HistoricalDataStateSelectors {
  static getHistoricalData = (state) => state.historical_data.data;
  static getState = (state) => state.historical_data;
  static getIndexName = (state) => state.historical_data.selected_index;
  static getSelectedInterval = (state) => state.historical_data.selected_interval;
  static getUpdatedHistoricalData = (state) =>
    state.historical_data.updated_historical_data;
}
