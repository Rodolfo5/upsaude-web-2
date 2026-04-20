'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus as AddOutlinedIcon } from 'lucide-react'
import { ArrowLeft as ArrowBackOutlinedIcon } from 'lucide-react'
import { X as CloseIcon } from 'lucide-react'
import { Trash2 as DeleteOutlinedIcon } from 'lucide-react'
import { Pencil as EditOutlinedIcon } from 'lucide-react'
import { ChevronUp as ExpandLessIcon } from 'lucide-react'
import { ChevronDown as ExpandMoreIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/atoms/Button/button'
import Input from '@/components/atoms/Input/input'
import { Label } from '@/components/atoms/Label/label'
import InputField from '@/components/molecules/InputField/inputField'
import TextareaField from '@/components/molecules/TextareaField/textareaField'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DAYS_OF_WEEK,
  PORTION_UNITS,
  SUGGESTED_MEAL_TYPES,
} from '@/constants/menuRecommendation'
import {
  useCreateMenu,
  useMenu,
  useUpdateMenu,
} from '@/hooks/queries/useHealthPillarMenu'
import { useHealthPillar } from '@/hooks/queries/useHealthPillars'
import { useTherapeuticPlanPermissions } from '@/hooks/useTherapeuticPlanPermissions'
import useUser from '@/hooks/useUser'
import {
  FoodItem,
  MealEntry,
  MenuData,
  MenuEntity,
} from '@/types/entities/healthPillar'
import {
  MenuRecommendationFormData,
  menuRecommendationSchema,
} from '@/validations/healthPillar'

interface Props {
  params: Promise<{
    id: string
    planId: string
    orientationId: string
  }>
}

export default function MenuRecommendationPage({ params }: Props) {
  const { id: patientId, planId, orientationId } = use(params)
  const router = useRouter()
  const { currentUser } = useUser()
  const { permissions, isLoading: isLoadingPermissions } =
    useTherapeuticPlanPermissions(planId, patientId)

  const isNewOrientation = orientationId === 'new'

  // Verificar permissão para editar cardápio
  const canEdit = permissions.canEditMenu()

  // Redirecionar se não tiver permissão
  useEffect(() => {
    if (!canEdit && !isLoadingPermissions) {
      router.push(
        `/pacientes/${patientId}/plano-terapeutico/${planId}?tab=pilares`,
      )
    }
  }, [canEdit, isLoadingPermissions, router, patientId, planId])

  // Buscar pilar de Estilo de Vida
  const { data: lifestylePillar } = useHealthPillar(
    patientId,
    planId,
    'Estilo de Vida',
  )
  const pillarId = lifestylePillar?.id || ''

  const { data: existingMenu } = useMenu(
    patientId,
    planId,
    pillarId,
    orientationId,
  )

  const { mutateAsync: createMenu, isPending: isCreating } = useCreateMenu()
  const { mutateAsync: updateMenu, isPending: isUpdating } = useUpdateMenu()

  const [localMeals, setLocalMeals] = useState<MealEntry[]>([])
  const [selectedDay, setSelectedDay] = useState<string>('Segunda')
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())
  const [expandedMealForm, setExpandedMealForm] = useState<string | null>(null)

  const { control, handleSubmit, reset } = useForm<MenuRecommendationFormData>({
    resolver: zodResolver(menuRecommendationSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'Ativa',
    },
  })

  const [, setInlineMealForm] = useState<{
    mealId: string | null
    mealType: string
    dayOfWeek: string
  }>({
    mealId: null,
    mealType: '',
    dayOfWeek: 'Segunda',
  })

  const [inlineFoodForm, setInlineFoodForm] = useState<{
    name: string
    portion: number | ''
    portionUnit: 'g' | 'ml'
    kcal: string
  }>({
    name: '',
    portion: '',
    portionUnit: 'g',
    kcal: '',
  })

  const [editingInlineFoodId, setEditingInlineFoodId] = useState<string | null>(
    null,
  )

  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false)
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([])

  useEffect(() => {
    if (existingMenu && !isNewOrientation && pillarId) {
      reset({
        title: existingMenu.title,
        description: existingMenu.description || '',
        status: existingMenu.status || 'Ativa',
      })

      if (existingMenu.menuData?.meals) {
        setLocalMeals(existingMenu.menuData.meals)
      }
    } else if (isNewOrientation) {
      reset({
        title: '',
        description: '',
        status: 'Ativa',
      })
      setLocalMeals([])
    }
  }, [existingMenu, isNewOrientation, reset, pillarId])

  const onSubmit = async (data: MenuRecommendationFormData) => {
    if (!pillarId) {
      console.error('Pilar não encontrado')
      return
    }

    try {
      const menuData: MenuData = {
        meals: localMeals,
      }

      const menuEntityData: Partial<MenuEntity> = {
        title: data.title,
        description: data.description,
        status: data.status,
        tags: ['cardápio', 'alimentação'],
        menuData,
        doctorId: currentUser?.id || '',
      }

      if (isNewOrientation) {
        await createMenu({
          patientId,
          planId,
          pillarId,
          data: menuEntityData,
        })
        router.push(
          `/pacientes/${patientId}/plano-terapeutico/${planId}#alimentacao`,
        )
      } else {
        await updateMenu({
          patientId,
          planId,
          pillarId,
          menuId: orientationId,
          data: menuEntityData,
        })
        router.push(
          `/pacientes/${patientId}/plano-terapeutico/${planId}#alimentacao`,
        )
      }
    } catch (error) {
      console.error('Erro ao salvar cardápio:', error)
    }
  }

  const handleAddMeal = () => {
    setSelectedMealTypes([])
    setIsAddMealModalOpen(true)
  }

  const handleSaveSelectedMeals = () => {
    if (selectedMealTypes.length === 0) {
      alert('Selecione pelo menos uma refeição')
      return
    }

    // Verificar refeições já existentes no dia para evitar duplicatas
    const mealsForDay = localMeals.filter(
      (meal) => meal.dayOfWeek === selectedDay,
    )
    const existingMealTypes = mealsForDay.map((m) => m.mealType)

    const newMeals: MealEntry[] = selectedMealTypes
      .filter((mealType) => !existingMealTypes.includes(mealType))
      .map((mealType) => ({
        id: crypto.randomUUID(),
        dayOfWeek: selectedDay,
        mealType,
        foods: [],
      }))

    if (newMeals.length === 0) {
      alert('Todas as refeições selecionadas já existem para este dia')
      setIsAddMealModalOpen(false)
      return
    }

    setLocalMeals((prev) => [...prev, ...newMeals])
    // Expandir as refeições recém-adicionadas
    setExpandedMeals((prev) => {
      const newSet = new Set(prev)
      newMeals.forEach((meal) => newSet.add(meal.id))
      return newSet
    })
    setIsAddMealModalOpen(false)
    setSelectedMealTypes([])
  }

  const handleEditMeal = (meal: MealEntry) => {
    setExpandedMealForm(meal.id)
    setInlineMealForm({
      mealId: meal.id,
      mealType: meal.mealType,
      dayOfWeek: meal.dayOfWeek,
    })
    setInlineFoodForm({
      name: '',
      portion: '',
      portionUnit: 'g',
      kcal: '',
    })
    setEditingInlineFoodId(null)
    setExpandedMeals((prev) => new Set(prev).add(meal.id))
  }

  const handleCloseMealForm = () => {
    const currentMeal = localMeals.find((m) => m.id === expandedMealForm)
    if (
      currentMeal &&
      currentMeal.foods.length === 0 &&
      !currentMeal.mealType
    ) {
      setLocalMeals((prev) => prev.filter((m) => m.id !== expandedMealForm))
    }
    setExpandedMealForm(null)
    setInlineMealForm({
      mealId: null,
      mealType: '',
      dayOfWeek: 'Segunda',
    })
    setInlineFoodForm({
      name: '',
      portion: '',
      portionUnit: 'g',
      kcal: '',
    })
    setEditingInlineFoodId(null)
  }

  const handleSaveMealForm = () => {
    if (!expandedMealForm) return

    const currentMeal = localMeals.find((m) => m.id === expandedMealForm)
    if (!currentMeal) return

    // O tipo de refeição já está definido quando a refeição é criada via modal
    // Esta função agora apenas fecha o formulário
    handleCloseMealForm()
  }

  const handleDeleteMeal = (mealId: string) => {
    if (confirm('Tem certeza que deseja excluir esta refeição?')) {
      setLocalMeals((prev) => prev.filter((m) => m.id !== mealId))
    }
  }

  const handleAddInlineFood = () => {
    if (!expandedMealForm) return

    if (
      !inlineFoodForm.name ||
      inlineFoodForm.portion === '' ||
      !inlineFoodForm.kcal
    ) {
      alert('Preencha todos os campos do alimento')
      return
    }

    const newFood: FoodItem = {
      id: crypto.randomUUID(),
      name: inlineFoodForm.name,
      portion: Number(inlineFoodForm.portion),
      portionUnit: inlineFoodForm.portionUnit,
      kcal: inlineFoodForm.kcal,
    }

    setLocalMeals((prev) =>
      prev.map((meal) =>
        meal.id === expandedMealForm
          ? {
              ...meal,
              foods: [...meal.foods, newFood],
            }
          : meal,
      ),
    )

    setInlineFoodForm({
      name: '',
      portion: '',
      portionUnit: 'g',
      kcal: '',
    })
  }

  const handleUpdateInlineFood = () => {
    if (!expandedMealForm || !editingInlineFoodId) return

    if (
      !inlineFoodForm.name ||
      inlineFoodForm.portion === '' ||
      !inlineFoodForm.kcal
    ) {
      alert('Preencha todos os campos do alimento')
      return
    }

    setLocalMeals((prev) =>
      prev.map((meal) =>
        meal.id === expandedMealForm
          ? {
              ...meal,
              foods: meal.foods.map((food) =>
                food.id === editingInlineFoodId
                  ? {
                      ...food,
                      name: inlineFoodForm.name,
                      portion: Number(inlineFoodForm.portion),
                      portionUnit: inlineFoodForm.portionUnit,
                      kcal: inlineFoodForm.kcal,
                    }
                  : food,
              ),
            }
          : meal,
      ),
    )

    setEditingInlineFoodId(null)
    setInlineFoodForm({
      name: '',
      portion: '',
      portionUnit: 'g',
      kcal: '',
    })
  }

  const handleEditInlineFood = (food: FoodItem) => {
    setInlineFoodForm({
      name: food.name,
      portion: food.portion,
      portionUnit: food.portionUnit,
      kcal: food.kcal,
    })
    setEditingInlineFoodId(food.id)
  }

  const handleCancelEditInlineFood = () => {
    setEditingInlineFoodId(null)
    setInlineFoodForm({
      name: '',
      portion: '',
      portionUnit: 'g',
      kcal: '',
    })
  }

  const handleDeleteFood = (mealId: string, foodId: string) => {
    setLocalMeals((prev) =>
      prev.map((meal) =>
        meal.id === mealId
          ? {
              ...meal,
              foods: meal.foods.filter((f) => f.id !== foodId),
            }
          : meal,
      ),
    )
  }

  const toggleMealExpansion = (mealId: string) => {
    setExpandedMeals((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(mealId)) {
        newSet.delete(mealId)
      } else {
        newSet.add(mealId)
      }
      return newSet
    })
  }

  const handleBack = () => {
    router.push(
      `/pacientes/${patientId}/plano-terapeutico/${planId}#alimentacao`,
    )
  }

  const mealsForSelectedDay = localMeals.filter(
    (meal) => meal.dayOfWeek === selectedDay,
  )

  if (!pillarId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto w-[90%]">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="text-gray-700 hover:text-gray-900"
          >
            <ArrowBackOutlinedIcon />
          </Button>
          <h1 className="text-2xl font-semibold text-primary-700">
            {isNewOrientation ? 'Configurar cardápio' : 'Editar cardápio'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <InputField
                name="title"
                control={control}
                label="Título"
                placeholder="Ex: Cardápio saudável"
              />

              <TextareaField
                name="description"
                control={control}
                label="Orientações ao paciente"
                placeholder="Digite as orientações ao paciente..."
                rows={4}
              />
            </div>
          </div>

          {/* Seção de Refeições */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary-700">
                Refeições
              </h3>
              <Button
                type="button"
                variant="link"
                onClick={handleAddMeal}
                className="text-purple-600 hover:text-purple-800"
              >
                <AddOutlinedIcon fontSize="small" />
                Adicionar refeição
              </Button>
            </div>

            {/* Tabs de dias da semana */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setSelectedDay(day.value)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedDay === day.value
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {/* Lista de refeições do dia selecionado */}
            <div className="space-y-2">
              {mealsForSelectedDay.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  Nenhuma refeição adicionada para este dia
                </p>
              ) : (
                mealsForSelectedDay.map((meal) => {
                  const isExpanded = expandedMeals.has(meal.id)
                  const totalKcal = meal.foods.reduce(
                    (sum, food) => sum + parseFloat(food.kcal || '0'),
                    0,
                  )

                  return (
                    <div
                      key={meal.id}
                      className="rounded-lg border border-gray-200 bg-white"
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleMealExpansion(meal.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {isExpanded ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </button>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {meal.mealType}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {meal.foods.length} alimento(s) • {totalKcal} kcal
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {expandedMealForm !== meal.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleEditMeal(meal)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              if (expandedMealForm === meal.id) {
                                handleCloseMealForm()
                              }
                              handleDeleteMeal(meal.id)
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4">
                          {/* Formulário inline para configurar alimentos */}
                          {expandedMealForm === meal.id ? (
                            <div className="space-y-4">
                              {/* Tipo de refeição (somente leitura) */}
                              <div>
                                <Label className="mb-2 block text-sm font-medium text-gray-700">
                                  Tipo de refeição
                                </Label>
                                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
                                  {meal.mealType || 'Não definido'}
                                </div>
                              </div>

                              {/* Lista de alimentos existentes */}
                              {meal.foods.length > 0 && (
                                <div className="space-y-2">
                                  <h5 className="text-sm font-medium text-gray-700">
                                    Alimentos
                                  </h5>
                                  <div className="space-y-2">
                                    {meal.foods.map((food) => (
                                      <div
                                        key={food.id}
                                        className="flex items-center justify-between rounded border border-gray-200 bg-white p-3"
                                      >
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">
                                            {food.name}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            {food.portion} {food.portionUnit} •{' '}
                                            {food.kcal} kcal
                                          </p>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                              handleEditInlineFood(food)
                                            }
                                            className="text-purple-600 hover:text-purple-800"
                                          >
                                            <EditOutlinedIcon fontSize="small" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                              handleDeleteFood(meal.id, food.id)
                                            }
                                            className="text-red-600 hover:text-red-800"
                                          >
                                            <CloseIcon fontSize="small" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Formulário para adicionar/editar alimento */}
                              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                <h5 className="mb-3 text-sm font-medium text-gray-700">
                                  {editingInlineFoodId
                                    ? 'Editar alimento'
                                    : 'Adicionar alimento'}
                                </h5>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                  <div>
                                    <Label className="mb-2 block text-xs font-medium text-gray-700">
                                      Alimento
                                    </Label>
                                    <Input
                                      value={inlineFoodForm.name}
                                      onChange={(e) =>
                                        setInlineFoodForm((prev) => ({
                                          ...prev,
                                          name: e.target.value,
                                        }))
                                      }
                                      placeholder="Nome do alimento"
                                      className="w-full text-black"
                                    />
                                  </div>
                                  <div>
                                    <Label className="mb-2 block text-xs font-medium text-gray-700">
                                      Porção
                                    </Label>
                                    <div className="flex gap-2">
                                      <Input
                                        type="number"
                                        value={inlineFoodForm.portion}
                                        onChange={(e) =>
                                          setInlineFoodForm((prev) => ({
                                            ...prev,
                                            portion:
                                              e.target.value === ''
                                                ? ''
                                                : parseFloat(e.target.value),
                                          }))
                                        }
                                        placeholder="Quantidade"
                                        className="flex-1 text-black"
                                        min="0"
                                        step="0.1"
                                      />
                                      <Select
                                        value={inlineFoodForm.portionUnit}
                                        onValueChange={(value) =>
                                          setInlineFoodForm((prev) => ({
                                            ...prev,
                                            portionUnit: value as 'g' | 'ml',
                                          }))
                                        }
                                      >
                                        <SelectTrigger className="flex-1 text-black">
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {PORTION_UNITS.map((unit) => (
                                            <SelectItem
                                              key={unit.value}
                                              value={unit.value}
                                            >
                                              {unit.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="mb-2 block text-xs font-medium text-gray-700">
                                      Kcal
                                    </Label>
                                    <Input
                                      value={inlineFoodForm.kcal}
                                      onChange={(e) =>
                                        setInlineFoodForm((prev) => ({
                                          ...prev,
                                          kcal: e.target.value,
                                        }))
                                      }
                                      placeholder="Ex: 120"
                                      className="w-full text-black"
                                    />
                                  </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                  {editingInlineFoodId && (
                                    <Button
                                      type="button"
                                      variant="link"
                                      onClick={handleCancelEditInlineFood}
                                    >
                                      Cancelar
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    onClick={
                                      editingInlineFoodId
                                        ? handleUpdateInlineFood
                                        : handleAddInlineFood
                                    }
                                  >
                                    {editingInlineFoodId
                                      ? 'Atualizar alimento'
                                      : 'Adicionar alimento'}
                                  </Button>
                                </div>
                              </div>

                              {/* Botões de ação do formulário */}
                              <div className="flex justify-end gap-2 border-t pt-4">
                                <Button
                                  type="button"
                                  variant="link"
                                  onClick={handleCloseMealForm}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleSaveMealForm}
                                >
                                  Salvar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* Visualização simples dos alimentos */
                            <div className="space-y-3">
                              {meal.foods.map((food) => (
                                <div
                                  key={food.id}
                                  className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-3"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                      {food.name}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {food.portion} {food.portionUnit} •{' '}
                                      {food.kcal} kcal
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="link"
                                onClick={() => handleEditMeal(meal)}
                                className="text-purple-600 hover:text-purple-800"
                              >
                                Configurar alimentos e porções
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={isCreating || isUpdating}
              disabled={isCreating || isUpdating}
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>

      {/* Modal de Adicionar Refeição */}
      <Dialog open={isAddMealModalOpen} onOpenChange={setIsAddMealModalOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#792EBD]">
              Adicionar refeição ao cardápio
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {SUGGESTED_MEAL_TYPES.map((mealType) => {
              const isChecked = selectedMealTypes.includes(mealType)
              const alreadyExists = mealsForSelectedDay.some(
                (m) => m.mealType === mealType,
              )

              return (
                <label
                  key={mealType}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    isChecked
                      ? 'border-purple-500 bg-purple-50'
                      : alreadyExists
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMealTypes([...selectedMealTypes, mealType])
                      } else {
                        setSelectedMealTypes(
                          selectedMealTypes.filter((t) => t !== mealType),
                        )
                      }
                    }}
                    disabled={alreadyExists}
                    className="bg- h-4 w-4 rounded border-gray-300 text-[#792EBD] focus:ring-purple-500"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      isChecked
                        ? 'font-medium text-purple-900'
                        : 'text-gray-700'
                    }`}
                  >
                    {mealType}
                  </span>
                  {alreadyExists && (
                    <span className="text-xs text-gray-500">Já adicionada</span>
                  )}
                </label>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="link" onClick={() => setIsAddMealModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSelectedMeals}
              disabled={selectedMealTypes.length === 0}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
