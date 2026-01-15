class APIError extends Error {
  code;
  status;
  error;

  constructor({ status, message, code, data }) {
    super(message);

    this.name = this.constructor.name;
    this.status = status;
    this.error = data;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  // descriptive error code
  let errorCode;

  if (err.status === 400) errorCode = "BAD_REQUEST";
  if (err?.code) errorCode = err.code;

  // log error only if unexpected
  if (!err?.status || `${err.status}`.startsWith("5")) console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message,
    error: err?.error || err?.errors?.[0] || err?.name || null,
    response_code: errorCode || "UNIDENTIFIED_ERROR",
  });

  next();
};

module.exports = { errorHandler, APIError };
