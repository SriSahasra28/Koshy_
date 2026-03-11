const Joi = require("joi");

class GroupValidations {
  static create = {
    body: Joi.object().keys({
      lots: Joi.number().required(),
      expiry: Joi.number().required(),
      profit_points: Joi.number().required(),
      stoploss_points: Joi.number().required(),
    }),
  };

  static getData = {
    query: Joi.object().keys({
      index_name: Joi.string().required(),
      time_period: Joi.string().allow("", null),
      interval: Joi.string().allow("", null),
    }),
  };

  static getPivotPoints = {
    query: Joi.object().keys({
      index_name: Joi.string().required(),
    }),
  };

  static save = {
    body: Joi.object().keys({
      lots: Joi.number().required(),
      expiry: Joi.number().required(),
      profit_points: Joi.number().required(),
      stoploss_points: Joi.number().required(),
    }),
  };
}

module.exports = { GroupValidations };
