import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
  parentId: z
    .union([z.literal(""), z.string().uuid("Seleccioná una categoría válida.")])
    .transform((value) => value || null),
  sortOrder: z
    .string()
    .trim()
    .regex(/^-?\d+$/, "El orden debe ser un número entero.")
    .transform(Number)
    .pipe(z.number().int().safe("El orden está fuera del rango permitido.")),
});

export const categoryIdSchema = z.string().uuid("La categoría seleccionada no es válida.");