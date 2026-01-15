import { headerReducer } from "./header.slice";
//import { historicalDataReducer } from "./historical-data.slice";
import { indicatorsReducer } from "./indicators.slice";

export const rootReducer = {
 // indicators: indicatorsReducer,
  //historical_data: historicalDataReducer,
  header:headerReducer
};
