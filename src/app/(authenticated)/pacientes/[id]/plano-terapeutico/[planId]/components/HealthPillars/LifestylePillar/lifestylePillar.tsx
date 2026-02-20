'use client'

import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import LoadingComponent from '@/components/atoms/Loading/loading'
import { RestrictedButton } from '@/components/atoms/RestrictedButton/restrictedButton'
import { ActivityModal } from '@/components/organisms/Modals/ActivityModal/activityModal'
import { CaloricIntakeGoalModal } from '@/components/organisms/Modals/CaloricIntakeGoalModal/caloricIntakeGoalModal'
import { CategoryModal } from '@/components/organisms/Modals/CategoryModal/categoryModal'
import { NutritionalRecommendationModal } from '@/components/organisms/Modals/NutritionalRecommendationModal/nutritionalRecommendationModal'
import { OrientationModal } from '@/components/organisms/Modals/OrientationModal/orientationModal'
import { WeightGoalModal } from '@/components/organisms/Modals/WeightGoalModal/weightGoalModal'
import { useActivitiesByPillar } from '@/hooks/queries/useHealthPillarActivities'
import {
  useLifestyleCategories,
  useCreateLifestyleCategory,
} from '@/hooks/queries/useHealthPillarLifestyleCategories'
import { useMenusByPillar } from '@/hooks/queries/useHealthPillarMenu'
import { useOrientationsByPillar } from '@/hooks/queries/useHealthPillarOrientations'
import { useTherapeuticPlanPermissions } from '@/hooks/useTherapeuticPlanPermissions'
import useUser from '@/hooks/useUser'
import {
  LifestyleCategoryEntity,
  ActivityEntity,
  OrientationEntity,
  MenuEntity,
} from '@/types/entities/healthPillar'

import { ActivityCard } from '../ActivityCard/activityCard'
import { CategoryCard } from '../CategoryCard/categoryCard'
import { MenuCard } from '../MenuCard/menuCard'
import { OrientationCard } from '../OrientationCard/orientationCard'

interface LifestylePillarProps {
  patientId: string
  planId: string
  pillarId: string
}

const ACTIVITY_NAMES = {
  WEIGHING: 'Atividade de pesagem',
  EXERCISE: 'Recomendação de exercício',
  STEPS_GOAL: 'Meta de passos',
  CALORIE_EXPENDITURE_GOAL: 'Meta de gasto calórico',
} as const

export function LifestylePillar({
  patientId,
  planId,
  pillarId,
}: LifestylePillarProps) {
  const router = useRouter()
  const { currentUser } = useUser()
  const { permissions } = useTherapeuticPlanPermissions(planId, patientId)
  const { data: categories = [], isLoading: categoriesLoading } =
    useLifestyleCategories(patientId, planId, pillarId)
  const { mutateAsync: createCategory } = useCreateLifestyleCategory()
  const { data: allActivities = [] } = useActivitiesByPillar(
    patientId,
    planId,
    pillarId,
  )
  const { data: allOrientations = [] } = useOrientationsByPillar(
    patientId,
    planId,
    pillarId,
  )
  const { data: allMenus = [] } = useMenusByPillar(patientId, planId, pillarId)

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] =
    useState<LifestyleCategoryEntity | null>(null)
  const [weightGoalModalOpen, setWeightGoalModalOpen] = useState(false)
  const [caloricIntakeGoalModalOpen, setCaloricIntakeGoalModalOpen] =
    useState(false)
  const [
    nutritionalRecommendationModalOpen,
    setNutritionalRecommendationModalOpen,
  ] = useState(false)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityEntity | null>(null)
  const [orientationModalOpen, setOrientationModalOpen] = useState(false)
  const [selectedOrientation, setSelectedOrientation] =
    useState<OrientationEntity | null>(null)
  const [
    selectedNutritionalRecommendation,
    setSelectedNutritionalRecommendation,
  ] = useState<OrientationEntity | null>(null)
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>('')
  const [defaultActivityName, setDefaultActivityName] = useState<string>('')
  const [defaultArea, setDefaultArea] = useState<string>('')
  const [defaultCategoryType, setDefaultCategoryType] = useState<string>('')

  // Verificações de unicidade
  const hydrationCategory = categories.find((c) => c.type === 'Hidratação')
  const weightCategory = categories.find((c) => c.type === 'Peso')
  const nutritionCategory = categories.find((c) => c.type === 'Alimentação')
  // Filtrar atividade de pesagem por goalId da categoria de peso (não por nome)
  const weightActivities = weightCategory
    ? allActivities.filter((a) => a.goalId === weightCategory.id)
    : []
  const weightActivity = weightActivities.find(
    (a) => a.name === ACTIVITY_NAMES.WEIGHING,
  )
  const stepsGoalCategory = categories.find(
    (c) => c.type === 'Movimentos - Passos',
  )
  const calorieExpenditureGoalCategory = categories.find(
    (c) => c.type === 'Movimentos - Gasto Calórico',
  )

  // Filtrar atividades de recomendação de exercício (todas que têm o nome correto)
  const exerciseRecommendations = allActivities.filter(
    (a) => a.name === ACTIVITY_NAMES.EXERCISE,
  )
  const generalOrientations = allOrientations.filter(
    (o) => o.area !== 'Alimentação',
  )
  const nutritionOrientations = allOrientations.filter(
    (o) => o.area === 'Alimentação' && !o.tags?.includes('cardápio'),
  )
  // Cardápios agora vêm da subcoleção "menu"
  const menuRecommendations = allMenus

  const handleCreateCategory = async (type: 'Hidratação' | 'Peso') => {
    if (type === 'Peso') {
      // Usar modal especializado de peso
      setSelectedCategory(weightCategory || null)
      setWeightGoalModalOpen(true)
      return
    }

    const existingCategory = categories.find((c) => c.type === type)
    if (existingCategory) {
      setSelectedCategory(existingCategory)
      setCategoryModalOpen(true)
      return
    }

    try {
      const newCategory = await createCategory({
        patientId,
        planId,
        pillarId,
        data: {
          type,
          status: 'Ativa',
          doctorId: currentUser?.id || '',
        },
      })
      setSelectedCategory(newCategory)
      setCategoryModalOpen(true)
    } catch (error) {
      console.error(`Erro ao criar categoria ${type}:`, error)
    }
  }

  const handleAddWeightActivity = () => {
    if (weightActivity) {
      setSelectedActivity(weightActivity)
      setActivityModalOpen(true)
      return
    }
    setDefaultCategoryId(weightCategory?.id || '')
    setDefaultActivityName(ACTIVITY_NAMES.WEIGHING)
    setSelectedActivity(null)
    setActivityModalOpen(true)
  }
  const handleAddStepsGoal = () => {
    if (stepsGoalCategory) {
      setSelectedCategory(stepsGoalCategory)
      setCategoryModalOpen(true)
      return
    }
    // Criar nova categoria de passos
    setSelectedCategory(null)
    setDefaultCategoryType('Movimentos - Passos')
    setCategoryModalOpen(true)
  }

  const handleAddCalorieExpenditureGoal = () => {
    if (calorieExpenditureGoalCategory) {
      setSelectedCategory(calorieExpenditureGoalCategory)
      setCategoryModalOpen(true)
      return
    }
    // Criar nova categoria de gasto calórico
    setSelectedCategory(null)
    setDefaultCategoryType('Movimentos - Gasto Calórico')
    setCategoryModalOpen(true)
  }

  const handleAddCaloricIntakeGoal = () => {
    setSelectedCategory(nutritionCategory || null)
    setCaloricIntakeGoalModalOpen(true)
  }

  const handleAddNutritionalRecommendation = () => {
    // Verificar se já existe uma recomendação nutricional
    if (nutritionOrientations.length > 0) {
      return
    }
    setSelectedNutritionalRecommendation(null)
    setNutritionalRecommendationModalOpen(true)
  }

  const handleAddMenuRecommendation = () => {
    router.push(
      `/pacientes/${patientId}/plano-terapeutico/${planId}/cardapio/new`,
    )
  }

  const handleEditMenuRecommendation = (menu: MenuEntity) => {
    router.push(
      `/pacientes/${patientId}/plano-terapeutico/${planId}/cardapio/${menu.id}`,
    )
  }

  const handleAddExercise = async () => {
    // Usar uma categoria existente ou criar "Movimentos - Passos" se nenhuma existir
    if (!stepsGoalCategory && !calorieExpenditureGoalCategory) {
      // Criar categoria de passos automaticamente
      try {
        await createCategory({
          patientId,
          planId,
          pillarId,
          data: {
            type: 'Movimentos - Passos',
            status: 'Ativa',
            doctorId: currentUser?.id || '',
          },
        })
        // Aguardar um momento para a query atualizar
        setTimeout(() => {
          router.push(
            `/pacientes/${patientId}/plano-terapeutico/${planId}/exercicio/new`,
          )
        }, 500)
        return
      } catch (error) {
        console.error('Erro ao criar categoria de passos:', error)
        return
      }
    }

    router.push(
      `/pacientes/${patientId}/plano-terapeutico/${planId}/exercicio/new`,
    )
  }

  const handleEditExercise = (activity: ActivityEntity) => {
    router.push(
      `/pacientes/${patientId}/plano-terapeutico/${planId}/exercicio/${activity.id}`,
    )
  }

  const handleAddOrientation = (area?: string) => {
    setDefaultArea(area || '')
    setSelectedOrientation(null)
    setOrientationModalOpen(true)
  }

  if (categoriesLoading) {
    return <LoadingComponent />
  }

  const categoriesForModals = categories.map((category) => ({
    id: category.id,
    pillarId: category.pillarId,
    name: category.type,
    type: undefined,
    status: category.status,
    doctorId: category.doctorId,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }))

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-primary-700">
            Orientações
          </h3>
          <p className="text-sm text-gray-600">
            Disponibilize recomendações e instruções personalizadas para o
            cuidado contínuo do paciente
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {generalOrientations.map((orientation) => {
            return (
              <OrientationCard
                key={orientation.id}
                orientation={orientation}
                goal={null}
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                goalId={orientation.goalId}
                onEdit={(o) => {
                  setSelectedOrientation(o)
                  setOrientationModalOpen(true)
                }}
                hasEditPermission={permissions.canCreateOrientation(
                  'Estilo de Vida',
                )}
                editTooltip={permissions.getTooltip('Estilo de Vida')}
              />
            )
          })}
          <RestrictedButton
            onClick={() => handleAddOrientation()}
            hasPermission={
              permissions.canCreateOrientation('Estilo de Vida') ||
              permissions.canCreateOrientation('Estilo de Vida', undefined)
            }
            tooltipMessage={permissions.getTooltip('Estilo de Vida')}
            className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
          >
            <AddOutlinedIcon fontSize="large" />
            <span className="text-sm font-medium">Adicionar</span>
          </RestrictedButton>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-primary-700">
            Hidratação
          </h3>
          <p className="text-sm text-gray-600">
            Defina uma meta de ingestão diária de água
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hydrationCategory ? (
            <CategoryCard
              category={hydrationCategory}
              patientId={patientId}
              planId={planId}
              pillarId={pillarId}
              onEdit={(c) => {
                setSelectedCategory(c)
                setCategoryModalOpen(true)
              }}
              hasEditPermission={permissions.canCreateCategory('Hidratação')}
              editTooltip={permissions.getTooltip('Hidratação')}
            />
          ) : (
            <RestrictedButton
              onClick={() => handleCreateCategory('Hidratação')}
              hasPermission={permissions.canCreateCategory('Hidratação')}
              tooltipMessage={permissions.getTooltip('Hidratação')}
              className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
            >
              <AddOutlinedIcon fontSize="large" />
              <span className="text-sm font-medium">Adicionar meta</span>
            </RestrictedButton>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-primary-700">Peso</h3>
          <p className="text-sm text-gray-600">
            Estabeleça uma meta de gestão de peso e crie uma atividade para
            acompanhar os registros de pesagens do paciente
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {weightCategory ? (
            <CategoryCard
              key={weightCategory.id}
              category={weightCategory}
              patientId={patientId}
              planId={planId}
              pillarId={pillarId}
              onEdit={(c) => {
                setSelectedCategory(c)
                setWeightGoalModalOpen(true)
              }}
              hasEditPermission={permissions.canCreateCategory('Peso')}
              editTooltip={permissions.getTooltip('Peso')}
            />
          ) : (
            <RestrictedButton
              onClick={() => handleCreateCategory('Peso')}
              hasPermission={permissions.canCreateCategory('Peso')}
              tooltipMessage={permissions.getTooltip('Peso')}
              className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
            >
              <AddOutlinedIcon fontSize="large" />
              <span className="text-sm font-medium">
                Adicionar meta de peso
              </span>
            </RestrictedButton>
          )}
          {weightActivities.map((activity) => {
            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                goal={null}
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                goalId={activity.goalId}
                onEdit={(a) => {
                  setSelectedActivity(a)
                  setActivityModalOpen(true)
                }}
                hasEditPermission={permissions.canCreateCategory('Peso')}
                editTooltip={permissions.getTooltip('Peso')}
              />
            )
          })}
          {!weightActivity && (
            <Button
              onClick={handleAddWeightActivity}
              disabled={!weightCategory}
              className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AddOutlinedIcon fontSize="large" />
              <span className="w-32 text-center text-xs font-medium">
                Adicionar atividade <br /> de pesagem
              </span>
            </Button>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-primary-700">
            Movimentos
          </h3>
          <p className="text-sm text-gray-600">
            Crie metas de gasto calórico e passos diários ou recomendações de
            exercícios físicos
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stepsGoalCategory ? (
            <CategoryCard
              category={stepsGoalCategory}
              patientId={patientId}
              planId={planId}
              pillarId={pillarId}
              onEdit={(c) => {
                setSelectedCategory(c)
                setCategoryModalOpen(true)
              }}
              hasEditPermission={permissions.canCreateCategory(
                'Movimentos - Passos',
              )}
              editTooltip={permissions.getTooltip('Movimentos - Passos')}
            />
          ) : (
            <RestrictedButton
              onClick={handleAddStepsGoal}
              hasPermission={permissions.canCreateCategory(
                'Movimentos - Passos',
              )}
              tooltipMessage={permissions.getTooltip('Movimentos - Passos')}
              className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
            >
              <AddOutlinedIcon fontSize="large" />
              <span className="w-32 text-center text-xs font-medium">
                Adicionar meta <br /> de passos
              </span>
            </RestrictedButton>
          )}
          {calorieExpenditureGoalCategory ? (
            <CategoryCard
              category={calorieExpenditureGoalCategory}
              patientId={patientId}
              planId={planId}
              pillarId={pillarId}
              onEdit={(c) => {
                setSelectedCategory(c)
                setCategoryModalOpen(true)
              }}
              hasEditPermission={permissions.canCreateCategory(
                'Movimentos - Gasto Calórico',
              )}
              editTooltip={permissions.getTooltip(
                'Movimentos - Gasto Calórico',
              )}
            />
          ) : (
            <RestrictedButton
              onClick={handleAddCalorieExpenditureGoal}
              hasPermission={permissions.canCreateCategory(
                'Movimentos - Gasto Calórico',
              )}
              tooltipMessage={permissions.getTooltip(
                'Movimentos - Gasto Calórico',
              )}
              className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
            >
              <AddOutlinedIcon fontSize="large" />
              <span className="w-32 text-center text-xs font-medium">
                Adicionar meta <br /> de gasto calórico
              </span>
            </RestrictedButton>
          )}
          {exerciseRecommendations.map((activity) => {
            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                goal={null}
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                goalId={activity.goalId}
                onEdit={(a) => {
                  handleEditExercise(a)
                }}
                hasEditPermission={permissions.canEditExercise()}
                editTooltip={permissions.getTooltip('Movimentos - Passos')}
              />
            )
          })}
          <RestrictedButton
            onClick={handleAddExercise}
            hasPermission={permissions.canEditExercise()}
            tooltipMessage={permissions.getTooltip('Movimentos - Passos')}
            className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
          >
            <AddOutlinedIcon fontSize="large" />
            <span className="w-32 text-center text-xs font-medium">
              Adicionar recomendação <br /> de exercício
            </span>
          </RestrictedButton>
        </div>
      </section>
      <section>
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-primary-700">
            Alimentação
          </h3>
          <p className="text-sm text-gray-600">
            Configure uma meta de consumo calórico e monte cardápios
            personalizados
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nutritionCategory ? (
            <CategoryCard
              category={nutritionCategory}
              patientId={patientId}
              planId={planId}
              pillarId={pillarId}
              onEdit={(c) => {
                setSelectedCategory(c)
                setCaloricIntakeGoalModalOpen(true)
              }}
              hasEditPermission={permissions.canCreateCategory('Alimentação')}
              editTooltip={permissions.getTooltip('Alimentação')}
            />
          ) : (
            <RestrictedButton
              onClick={handleAddCaloricIntakeGoal}
              hasPermission={permissions.canCreateCategory('Alimentação')}
              tooltipMessage={permissions.getTooltip('Alimentação')}
              className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
            >
              <AddOutlinedIcon fontSize="large" />
              <span className="w-32 text-center text-xs font-medium">
                Adicionar meta <br /> de consumo calórico
              </span>
            </RestrictedButton>
          )}
          {nutritionOrientations.map((orientation) => {
            return (
              <OrientationCard
                key={orientation.id}
                orientation={orientation}
                goal={null}
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                goalId={orientation.goalId}
                onEdit={(o) => {
                  setSelectedNutritionalRecommendation(o)
                  setNutritionalRecommendationModalOpen(true)
                }}
                hasEditPermission={permissions.canCreateOrientation(
                  'Estilo de Vida',
                  'Alimentação',
                )}
                editTooltip={permissions.getTooltip('Alimentação')}
              />
            )
          })}
          {menuRecommendations.map((menu) => {
            return (
              <MenuCard
                key={menu.id}
                menu={menu}
                patientId={patientId}
                planId={planId}
                pillarId={pillarId}
                onEdit={(m) => {
                  handleEditMenuRecommendation(m)
                }}
                hasEditPermission={permissions.canEditMenu()}
                editTooltip={permissions.getTooltip('Alimentação')}
              />
            )
          })}
          {nutritionOrientations.length === 0 && (
            <RestrictedButton
              onClick={handleAddNutritionalRecommendation}
              hasPermission={permissions.canCreateOrientation(
                'Estilo de Vida',
                'Alimentação',
              )}
              tooltipMessage={permissions.getTooltip('Alimentação')}
              className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
            >
              <AddOutlinedIcon fontSize="large" />
              <span className="w-32 text-center text-xs font-medium">
                Adicionar recomendação <br /> nutricional
              </span>
            </RestrictedButton>
          )}
          {menuRecommendations.length === 0 && (
            <RestrictedButton
              onClick={handleAddMenuRecommendation}
              hasPermission={permissions.canEditMenu()}
              tooltipMessage={permissions.getTooltip('Alimentação')}
              className="flex min-h-[150px] w-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50 p-6 text-purple-600 transition-colors hover:border-purple-400 hover:bg-purple-100"
            >
              <AddOutlinedIcon fontSize="large" />
              <span className="w-32 text-center text-xs font-medium">
                Adicionar recomendação <br /> de cardápio
              </span>
            </RestrictedButton>
          )}
        </div>
      </section>

      <ActivityModal
        isOpen={activityModalOpen}
        setIsOpen={setActivityModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        pillarType="Estilo de Vida"
        goals={categoriesForModals}
        activity={selectedActivity}
        defaultGoalId={defaultCategoryId}
        defaultActivityName={defaultActivityName}
        onSuccess={() => {
          setSelectedActivity(null)
          setDefaultCategoryId('')
          setDefaultActivityName('')
        }}
      />

      <OrientationModal
        isOpen={orientationModalOpen}
        setIsOpen={setOrientationModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        pillarType="Estilo de Vida"
        goals={categoriesForModals}
        orientation={selectedOrientation}
        defaultGoalId=""
        defaultArea={defaultArea}
        onSuccess={() => {
          setSelectedOrientation(null)
          setDefaultArea('')
        }}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        setIsOpen={setCategoryModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        category={selectedCategory}
        defaultCategoryType={defaultCategoryType}
        onSuccess={() => {
          setSelectedCategory(null)
          setDefaultCategoryType('')
        }}
      />

      <WeightGoalModal
        isOpen={weightGoalModalOpen}
        setIsOpen={setWeightGoalModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        category={selectedCategory}
        onSuccess={() => {
          setSelectedCategory(null)
        }}
      />

      <CaloricIntakeGoalModal
        isOpen={caloricIntakeGoalModalOpen}
        setIsOpen={setCaloricIntakeGoalModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        category={selectedCategory}
        onSuccess={() => {
          setSelectedCategory(null)
        }}
      />

      <NutritionalRecommendationModal
        isOpen={nutritionalRecommendationModalOpen}
        setIsOpen={setNutritionalRecommendationModalOpen}
        patientId={patientId}
        planId={planId}
        pillarId={pillarId}
        orientation={selectedNutritionalRecommendation}
        onSuccess={() => {
          setSelectedNutritionalRecommendation(null)
        }}
      />
    </div>
  )
}
