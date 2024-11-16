// // src/schemas/admin/category.schema.ts
// import { z } from 'zod';
// import { isCuid } from '@paralleldrive/cuid2';

// export const createCategorySchema = z.object({
//   body: z.object({
//     name: z
//       .string()
//       .min(2, 'Category name must be at least 2 characters')
//       .max(100, 'Category name is too long'),
//     code: z
//       .string()
//       .min(2, 'Category code must be at least 2 characters')
//       .max(50, 'Category code is too long')
//       .regex(/^[A-Z0-9_]+$/, 'Category code must be uppercase letters, numbers and underscores only'),
//     description: z
//       .string()
//       .max(255, 'Description is too long')
//       .optional(),
//     icon: z
//       .string()
//       .url('Icon must be a valid URL')
//       .optional(),
//   })
// });

// export const updateCategorySchema = z.object({
//   params: z.object({
//     id: z
//       .string({
//         required_error: 'Category ID is required',
//         invalid_type_error: 'Category ID must be a string'
//       })
//       .min(1, 'Category ID is required')
//       .refine(isCuid, {
//         message: 'Invalid category ID format'
//       })
//   }),
//   body: z.object({
//     name: z
//       .string()
//       .min(2, 'Category name must be at least 2 characters')
//       .max(100, 'Category name is too long')
//       .optional(),
//     description: z
//       .string()
//       .max(255, 'Description is too long')
//       .optional(),
//     icon: z
//       .string()
//       .url('Icon must be a valid URL')
//       .optional(),
//     isEnabled: z
//       .boolean()
//       .optional(),
//     status: z
//       .enum(['active', 'inactive'])
//       .optional(),
//   })
// });



// src/schemas/admin/category.schema.ts
import { z } from 'zod';

export const listCategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    isEnabled: z.string().optional().transform(val => val === 'true'),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'code', 'displayOrder', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    code: z.string()
      .min(2, 'Code must be at least 2 characters')
      .max(50, 'Code cannot exceed 50 characters')
      .regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers and underscores'),
    description: z.string().max(255).optional(),
    displayOrder: z.number().min(0).optional()
  })
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required')
  }),
  body: z.object({
    name: z.string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .optional(),
    description: z.string().max(255).optional(),
    displayOrder: z.number().min(0).optional(),
    isEnabled: z.boolean().optional()
  })
});

export const updateDisplayOrderSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required')
  }),
  body: z.object({
    displayOrder: z.number().min(0, 'Display order must be a positive number')
  })
});

export const listCategoryProductsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required')
  }),
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
  })
});
