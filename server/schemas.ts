import { z } from 'zod';

/** Reusable "trimmed, optional-if-empty" string field. */
const text = (max: number, message: string) =>
  z
    .string({ error: message })
    .trim()
    .min(1, { message: 'This field cannot be empty.' })
    .max(max, { message: `Keep it under ${max} characters.` });

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));

const email = z
  .string({ error: 'Please provide your email.' })
  .trim()
  .min(1, { message: 'Please provide your email.' })
  .max(120)
  .email({ message: 'That email address looks invalid.' })
  .toLowerCase();

export const MESSAGES = 'messages';
export const QUOTES = 'quotes';

/* ------------------------------ public forms ----------------------------- */

export const contactSchema = z.object({
  name: text(80, 'Please provide your name.'),
  email,
  phone: optionalText(40),
  subject: optionalText(150),
  message: text(2000, 'Please tell us a little more.')
});

export const quoteSchema = z.object({
  name: text(80, 'Please provide your name.'),
  company: optionalText(100),
  email,
  phone: optionalText(40),
  service: optionalText(80),
  origin: optionalText(120),
  destination: optionalText(120),
  weight: optionalText(40),
  note: optionalText(1000)
});

/* ------------------------------ admin: shipments ------------------------- */

export const VALID_MODES = ['Air', 'Sea', 'Road'] as const;
export const modeSchema = z.enum(VALID_MODES, { error: 'Mode must be Air, Sea or Road.' });

export const createShipmentSchema = z.object({
  customer: text(120, 'Please provide the customer name.'),
  customer_email: z.union([email, z.literal('')]).optional(),
  cargo: text(200, 'Please describe the cargo.'),
  origin: text(120, 'Please provide the origin.'),
  destination: text(120, 'Please provide the destination.'),
  weight: text(40, 'Please provide the weight.'),
  mode: modeSchema
});

/** PATCH — every field optional, but at least one must be present. */
export const updateShipmentSchema = z
  .object({
    customer: text(120, 'Please provide the customer name.').optional(),
    customer_email: z.union([email, z.literal('')]).optional(),
    cargo: text(200, 'Please describe the cargo.').optional(),
    origin: text(120, 'Please provide the origin.').optional(),
    destination: text(120, 'Please provide the destination.').optional(),
    weight: text(40, 'Please provide the weight.').optional(),
    mode: modeSchema.optional(),
    eta: z.union([text(60, 'Keep the ETA short.'), z.literal('')]).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nothing to update.'
  });

export const addEventSchema = z.object({
  status: text(40, 'Please choose a status.'),
  location: text(120, 'Please provide the location.'),
  note: optionalText(500),
  eta: optionalText(60)
});

export const trackingParamsSchema = z.object({
  trackingId: z.string().trim().min(1).max(40)
});

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be numeric.').transform(Number)
});

/* --------------------------- validation helper --------------------------- */

/**
 * Parses `req.body` against a schema. On failure throws a 400 AppError
 * carrying the per-field messages (so callers don't repeat the shape).
 * Returns the validated (trimmed, typed) data.
 */
import { ValidationError } from './utils/errors.js';

export function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || 'body';
      if (!fields[key]) fields[key] = issue.message;
    }
    throw new ValidationError('Validation failed.', fields);
  }
  return result.data;
}
