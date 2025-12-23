import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../utils/logger';

export const validate = (schema: Joi.Schema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req[property], { 
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        res.status(400).json({ 
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      // Replace request data with validated and sanitized data
      req[property] = value;
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({ error: 'Validation failed' });
    }
  };
};