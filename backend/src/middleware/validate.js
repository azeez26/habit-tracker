import appError from '../utils/appError.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join('. ');
      return next(new appError(errorMessage, 400));
    }
    req.body = value;
    next();
  };
};
