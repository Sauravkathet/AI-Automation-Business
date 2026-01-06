import Joi from 'joi';

export const emailSchema = Joi.string().email().required();
export const passwordSchema = Joi.string().min(8).required();

export const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  organizationName: Joi.string().min(2).max(100).required(),
});

export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
});

export const workflowSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  naturalLanguage: Joi.string().max(1000).optional(),
  trigger: Joi.object({
    type: Joi.string().valid('webhook', 'schedule', 'manual').required(),
    config: Joi.object().required(),
  }).required(),
  conditions: Joi.array().items(
    Joi.object({
      field: Joi.string().required(),
      operator: Joi.string().valid('contains', 'equals', 'matches_intent', 'greater_than', 'less_than').required(),
      value: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      aiIntent: Joi.string().optional(),
      confidence: Joi.number().min(0).max(1).optional(),
    })
  ).optional(),
  actions: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('email', 'webhook', 'notification', 'log').required(),
      config: Joi.object().required(),
      order: Joi.number().integer().min(1).required(),
    })
  ).required(),
});

export const validateRequest = (schema: Joi.Schema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    return { valid: false, errors };
  }
  return { valid: true, value };
};