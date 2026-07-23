// Update todo — the validation boundary for partial updates. The raw input is parsed
// with the Zod schema before the repository persists ONLY the supplied fields.
// Under exactOptionalPropertyTypes, absent keys in the parsed object stay absent
// (Zod does not inject explicit undefined), so the repository's !== undefined
// guards correctly skip unsupplied fields.
import type { Database } from 'bun:sqlite';
import { type Todo, type UpdateTodoInput, updateTodoSchema } from '@todo/domain';
import { updateTodo } from './repository';

/** Validate the input, then update only the supplied fields of the todo. */
export function update(db: Database, id: string, input: UpdateTodoInput): Todo {
  // Zod infers optional fields as `T | undefined`, but UpdateTodoInput under
  // exactOptionalPropertyTypes omits explicit undefined. The parsed object is
  // runtime-valid (absent keys stay absent), so the cast bridges the type gap.
  const parsed = updateTodoSchema.parse(input) as UpdateTodoInput;
  return updateTodo(db, id, parsed);
}
