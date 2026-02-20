// ⚠️ Se não for utilizar o localStorage, este arquivo pode ser deletado.

const APP_STORAGE_SUFFIX = '@FrontendBoilerplate:'

/**
 * Recupera um valor armazenado no localStorage com base na chave fornecida.
 * @param key - A chave do item a ser recuperado.
 * @returns O valor armazenado convertido para o tipo especificado ou undefined se não existir.
 */
function storageGet<T>(key: string): T | undefined {
  const stringified =
    typeof window !== 'undefined'
      ? localStorage.getItem(`${APP_STORAGE_SUFFIX}${key}`)
      : undefined
  if (!stringified) {
    return undefined
  }

  return JSON.parse(stringified) as T
}

/**
 * Armazena um valor no localStorage com a chave fornecida.
 * @param key - A chave do item a ser armazenado.
 * @param data - O valor a ser armazenado, pode ser um objeto ou uma string.
 */
function storageSet(key: string, data: object | string): void {
  localStorage.setItem(`${APP_STORAGE_SUFFIX}${key}`, JSON.stringify(data))
}

/**
 * Remove um valor específico do localStorage com base na chave fornecida.
 * @param key - A chave do item a ser removido.
 */
function storageDelete(key: string): void {
  localStorage.removeItem(`${APP_STORAGE_SUFFIX}${key}`)
}

/**
 * Remove todos os valores armazenados no localStorage.
 */
function storageClear(): void {
  localStorage.clear()
}

export { storageGet, storageSet, storageDelete, storageClear }
