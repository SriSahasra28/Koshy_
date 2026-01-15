// import { SettingsApis } from "../api/setttings.apis";

export class CommonEnums {
  static buy_call = "buy_call";
  static buy_put = "buy_put";
  static sell_put = "sell_put";
  static sell_call = "sell_call";

  static accessToken = "";
  static fyresInstance = "";

  static getAccessToken = async () => {
    // const res = await SettingsApis.getAccessToken();
    // if (res.success) {
    //   this.accessToken = res.data?.access_token;
    //   // this.fyresInstance = fyersDataSocket.getInstance(
    //   //   this.accessToken,
    //   //   "./logs"
    //   // );
    //   return true;
    // }
  };

  static mouseEvents = {
    mouseup: "mouseup",
    mousedown: "mousedown",
  };

  static indicators = {
    linear_regression: "linear_regression",
    PSAR: "PSAR",
    MACD: "MACD",
    FastStochastics: "FastStochastics",
   
  };

  static expiry = {
    current: 0,
    next: 1,
  };

  static pivotPoints = {
    pivot_line: "Pivot Line",
    bottom_cpr: "Bottom Cpr",
    top_cpr: "Top Cpr",
    weekly_pivot: "Weekly Cpr",
    previous_day_high: "Previous Day High",
    previous_day_low: "Previous Day Low",

    pivot_line_key: "pivot_line",
    bottom_cpr_key: "bottom_cpr",
    top_cpr_key: "top_cpr",
    weekly_pivot_key: "weekly_pivot",
    previous_day_high_key: "previous_day_high",
    previous_day_low_key: "previous_day_low",
  };
}

export class EnvVariables {
  static tickerApiKey = process.env.REACT_APP_TICKER_API_KEY;
  static tickerAccessToken = process.env.REACT_APP_TICKER_ACCESS_TOKEN;
  static apiEndpoint = process.env.REACT_APP_API_ENDPOINT;
}

export class LocalStorageEnums {
   static access_token = "access_token";
}
