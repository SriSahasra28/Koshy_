class EnvVariables {
  static DATABASE = {
    HOST: "103.160.145.141",
    USER: "root",
    PASSWORD: "Airforce*123",
    DB: "algo",
    dialect: "mysql",
    PORT: "3306",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  };
}

class CommonEnums {
  static buy_call = "buy_call";
  static buy_put = "buy_put";
  static sell_put = "sell_put";
  static sell_call = "sell_call";

  static fyresAccessToken = "";

  static optionTypes = {
    call: "CE",
    put: "PE",
  };

  static transactionTypes = {
    call: "call",
    put: "put",
  };

  static indexName = {
    NIFTY50: "NIFTY50",
    NIFTY50_FOR_INSTRUMENTS: "NIFTY",

    NIFTYBANK: "NIFTYBANK",
    NIFTYBANK_FOR_INSTRUMENTS: "BANKNIFTY",
  };

  static setFyresAccesstoken = async ({ sequelize }) => {};

  static intervals = {
    one_min: 1,
    two_min: 2,
    three_min: 3,
    five_min: 5,
    ten_min: 10,
    fifteen_min: 15,
    thirty_min: 30,
    one_hour: 60,
    one_week: 10080,
    daily: 1440,
  };
}

module.exports = { EnvVariables, CommonEnums };
