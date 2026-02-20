import { z } from 'zod'

export const goalSchema = z.object({
  type: z.enum(['Qualidade de Sono', 'Estresse', 'Humor', 'Outros']).optional(),
  name: z.string().optional(),
  customTitle: z.string().optional(),
  desiredParameter: z.string().optional(),
  status: z.enum(['Ativa', 'Atingida', 'Desativada'], {
    required_error: 'O status é obrigatório',
  }),
  aiGenerated: z.boolean().optional(),
  aiGeneratedAt: z.date().optional(),
  aiModel: z.string().optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
})

export const activitySchema = z.object({
  name: z
    .string()
    .min(1, 'O nome da atividade é obrigatório')
    .min(2, 'O nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  frequency: z.string().optional(),
  endDate: z.date().optional(),
  status: z.enum(['Ativa', 'Desativada', 'Realizada'], {
    required_error: 'O status é obrigatório',
  }),
  // Campos específicos para atividades de biomarcadores
  frequencyValue: z.string().optional(),
  frequencyUnit: z.string().optional(),
  deadlineValue: z.string().optional(),
  deadlineUnit: z.string().optional(),
  // Campos de IA
  aiGenerated: z.boolean().optional(),
  aiGeneratedAt: z.date().optional(),
  aiModel: z.string().optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
})

export const orientationSchema = z.object({
  title: z
    .string()
    .min(1, 'O título é obrigatório')
    .min(2, 'O título deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  supportMaterial: z.string().optional(),
  status: z.enum(['Ativa', 'Desativada'], {
    required_error: 'O status é obrigatório',
  }),
  // Campos de IA
  aiGenerated: z.boolean().optional(),
  aiGeneratedAt: z.date().optional(),
  aiModel: z.string().optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
})

export const trackSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome da trilha é obrigatório')
    .min(2, 'O nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  observations: z.string().optional(),
  status: z.enum(['Finalizado', 'Em progresso', 'Não iniciado']).optional(),
  goalIds: z.array(z.string()).optional(),
  activitySelect: z.string().optional(),
})

export const trainingPrescriptionSchema = z.object({
  title: z
    .string()
    .min(1, 'O título é obrigatório')
    .min(2, 'O título deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  order: z.number().optional(),
})

export const exerciseRecommendationSchema = activitySchema.extend({
  modality: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  intensity: z.string().optional(),
  frequencyValue: z.string().optional(),
  frequencyUnit: z.string().optional(),
  patientGuidelines: z.string().optional(),
  distanceKm: z.number().positive().optional(),
})

export const lifestyleCategorySchema = z.object({
  type: z.enum([
    'Hidratação',
    'Peso',
    'Movimentos - Passos',
    'Movimentos - Gasto Calórico',
    'Alimentação',
  ]),
  desiredParameter: z.number().optional(),
  status: z.enum(['Ativa', 'Atingida', 'Desativada'], {
    required_error: 'O status é obrigatório',
  }),
  aiGenerated: z.boolean().optional(),
  aiGeneratedAt: z.date().optional(),
  aiModel: z.string().optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
})

// Schemas para cardápio
export const foodItemSchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, 'O nome do alimento é obrigatório')
    .min(2, 'O nome deve ter pelo menos 2 caracteres'),
  portion: z
    .number()
    .positive('A porção deve ser um número positivo')
    .min(0.1, 'A porção deve ser maior que zero'),
  portionUnit: z.enum(['g', 'ml'], {
    required_error: 'A unidade da porção é obrigatória',
  }),
  kcal: z.string().min(1, 'As calorias são obrigatórias'),
})

export const mealEntrySchema = z.object({
  id: z.string(),
  dayOfWeek: z.string().min(1, 'O dia da semana é obrigatório'),
  mealType: z
    .string()
    .min(1, 'O tipo de refeição é obrigatório')
    .min(2, 'O tipo de refeição deve ter pelo menos 2 caracteres'),
  foods: z.array(foodItemSchema).min(1, 'Adicione pelo menos um alimento'),
})

export const menuDataSchema = z.object({
  meals: z.array(mealEntrySchema),
})

export const menuRecommendationSchema = orientationSchema.extend({
  menuData: menuDataSchema.optional(),
  tags: z.array(z.string()).optional(),
})

export type GoalFormData = z.infer<typeof goalSchema>
export type ActivityFormData = z.infer<typeof activitySchema>
export type OrientationFormData = z.infer<typeof orientationSchema>
export type TrackFormData = z.infer<typeof trackSchema>
export type TrainingPrescriptionFormData = z.infer<
  typeof trainingPrescriptionSchema
>
export type ExerciseRecommendationFormData = z.infer<
  typeof exerciseRecommendationSchema
>
export type LifestyleCategoryFormData = z.infer<typeof lifestyleCategorySchema>
export type FoodItemFormData = z.infer<typeof foodItemSchema>
export type MealEntryFormData = z.infer<typeof mealEntrySchema>
export type MenuDataFormData = z.infer<typeof menuDataSchema>
export type MenuRecommendationFormData = z.infer<
  typeof menuRecommendationSchema
>
