// Pure Todo domain types + Zod schemas. No I/O, no framework imports — this is @todo/domain.
import { z } from 'zod';

export type TodoStatus = 'active' | 'completed';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

export const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.union([z.string(), z.number()]),
  updatedAt: z.union([z.string(), z.number()]),
});

export const createTodoSchema = z.object({
  title: z.string().trim().min(1),
});

export const updateTodoSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
});
