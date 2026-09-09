import Joi from "joi";
import { isValidTimezone } from "../utils/dateUtils.js";

export const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({ "string.min": "Name must be at least 2 characters" }),

  email: Joi.string().email().lowercase().required(),

  password: Joi.string()
    .min(6)
    .max(50)
    .required()
    .messages({ "string.min": "Password must be at least 6 characters" }),

  timezone: Joi.string()
    .custom((value, helpers) => {
      if (!isValidTimezone(value)) {
        return helpers.error("any.invalid");
      }

      return value;
    })
    .optional(),

  language: Joi.string().valid("ar", "en").optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  timezone: Joi.string().optional(),
  language: Joi.string().valid("ar", "en").optional(),
  morningMotivation: Joi.boolean().optional(),
});
