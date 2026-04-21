/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  doc,
  setDoc,
  getDoc,
  getFirestore,
  collection,
  getDocs,
} from 'firebase/firestore'

import app from '@/config/firebase/app'
import { AgendaEntity, ShiftData } from '@/types/entities/agenda'
import { UserStatus } from '@/types/entities/user'

const db = getFirestore(app)

export interface UserProgressData {
  step: number
  data: any
  timestamp: Date
  completed: boolean
}

export const saveUserProgressToFirestore = async (
  userId: string,
  stepData: any,
  step: number,
  isCompleted: boolean = false,
) => {
  try {
    const userRef = doc(db, 'users', userId)

    const status = UserStatus.PENDING

    await setDoc(
      userRef,
      {
        ...stepData,
        currentStep: step,
        lastUpdated: new Date(),
        isCompleted,
        status,
      },
      { merge: true },
    )

    return true
  } catch (error) {
    console.error('Erro ao salvar dados no Firestore:', error)
    throw error
  }
}

export const getUserProgressFromFirestore = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      return userDoc.data()
    }
    return null
  } catch (error) {
    console.error('Erro ao buscar dados do Firestore:', error)
    throw error
  }
}

export const approveUser = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId)

    // Buscar dados do usuário antes de aprovar
    const userDoc = await getDoc(userRef)
    const userData = userDoc.data()

    // Atualizar status para APPROVED
    await setDoc(
      userRef,
      {
        status: UserStatus.APPROVED,
        updatedAt: new Date(),
      },
      { merge: true },
    )

    // Se for médico com CRM e ainda não registrado na Memed, registrar agora
    if (
      userData &&
      userData.role === 'DOCTOR' &&
      userData.typeOfCredential === 'CRM' &&
      userData.credential &&
      userData.credentialState &&
      !userData.memedRegistered &&
      !userData.memedId
    ) {
      try {
        // Separar nome e sobrenome
        const nameParts = (userData.name || '').trim().split(/\s+/)
        const firstName = nameParts[0] || userData.name || ''
        const surname = nameParts.slice(1).join(' ') || firstName

        // Formatar data de nascimento
        let formattedBirthDate: string | undefined
        if (userData.birthDate) {
          const birthDate =
            typeof userData.birthDate === 'string'
              ? new Date(userData.birthDate)
              : userData.birthDate.toDate
                ? userData.birthDate.toDate()
                : userData.birthDate

          if (birthDate && !isNaN(birthDate.getTime())) {
            const day = String(birthDate.getDate()).padStart(2, '0')
            const month = String(birthDate.getMonth() + 1).padStart(2, '0')
            const year = birthDate.getFullYear()
            formattedBirthDate = `${day}/${month}/${year}`
          }
        }

        // Registrar na Memed
        const memedResponse = await fetch('/api/memed/register-doctor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            externalId: userId,
            name: firstName,
            surname,
            email: userData.email || '',
            cpf: userData.cpf || '',
            birthDate: formattedBirthDate || '',
            crm: userData.credential,
            crmState: userData.credentialState.toUpperCase(),
          }),
        })

        const memedResult = await memedResponse.json()

        if (memedResult.success && memedResult.memedId) {
          // Atualizar com memedId e token
          const updateData: Record<string, unknown> = {
            memedId: memedResult.memedId,
            memedRegistered: true,
            updatedAt: new Date(),
          }

          if (memedResult.prescriberToken) {
            updateData.token = memedResult.prescriberToken
          }

          await setDoc(userRef, updateData, { merge: true })
        } else {
          // Verificar se já existe na Memed
          const errorMessage = memedResult.error || ''
          const errorText = errorMessage.toLowerCase()
          const alreadyExists =
            errorText.includes('já existe') ||
            errorText.includes('already exists') ||
            errorText.includes('duplicate')

          if (alreadyExists) {
            // Tentar buscar o memedId existente
            try {
              const memedIdResponse = await fetch(
                '/api/memed/get-doctor-memed-id',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    crm: userData.credential,
                    crmState: userData.credentialState.toUpperCase(),
                    externalId: userId,
                    cpf: userData.cpf?.replace(/\D/g, ''),
                  }),
                },
              )

              const memedIdResult = await memedIdResponse.json()

              if (memedIdResult.found && memedIdResult.memedId) {
                await setDoc(
                  userRef,
                  {
                    memedId: memedIdResult.memedId,
                    memedRegistered: true,
                    updatedAt: new Date(),
                  },
                  { merge: true },
                )
              } else {
                // Marcar como registrado mesmo sem memedId
                await setDoc(
                  userRef,
                  {
                    memedRegistered: true,
                    updatedAt: new Date(),
                  },
                  { merge: true },
                )
              }
            } catch (searchError) {
              console.error(
                `❌ Erro ao buscar médico existente na Memed:`,
                searchError,
              )
            }
          } else {
            console.warn(
              `⚠️ Médico ${userId} aprovado, mas falha ao registrar na Memed:`,
              errorMessage,
            )
          }
        }
      } catch (memedError) {
        console.error(
          `❌ Erro na integração Memed ao aprovar médico ${userId}:`,
          memedError,
        )
        // Não bloqueia a aprovação se Memed falhar
      }
    }

    return true
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error)
    throw error
  }
}

export const rejectUser = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(
      userRef,
      {
        status: UserStatus.REJECTED,
        updatedAt: new Date(),
      },
      { merge: true },
    )
    return true
  } catch (error) {
    console.error('Erro ao rejeitar usuário:', error)
    throw error
  }
}

// Função para remover campos undefined
const removeUndefinedFields = (obj: any): any => {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields).filter((item) => item !== undefined)
  }

  if (typeof obj === 'object') {
    const cleaned: any = {}
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefinedFields(obj[key])
      }
    })
    return cleaned
  }

  return obj
}

// Função para limpar e normalizar os dados dos turnos
const normalizeShiftsData = (shifts: any) => {
  if (!shifts) return {}

  const normalizedShifts: Record<string, ShiftData[]> = {}

  Object.keys(shifts).forEach((day) => {
    if (Array.isArray(shifts[day])) {
      normalizedShifts[day] = shifts[day].map((shift: any) => {
        // Garantir que os campos estão no nível correto
        const normalizedShift = {
          startTime: shift.startTime || '',
          endTime: shift.endTime || '',
          consultationTypes: Array.isArray(shift.consultationTypes)
            ? shift.consultationTypes
            : [],
          format: Array.isArray(shift.format) ? shift.format : [],
          value: typeof shift.value === 'number' ? shift.value : 0,
          isPromotional: Boolean(shift.isPromotional),
        }

        if (
          shift.format &&
          typeof shift.format === 'object' &&
          !Array.isArray(shift.format)
        ) {
          if (shift.format.startTime)
            normalizedShift.startTime = shift.format.startTime
          if (shift.format.value) normalizedShift.value = shift.format.value
          if (shift.format.isPromotional !== undefined)
            normalizedShift.isPromotional = shift.format.isPromotional
        }

        return normalizedShift
      })
    }
  })

  return normalizedShifts
}

export const saveAgenda = async (
  userId: string,
  settings: Partial<AgendaEntity>,
) => {
  try {
    // Normalizar os dados dos turnos antes de salvar
    const normalizedSettings = {
      ...settings,
      shifts: settings.shifts
        ? normalizeShiftsData(settings.shifts)
        : settings.shifts,
    }

    // Remover campos undefined para evitar erro no Firestore
    const cleanedSettings = removeUndefinedFields(normalizedSettings)

    const agendaCollectionRef = collection(db, 'users', userId, 'agenda')

    const existingDocs = await getDocs(agendaCollectionRef)

    let agendaRef

    if (!existingDocs.empty) {
      // Se já existe, usar o primeiro documento para fazer merge
      agendaRef = existingDocs.docs[0].ref

      // Fazer merge dos dados existentes com os novos
      await setDoc(
        agendaRef,
        {
          ...cleanedSettings,
          professionalId: userId,
          hasCompletedOnboarding: cleanedSettings.currentStep === 2,
          updatedAt: new Date(),
        },
        { merge: true },
      )
    } else {
      // Se não existe, criar novo documento
      agendaRef = doc(agendaCollectionRef)

      await setDoc(agendaRef, {
        professionalId: userId,
        ...cleanedSettings,
        hasCompletedOnboarding: cleanedSettings.currentStep === 2,
        updatedAt: new Date(),
      })
    }

    const userRef = doc(db, 'users', userId)
    await setDoc(
      userRef,
      {
        updatedAt: new Date(),
      },
      { merge: true },
    )

    return { success: true, error: null }
  } catch (error) {
    console.error('Erro ao salvar configurações de agenda:', error)
    return { success: false, error: (error as Error).message }
  }
}

export const getAgenda = async (
  userId: string,
): Promise<{ settings: AgendaEntity | null; error: string | null }> => {
  try {
    const agendaCollectionRef = collection(db, 'users', userId, 'agenda')

    // Buscar todos os documentos (deve haver apenas um)
    const querySnapshot = await getDocs(agendaCollectionRef)

    if (querySnapshot.empty) {
      return { settings: null, error: null }
    }

    // Pegar o primeiro (e único) documento
    const agendaDoc = querySnapshot.docs[0]
    const data = agendaDoc.data()

    // Garantir que complementaryConsultationDuration seja número
    const settings: AgendaEntity = {
      ...data,
      complementaryConsultationDuration: data.complementaryConsultationDuration
        ? Number(data.complementaryConsultationDuration)
        : undefined,
    } as AgendaEntity

    return { settings, error: null }
  } catch (error) {
    console.error('Erro ao buscar configurações de agenda:', error)
    return {
      settings: null,
      error: (error as Error).message,
    }
  }
}

export const saveOffice = async (
  userId: string,
  officeData: any,
): Promise<{ success: boolean; error: string | null }> => {
  try {
    const cleanedOfficeData = removeUndefinedFields(officeData)

    const officeCollectionRef = collection(db, 'users', userId, 'office')

    const existingDocs = await getDocs(officeCollectionRef)

    let officeRef

    if (!existingDocs.empty) {
      officeRef = existingDocs.docs[0].ref

      await setDoc(
        officeRef,
        {
          ...cleanedOfficeData,
          professionalId: userId,
          updatedAt: new Date(),
        },
        { merge: true },
      )
    } else {
      officeRef = doc(officeCollectionRef)

      await setDoc(officeRef, {
        professionalId: userId,
        ...cleanedOfficeData,
        updatedAt: new Date(),
      })
    }

    const userRef = doc(db, 'users', userId)
    await setDoc(
      userRef,
      {
        updatedAt: new Date(),
      },
      { merge: true },
    )

    return { success: true, error: null }
  } catch (error) {
    console.error('Erro ao salvar dados do consultório:', error)
    return { success: false, error: (error as Error).message }
  }
}

export const getOffice = async (
  userId: string,
): Promise<{ office: any | null; error: string | null }> => {
  try {
    const officeCollectionRef = collection(db, 'users', userId, 'office')

    const querySnapshot = await getDocs(officeCollectionRef)

    if (querySnapshot.empty) {
      return { office: null, error: null }
    }

    const officeDoc = querySnapshot.docs[0]
    const office = officeDoc.data()

    return { office, error: null }
  } catch (error) {
    console.error('Erro ao buscar dados do consultório:', error)
    return {
      office: null,
      error: (error as Error).message,
    }
  }
}
