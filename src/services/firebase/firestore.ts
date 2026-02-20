/**
 * 🗄️ SERVICE GENÉRICO DO FIRESTORE
 *
 * Este arquivo fornece utilitários genéricos para operações CRUD no Firestore.
 *
 * Propósito:
 * - Base reutilizável para qualquer coleção
 * - Type safety com TypeScript generics
 * - Tratamento consistente de erros
 * - Padrão de resposta unificado
 *
 * ⚠️ IMPORTANTE:
 * Este arquivo é uma CAMADA BASE. Services específicos (como User Service)
 * devem usar estes utilitários e adicionar lógica de negócio específica.
 *
 * Usado por:
 * - Services específicos (user, product, order, etc.)
 * - Operações CRUD simples
 * - Prototipagem rápida
 */

import { FirebaseError } from 'firebase/app'
import {
  DocumentData,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
} from 'firebase/firestore'

import firebaseApp from '@/config/firebase/firebase'

// ====================================================================
// 🔧 CONFIGURAÇÃO
// ====================================================================

/**
 * Instância do Firestore conectada ao Firebase app
 */
const db = getFirestore(firebaseApp)

// ====================================================================
// 📋 TIPOS GENÉRICOS
// ====================================================================

/**
 * Resposta padrão para operações de coleção
 * Inclui array de documentos com ID ou erro
 */
type CollectionResponse<T> =
  | { data: (T & { id: string })[]; error: null }
  | { data: null; error: string }

/**
 * Resposta padrão para operações de documento único
 * Inclui documento com ID ou null se não encontrado
 */
type DocumentResponse<T> =
  | { data: (T & { id: string }) | null; error: null }
  | { data: null; error: string }

// ====================================================================
// 📖 OPERAÇÕES DE LEITURA
// ====================================================================

/**
 * 📚 Busca todos os documentos de uma coleção
 *
 * GENÉRICO: Funciona com qualquer tipo de documento
 * SEM FILTROS: Retorna todos os documentos
 * SEM ORDENAÇÃO: Ordem padrão do Firestore
 *
 * @param collectionPath - Path da coleção (ex: 'users', 'products')
 * @returns Promise com array de documentos ou erro
 *
 * EXEMPLO:
 * ```typescript
 * const { data, error } = await getFirestoreCollection<User>({
 *   collectionPath: 'users'
 * })
 * ```
 */
export const getFirestoreCollection = async <T extends DocumentData>({
  collectionPath,
}: {
  collectionPath: string
}): Promise<CollectionResponse<T>> => {
  try {
    const collectionRef = collection(db, collectionPath)
    const q = query(collectionRef)
    const querySnapshot = await getDocs(q)

    // 🔄 Transformar docs em objetos com ID
    const data: (T & { id: string })[] = querySnapshot.docs.map((doc) => {
      const data = doc.data() as T

      return {
        id: doc.id,
        ...data,
      }
    })

    return {
      data,
      error: null,
    }
  } catch (error) {
    // 🚨 Tratamento específico de erros Firebase
    if (error instanceof FirebaseError) {
      return {
        error: error.message,
        data: null,
      }
    } else {
      return {
        error: error as string,
        data: null,
      }
    }
  }
}

/**
 * 📄 Busca um documento específico por path
 *
 * @param documentPath - Path completo do documento (ex: 'users/uid123')
 * @returns Promise com documento ou null se não encontrado
 *
 * EXEMPLO:
 * ```typescript
 * const { data, error } = await getFirestoreDoc<User>({
 *   documentPath: 'users/user123'
 * })
 * ```
 */
export const getFirestoreDoc = async <T extends DocumentData>({
  documentPath,
}: {
  documentPath: string
}): Promise<DocumentResponse<T>> => {
  try {
    const documentRef = doc(db, documentPath)
    const docSnapshot = await getDoc(documentRef)

    // 📭 Documento não existe = sucesso com data null
    if (!docSnapshot.exists()) {
      return {
        data: null,
        error: null,
      }
    }

    const data = docSnapshot.data() as T

    return {
      data: { ...data, id: docSnapshot.id },
      error: null,
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      return {
        error: error.message,
        data: null,
      }
    } else {
      return {
        error: error as string,
        data: null,
      }
    }
  }
}

// ====================================================================
// ✏️ OPERAÇÕES DE ESCRITA
// ====================================================================

/**
 * ➕ Cria novo documento em uma coleção
 *
 * AUTO-ID: Firestore gera ID automaticamente
 * GENÉRICO: Aceita qualquer estrutura de dados
 *
 * @param collectionPath - Path da coleção
 * @param data - Dados do documento (sem ID)
 * @returns Promise com resultado da operação
 *
 * EXEMPLO:
 * ```typescript
 * const { error } = await createFirestoreDoc<User>({
 *   collectionPath: 'users',
 *   data: { name: 'João', email: 'joao@email.com' }
 * })
 * ```
 */
export const createFirestoreDoc = async <T extends DocumentData>({
  collectionPath,
  data,
}: {
  collectionPath: string
  data: Omit<T, 'id'>
}): Promise<{ error: string | null }> => {
  try {
    const collectionRef = collection(db, collectionPath)
    await addDoc(collectionRef, data) // ⚠️ BUG: faltava await

    return {
      error: null,
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      return {
        error: error.message,
      }
    } else {
      return {
        error: 'An unknown error occurred',
      }
    }
  }
}

/**
 * 📝 Atualiza documento existente
 *
 * PARTIAL: Permite atualizar apenas campos específicos
 * MERGE: Não sobrescreve documento inteiro
 *
 * @param documentPath - Path completo do documento
 * @param data - Dados parciais para atualizar
 * @returns Promise com resultado da operação
 *
 * EXEMPLO:
 * ```typescript
 * const { error } = await updateFirestoreDoc<User>({
 *   documentPath: 'users/user123',
 *   data: { name: 'João Silva' }
 * })
 * ```
 */
export const updateFirestoreDoc = async <T extends DocumentData>({
  documentPath,
  data,
}: {
  documentPath: string
  data: Partial<Omit<T, 'id'>>
}): Promise<{ error: string | null }> => {
  try {
    const documentRef = doc(db, documentPath)

    await updateDoc(documentRef, {
      ...data,
    })

    return {
      error: null,
    }
  } catch (error) {
    if (error instanceof FirebaseError) {
      return {
        error: error.message,
      }
    } else {
      return {
        error: 'An unknown error occurred',
      }
    }
  }
}
