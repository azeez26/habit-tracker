import Joi from 'joi';

export const createHabitSchema = Joi.object({
  name: Joi.string().trim().required(),
  goal_type: Joi.string().valid('duration', 'count').required(),
  goal_target: Joi.number().min(1).required(),
  days: Joi.array().items(Joi.number().min(0).max(6)).required(),
  time: Joi.string().allow(null).optional(),
});

export const updateHabitSchema = Joi.object({
  name: Joi.string().trim().optional(),
  goal_type: Joi.string().valid('duration', 'count').optional(),
  goal_target: Joi.number().min(1).optional(),
  days: Joi.array().items(Joi.number().min(0).max(6)).optional(),
  time: Joi.string().allow(null).optional(),
});

export const logHabitSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'Date must be YYYY-MM-DD format' }),
  status: Joi.string()
    .valid('done', 'missed')
    .required(),
  progress_value: Joi.number()
    .min(0)
    .optional()
    .messages({ 'number.min': 'Progress cannot be negative' })
});
