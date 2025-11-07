import { z } from 'zod';

// Post validation schemas
export const postContentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'O conteúdo não pode estar vazio')
    .max(5000, 'O conteúdo deve ter no máximo 5000 caracteres'),
  type: z.enum(['text', 'image', 'quiz']),
  theme: z.string().optional(),
  imageUrl: z.string().url().optional(),
  musicId: z.string().optional(),
  musicName: z.string().optional(),
});

// Quiz validation schema
export const quizSchema = z.object({
  question: z.string()
    .trim()
    .min(3, 'A pergunta deve ter no mínimo 3 caracteres')
    .max(500, 'A pergunta deve ter no máximo 500 caracteres'),
  options: z.array(z.string().trim().min(1).max(200))
    .min(2, 'Mínimo 2 opções')
    .max(4, 'Máximo 4 opções'),
});

// Comment validation schema
export const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'O comentário não pode estar vazio')
    .max(1000, 'O comentário deve ter no máximo 1000 caracteres'),
  postId: z.string().uuid('ID do post inválido'),
});

// Profile update validation schema
export const profileUpdateSchema = z.object({
  bio: z.string()
    .trim()
    .max(500, 'A bio deve ter no máximo 500 caracteres')
    .optional(),
  fullName: z.string()
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres')
    .optional(),
  username: z.string()
    .trim()
    .min(3, 'O nome de usuário deve ter no mínimo 3 caracteres')
    .max(30, 'O nome de usuário deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e underscore')
    .optional(),
});

// Bio mention validation
export const bioMentionSchema = z.object({
  username: z.string()
    .trim()
    .min(3, 'Nome de usuário muito curto')
    .max(30, 'Nome de usuário muito longo')
    .regex(/^[a-zA-Z0-9_]+$/, 'Nome de usuário inválido'),
});

// Focus donation validation
export const focusDonationSchema = z.object({
  postId: z.string().uuid('ID do post inválido'),
  recipientId: z.string().uuid('ID do destinatário inválido'),
  amount: z.number()
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade mínima é 1')
    .max(10, 'Quantidade máxima é 10'),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'Arquivo inválido' }),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
});

// Validate file upload
export function validateFileUpload(
  file: File,
  maxSize: number = 5 * 1024 * 1024,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${maxSize / (1024 * 1024)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Permitidos: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}
