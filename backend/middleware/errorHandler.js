import appError from "../utils/appError.js"

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new appError(message, 400);
};

const handleDuplicatedFieldsDB = (err) => {
  const value = Object.values(err.keyValue)[0];
  const message = `Duplicated field value: ${value}. Please use another value!`;
  return new appError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new appError(message, 400);
};

// JWT handler
const handleJWTError = () =>
  new appError("Invalid token. Please log in again!", 401);
const handleJWTExpiredError = () =>
  new appError("Your token has expired! Please log in again.", 401);



const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Something went wrong";

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;

  if (error.name == "CastError") {
    error = handleCastErrorDB(error);
  }
  if (error.code == 11000) {
    error = handleDuplicatedFieldsDB(error);
  }
  if (error.name == "ValidationError") {
    error = handleValidationErrorDB(error);
  }
  if (error.name === "JsonWebTokenError") {
    error = handleJWTError();
  }
  if (error.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
  });
};


export default globalErrorHandler;