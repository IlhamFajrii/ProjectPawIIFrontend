import { get, set, type FieldValues, type Resolver } from 'react-hook-form';
import type { z } from 'zod';

/** Jembatan Zod ke React Hook Form: error pertama per field dipasang pada path-nya. */
export function zodResolver<Input extends FieldValues, Output>(
  schema: z.ZodType<Output, Input>,
): Resolver<Input, unknown, Output> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data as Output & FieldValues, errors: {} };

    const errors: Record<string, unknown> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') || 'root';
      if (!get(errors, path)) set(errors, path, { type: issue.code, message: issue.message });
    }
    return { values: {}, errors } as Awaited<ReturnType<Resolver<Input, unknown, Output>>>;
  };
}
