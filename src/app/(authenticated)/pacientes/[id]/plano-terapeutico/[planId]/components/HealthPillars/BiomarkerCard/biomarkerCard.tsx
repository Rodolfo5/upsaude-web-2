'use client'

import CheckIcon from '@mui/icons-material/Check'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FavoriteIcon from '@mui/icons-material/Favorite'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import { useEffect, useState } from 'react'

import { Button } from '@/components/atoms/Button/button'
import { Card } from '@/components/ui/card'
import { useUpdateBiomarker } from '@/hooks/queries/useBiomarkers'
import useUser from '@/hooks/useUser'
import { BiomarkerEntity, BiomarkerType } from '@/types/entities/biomarker'

interface BiomarkerCardProps {
  biomarker: BiomarkerEntity
  patientId: string
  planId: string
  pillarId: string
}

const getBiomarkerLabel = (type: BiomarkerType | string): string => {
  const map: Record<string, string> = {
    glicemia: 'Glicemia',
    bloodGlucose: 'Glicemia',
    pressao_arterial: 'Pressão Arterial',
    bloodPressure: 'Pressão Arterial',
    frequencia_cardiaca: 'Frequência Cardíaca',
    heartRate: 'Frequência Cardíaca',
    oximetria: 'Oximetria',
    oximetry: 'Oximetria',
    temperatura: 'Temperatura',
    temperature: 'Temperatura',
  }
  return map[type] || type
}

const getBiomarkerUnit = (type: BiomarkerType | string): string => {
  const units: Record<string, string> = {
    glicemia: 'mg/dL',
    bloodGlucose: 'mg/dL',
    pressao_arterial: 'mmHg',
    bloodPressure: 'mmHg',
    frequencia_cardiaca: 'bpm',
    heartRate: 'bpm',
    oximetria: '%',
    oximetry: '%',
    temperatura: '°C',
    temperature: '°C',
  }
  return units[type] || ''
}

const getBiomarkerIcon = (
  type: BiomarkerType | string,
  isApproved: boolean = false,
) => {
  const iconProps = {
    fontSize: 'small' as const,
    className: isApproved ? 'text-[#530570]' : 'text-gray-800',
  }
  switch (type) {
    case 'glicemia':
    case 'bloodGlucose':
      return <WaterDropIcon {...iconProps} />
    case 'pressao_arterial':
    case 'bloodPressure':
      return <MonitorHeartIcon {...iconProps} />
    case 'frequencia_cardiaca':
    case 'heartRate':
      return <FavoriteIcon {...iconProps} />
    case 'oximetry':
      return <LocalHospitalIcon {...iconProps} />
    case 'temperatura':
    case 'temperature':
      return <ThermostatIcon {...iconProps} />
    default:
      return null
  }
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return '-'
  }
}

export function BiomarkerCard({
  biomarker,
  patientId,
  planId,
  pillarId,
}: BiomarkerCardProps) {
  const { currentUser } = useUser()
  const { mutateAsync: updateBiomarker, isPending: isUpdatingBiomarker } =
    useUpdateBiomarker()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editMinValue, setEditMinValue] = useState<string>(
    biomarker.minValue ?? '',
  )
  const [editMaxValue, setEditMaxValue] = useState<string>(
    biomarker.maxValue ?? '',
  )

  useEffect(() => {
    setEditMinValue(biomarker.minValue ?? '')
    setEditMaxValue(biomarker.maxValue ?? '')
  }, [biomarker])

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      await updateBiomarker({
        patientId,
        planId,
        pillarId,
        biomarkerId: biomarker.id,
        data: {
          status: 'approved',
        },
      })
    } catch (error) {
      console.error('Erro ao aprovar biomarcador:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editMinValue || !editMaxValue) return

    try {
      await updateBiomarker({
        patientId,
        planId,
        pillarId,
        biomarkerId: biomarker.id,
        data: {
          minValue: editMinValue,
          maxValue: editMaxValue,
          status:
            biomarker.status === 'pending' ? 'approved' : biomarker.status,
          editedBy: currentUser?.name || '',
        },
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao editar biomarcador:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditMinValue(biomarker.minValue ?? '')
    setEditMaxValue(biomarker.maxValue ?? '')
    setIsEditing(false)
  }

  const isPending = biomarker.status === 'pending'
  const isApproved = biomarker.status === 'approved'

  return (
    <>
      <Card
        className={`w-[320px] rounded-3xl bg-white p-4 ${
          isEditing
            ? 'border-2 border-solid border-[#530570]'
            : isApproved
              ? 'border-0 shadow-lg'
              : 'border-2 border-dashed border-[#EB34EF]'
        }`}
      >
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <h4
              className={`text-lg font-bold ${isApproved ? 'text-[#530570]' : 'text-[#EB34EF]'}`}
            >
              {getBiomarkerLabel(biomarker.type)}
            </h4>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className={`rounded-full p-0.5 hover:bg-[#FCE4FF] ${isApproved ? 'text-[#530570]' : 'text-[#EB34EF]'}`}
                title="Editar"
                variant="ghost"
              >
                <EditOutlinedIcon className="text-bi" />
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isUpdatingBiomarker}
                className="text-[#B25DD3] hover:bg-[#FCE4FF]"
              >
                Voltar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isUpdatingBiomarker}
                className="bg-[#B25DD3] text-white hover:bg-[#a349c9]"
              >
                Salvar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[#EB34EF]">
              {isPending && (
                <Button
                  onClick={handleApprove}
                  disabled={isUpdating}
                  className="rounded-full p-0.5 hover:bg-[#FCE4FF] disabled:opacity-50"
                  title="Aprovar"
                  variant="ghost"
                >
                  <CheckIcon className="text-[#EB34EF]" fontSize="small" />
                </Button>
              )}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="mb-4 text-xs text-gray-500">
            {isPending ? (
              <>
                Criado em {formatDate(biomarker.createdAt)} por{' '}
                {biomarker.createdBy}
              </>
            ) : biomarker.editedBy ? (
              <>
                Editado em {formatDate(biomarker.updatedAt)} por{' '}
                {biomarker.editedBy}
              </>
            ) : (
              <>
                Criado em {formatDate(biomarker.createdAt)} por{' '}
                {biomarker.createdBy}
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <span
              className={`text-xs italic ${isApproved ? 'text-[#530570]' : 'text-gray-500'}`}
            >
              Mínimo
            </span>
            {isEditing ? (
              <input
                value={editMinValue}
                onChange={(e) => setEditMinValue(e.target.value)}
                placeholder={
                  biomarker.type === 'bloodPressure' ? '90/60' : '79'
                }
                className="h-10 w-full rounded-md border-2 border-[#B25DD3] bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[#9b27c5]"
              />
            ) : (
              <div className="flex items-center gap-2 text-gray-800">
                <span className="text-base text-gray-800">
                  {getBiomarkerIcon(biomarker.type, isApproved)}
                </span>
                <div
                  className={`text-lg font-semibold ${isApproved ? 'text-[#530570]' : 'text-gray-900'}`}
                >
                  {biomarker.minValue}{' '}
                  <span
                    className={`text-xs font-normal ${isApproved ? 'text-[#530570]' : 'text-gray-800'}`}
                  >
                    {getBiomarkerUnit(biomarker.type)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span
              className={`text-xs italic ${isApproved ? 'text-[#530570]' : 'text-gray-500'}`}
            >
              Máximo
            </span>
            {isEditing ? (
              <input
                value={editMaxValue}
                onChange={(e) => setEditMaxValue(e.target.value)}
                placeholder={
                  biomarker.type === 'bloodPressure' ? '120/80' : '99'
                }
                className="h-10 w-full rounded-md border-2 border-[#B25DD3] bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[#9b27c5]"
              />
            ) : (
              <div className="flex items-center gap-2 text-gray-800">
                <div
                  className={`text-lg font-semibold ${isApproved ? 'text-[#530570]' : 'text-gray-900'}`}
                >
                  {biomarker.maxValue}{' '}
                  <span
                    className={`text-xs font-normal ${isApproved ? 'text-[#530570]' : 'text-gray-800'}`}
                  >
                    {getBiomarkerUnit(biomarker.type)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </>
  )
}
