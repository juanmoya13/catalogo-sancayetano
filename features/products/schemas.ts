import { z } from "zod";

export const productIdSchema = z.string().uuid("El producto seleccionado no es válido.");

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(160, "El nombre no puede superar los 160 caracteres."),
  categoryId: z.string().uuid("Seleccioná una categoría válida."),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,10}(?:\.\d{1,2})?$/, "Ingresá un precio con hasta dos decimales.")
    .refine((value) => Number(value) > 0, "El precio debe ser mayor que cero."),
  saleUnit: z.enum(["unit", "kg"], { error: "Seleccioná una unidad de venta válida." }),
  isActive: z.enum(["true", "false"], { error: "Seleccioná un estado válido." }).transform((value) => value === "true"),
});

export type ProductFormValues = z.input<typeof productSchema>;