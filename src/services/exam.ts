import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  where,
  DocumentData,
  Timestamp,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'
import { ExamEntity } from '@/types/entities/exam'

const firestore = getFirestore(firebaseApp)

export async function findAllExams(
  patientId: string,
  type?: 'exam' | 'prescription',
): Promise<ExamEntity[]> {
  const examsRef = collection(firestore, 'users', patientId, 'exams')
  let q = query(examsRef, orderBy('requestDate', 'desc'))

  // Se especificado um tipo, filtra por ele
  if (type) {
    q = query(examsRef, orderBy('requestDate', 'desc'))
  }

  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    return []
  }

  const exams = snapshot.docs
    .map((doc) => {
      const data = doc.data() as DocumentData
      return {
        id: doc.id,
        ...data,
        requestDate: data.requestDate?.toDate
          ? data.requestDate.toDate()
          : data.requestDate,
        completionDate: data.completionDate?.toDate
          ? data.completionDate.toDate()
          : data.completionDate || null,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate()
          : data.updatedAt,
      } as ExamEntity
    })
    .filter((exam) => {
      // Filtra por tipo se especificado
      if (type) {
        return exam.type === type || (!exam.type && type === 'exam')
      }
      return true
    })

  return exams
}

/**
 * Busca apenas prescrições de um paciente
 */
export async function findAllPrescriptions(
  patientId: string,
): Promise<ExamEntity[]> {
  return findAllExams(patientId, 'prescription')
}

/**
 * Busca apenas exames de um paciente
 */
export async function findOnlyExams(patientId: string): Promise<ExamEntity[]> {
  return findAllExams(patientId, 'exam')
}

export async function findAllPrescriptionsByDoctor(
  doctorId: string,
): Promise<ExamEntity[]> {
  try {
    const usersRef = collection(firestore, 'users')
    const usersSnapshot = await getDocs(usersRef)

    const allPrescriptions: ExamEntity[] = []

    for (const userDoc of usersSnapshot.docs) {
      const examsRef = collection(firestore, 'users', userDoc.id, 'exams')
      const q = query(
        examsRef,
        where('type', '==', 'prescription'),
        where('doctorId', '==', doctorId),
        orderBy('requestDate', 'desc'),
      )

      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const prescriptions = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData
          return {
            id: doc.id,
            ...data,
            requestDate: data.requestDate?.toDate
              ? data.requestDate.toDate()
              : data.requestDate,
            completionDate: data.completionDate?.toDate
              ? data.completionDate.toDate()
              : data.completionDate || null,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : data.createdAt,
            updatedAt: data.updatedAt?.toDate
              ? data.updatedAt.toDate()
              : data.updatedAt,
          } as ExamEntity
        })

        allPrescriptions.push(...prescriptions)
      }
    }

    return allPrescriptions.sort((a, b) => {
      const dateA = new Date(a.requestDate).getTime()
      const dateB = new Date(b.requestDate).getTime()
      return dateB - dateA
    })
  } catch (error) {
    console.error('Erro ao buscar prescrições do médico:', error)
    return []
  }
}

export async function findExamById(
  patientId: string,
  examId: string,
): Promise<ExamEntity | null> {
  const examRef = doc(firestore, 'users', patientId, 'exams', examId)
  const snap = await getDoc(examRef)

  if (!snap.exists()) return null

  const data = snap.data() as DocumentData
  const exam = {
    id: snap.id,
    ...data,
    requestDate: data.requestDate?.toDate
      ? data.requestDate.toDate()
      : data.requestDate,
    completionDate: data.completionDate?.toDate
      ? data.completionDate.toDate()
      : data.completionDate || null,
    createdAt: data.createdAt?.toDate
      ? data.createdAt.toDate()
      : data.createdAt,
    updatedAt: data.updatedAt?.toDate
      ? data.updatedAt.toDate()
      : data.updatedAt,
  } as ExamEntity

  return exam
}

/**
 * Cria um novo exame ou prescrição na subcoleção do paciente
 */
export async function createExam(
  patientId: string,
  examData: Partial<ExamEntity>,
): Promise<ExamEntity> {
  if (!patientId) {
    throw new Error('patientId é obrigatório para criar exame/prescrição')
  }

  // Verificar se o documento do paciente existe antes de salvar prescrição
  // IMPORTANTE: Pacientes antigos podem ter sido criados com addDoc (ID diferente do UID)
  // Precisamos encontrar o documento correto, seja pelo ID do documento ou pelo campo 'id'
  let actualPatientDocId = patientId
  try {
    const patientDocRef = doc(firestore, 'users', patientId)
    let patientDoc = await getDoc(patientDocRef)

    // Se não encontrou pelo ID do documento, tenta buscar pelo campo 'id' (UID do Auth)
    if (!patientDoc.exists()) {
      const patientsQuery = query(
        collection(firestore, 'users'),
        where('id', '==', patientId),
        where('role', '==', 'PATIENT'),
      )
      const querySnapshot = await getDocs(patientsQuery)

      if (!querySnapshot.empty && querySnapshot.docs[0]) {
        // Encontrou pelo campo 'id', usa o ID do documento encontrado
        patientDoc = querySnapshot.docs[0]
        actualPatientDocId = patientDoc.id
      } else {
        console.error('❌ ERRO: Documento do paciente não existe!', {
          patientId,
          path: patientDocRef.path,
        })
        throw new Error(
          `Paciente com ID ${patientId} não encontrado no Firestore. Verifique se o paciente foi criado corretamente.`,
        )
      }
    } else {
      // Paciente encontrado pelo ID do documento
      actualPatientDocId = patientId
    }

    const patientData = patientDoc.data()
    if (!patientData) {
      throw new Error('Dados do paciente não encontrados')
    }

    // Verificar se o paciente tem campos mínimos ou se foi criado vazio pela Memed
    const hasMinimalFields =
      patientData.name || patientData.email || patientData.phoneNumber
    const isEmptyPatient = Object.keys(patientData).length <= 2 // Apenas id e role

    // Se o paciente foi criado vazio pela Memed (sem atributos), atualizar com dados mínimos
    // Mas NÃO bloquear o salvamento da prescrição - apenas logar um aviso
    if (isEmptyPatient || !hasMinimalFields) {
      console.warn(
        '⚠️ Paciente encontrado mas com poucos campos. Pode ter sido criado pela Memed.',
        {
          fields: Object.keys(patientData),
          isEmpty: isEmptyPatient,
        },
      )
      // Não bloqueia - permite salvar prescrição mesmo se paciente estiver incompleto
    }

    // Atualiza patientId para usar o ID correto do documento
    patientId = actualPatientDocId
  } catch (patientError) {
    // Se o paciente não foi encontrado, verificar se podemos criar um documento básico
    // ou se devemos apenas logar e permitir o salvamento
    console.error('❌ Erro ao verificar paciente:', patientError)

    // Se o erro é que o paciente não existe, criar um documento básico do paciente
    // Isso permite que prescrições sejam salvas mesmo quando o paciente foi criado pela Memed
    if (
      patientError instanceof Error &&
      patientError.message.includes('não encontrado')
    ) {
      console.warn(
        '⚠️ Paciente não encontrado no Firestore. Criando documento básico...',
      )

      try {
        // Criar documento básico do paciente para permitir salvar prescrição
        const basicPatientData = {
          id: patientId,
          role: 'PATIENT',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          // Campos mínimos - podem ser atualizados depois
          name: examData.patientData?.name || 'Paciente',
          email: '', // Email não está disponível em patientData
        }

        const patientDocRef = doc(firestore, 'users', patientId)
        await setDoc(patientDocRef, basicPatientData)

        // Atualizar actualPatientDocId para usar o ID correto
        actualPatientDocId = patientId
        patientId = actualPatientDocId
      } catch (createError) {
        console.error(
          '❌ Erro ao criar documento básico do paciente:',
          createError,
        )
        console.warn(
          '⚠️ Continuando mesmo assim - prescrição será salva mesmo sem documento do paciente.',
        )
        // Não lança erro - permite que a prescrição seja salva
        // O documento do paciente pode ser criado depois
        // Usar o patientId original mesmo se não conseguir criar o documento
      }
    } else {
      // Para outros erros, lança normalmente
      throw patientError
    }
  }

  // Garantir que patientId está atualizado com o ID correto do documento
  if (actualPatientDocId !== patientId) {
    patientId = actualPatientDocId
  }

  // Criar referência para a subcoleção exams dentro do documento do usuário
  // Estrutura: users/{patientId}/exams/{examId}
  const examRef = doc(collection(firestore, 'users', patientId, 'exams'))
  const examId = examRef.id

  const now = new Date()
  const examEntity: ExamEntity = {
    id: examId,
    patientId,
    requestDate: examData.requestDate || now,
    completionDate: examData.completionDate || null,
    doctorId: examData.doctorId || '',
    status: examData.status || 'requested',
    examUrl: examData.examUrl,
    type: examData.type || 'exam',
    consultationId: examData.consultationId,
    memedId: examData.memedId,
    memedUrl: examData.memedUrl,
    pdfUrl: examData.pdfUrl,
    digitalRecipeLink: examData.digitalRecipeLink,
    medications: examData.medications,
    procedures: examData.procedures,
    exams: examData.exams,
    patientData: examData.patientData,
    prescriber: examData.prescriber,
    doctorData: examData.doctorData,
    rawData: examData.rawData,
    resultUrl: examData.resultUrl,
    examName: examData.examName,
    notes: examData.notes,
    examFile: examData.examFile ?? '',
    createdAt: examData.createdAt || now,
    updatedAt: examData.updatedAt || now,
  }

  // Preparar dados para Firestore (converter Date para Timestamp)
  const firestoreData: Record<string, unknown> = {
    ...examEntity,
    examFile: examEntity.examFile ?? '',
    requestDate:
      examEntity.requestDate instanceof Date
        ? Timestamp.fromDate(examEntity.requestDate)
        : examEntity.requestDate,
    completionDate:
      examEntity.completionDate instanceof Date
        ? Timestamp.fromDate(examEntity.completionDate)
        : examEntity.completionDate,
    createdAt:
      examEntity.createdAt instanceof Date
        ? Timestamp.fromDate(examEntity.createdAt)
        : examEntity.createdAt,
    updatedAt:
      examEntity.updatedAt instanceof Date
        ? Timestamp.fromDate(examEntity.updatedAt)
        : examEntity.updatedAt,
  }

  // Remove campos undefined recursivamente para não ocupar espaço desnecessário no Firestore
  // Firestore não aceita campos com valor undefined - REMOVER completamente
  const removeUndefinedRecursive = (value: unknown): unknown => {
    // Se for undefined, retornar um marcador especial para remover
    if (value === undefined) {
      return '__REMOVE_UNDEFINED__'
    }

    // Se for null, manter null (Firestore aceita null)
    if (value === null) {
      return null
    }

    // Se for array, processar cada elemento e filtrar marcadores
    if (Array.isArray(value)) {
      const cleanedArray = value
        .map(removeUndefinedRecursive)
        .filter((item) => item !== '__REMOVE_UNDEFINED__')
      return cleanedArray
    }

    // Se for Date ou Timestamp, manter como está
    if (value instanceof Date || value instanceof Timestamp) {
      return value
    }

    // Se for objeto, processar recursivamente
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>
      const cleaned: Record<string, unknown> = {}

      for (const [key, val] of Object.entries(obj)) {
        const cleanedValue = removeUndefinedRecursive(val)
        // Só adicionar se o valor não for o marcador de remoção
        if (cleanedValue !== '__REMOVE_UNDEFINED__') {
          cleaned[key] = cleanedValue
        }
      }

      return cleaned
    }

    // Para primitivos (string, number, boolean), retornar como está
    return value
  }

  // Aplicar limpeza recursiva
  const cleanedData = removeUndefinedRecursive(firestoreData)

  // Garantir que o resultado é um objeto válido
  if (
    !cleanedData ||
    typeof cleanedData !== 'object' ||
    Array.isArray(cleanedData)
  ) {
    console.error('❌ ERRO: Dados limpos resultaram em tipo inválido')
    throw new Error('Dados inválidos após limpeza de undefined')
  }

  const finalData = cleanedData as Record<string, unknown>

  // Verificação final: garantir que não há undefined em nenhum nível
  const verifyNoUndefined = (obj: unknown): boolean => {
    if (obj === undefined) {
      return false
    }
    if (Array.isArray(obj)) {
      return obj.every(verifyNoUndefined)
    }
    if (obj !== null && typeof obj === 'object') {
      return Object.values(obj).every(verifyNoUndefined)
    }
    return true
  }

  if (!verifyNoUndefined(finalData)) {
    console.error('❌ ERRO: Ainda há undefined nos dados após limpeza!')
    console.error('📋 Dados:', JSON.stringify(finalData, null, 2))
    throw new Error('Dados contêm undefined após limpeza')
  }

  try {
    await setDoc(examRef, finalData)

    // Verificar se o documento foi realmente salvo
    try {
      const verifyRef = doc(firestore, 'users', patientId, 'exams', examId)

      const verifySnap = await getDoc(verifyRef)

      if (!verifySnap.exists()) {
        // Tentar listar todos os documentos na subcoleção para debug
        try {
          const examsCollection = collection(
            firestore,
            'users',
            patientId,
            'exams',
          )
          await getDocs(examsCollection)
        } catch (listError) {
          console.error('❌ Erro ao listar documentos:', listError)
        }

        throw new Error('Documento não foi salvo corretamente no Firestore')
      }
    } catch (verifyError) {
      console.error('❌ Erro ao verificar documento salvo:', verifyError)
      // Não lança erro aqui, apenas loga, pois o setDoc pode ter funcionado
    }
  } catch (error) {
    console.error('❌❌❌ ERRO ao salvar no Firestore:', error)
    console.error('📋 Detalhes do erro:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      code: (error as { code?: string })?.code,
      path: examRef.path,
      patientId,
    })
    throw error
  }

  return examEntity
}
