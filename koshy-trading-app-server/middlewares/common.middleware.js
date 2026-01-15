const Joi = require("joi");
const { pick } = require("../utils.common");

const validator = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ["params", "query", "body"]);

  const object = pick(req, Object.keys(validSchema));

  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: "key" }, abortEarly: false })
    .validate(object);

  if (error) {
    const errorMessage = error.details
      .map((details) => details.message.replace(/"/g, ""))
      .join(", ");
    return res.status(400).json({
      message: errorMessage,
      status: 0,
    });
  }
  Object.assign(req, value);
  return next();
};

module.exports = { validator };
