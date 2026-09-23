import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('8h'),
  X_API_KEY: Joi.string().min(16).required(),
  UPLOAD_MAX_SIZE_MB: Joi.number().integer().min(1).default(5),
  UPLOAD_ALLOWED_TYPES: Joi.string().required(),
  WEATHER_API_URL: Joi.string().uri().required(),
  WEATHER_GEOCODING_URL: Joi.string().uri().required(),
  WEATHER_TIMEOUT_MS: Joi.number().integer().min(1000).default(5000),
});