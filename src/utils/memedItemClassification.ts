/**
 * Funções para classificar itens da Memed como medicamentos ou exames.
 *
 * A Memed retorna TODOS os itens prescritos (medicamentos + exames) no array `medicamentos`.
 * Para separar corretamente, usamos duas estratégias combinadas:
 *
 * 1. Identificação POSITIVA de exames: tipo === 'exame', ID começa com 'e', códigos SUS/TUSS
 * 2. Identificação POSITIVA de medicamentos: presença de tarja, receituario, fabricante, forma farmacêutica, tipo medicamentoso
 *
 * Itens que NÃO possuem características de medicamento são tratados como exames por padrão.
 * Isso garante que exames como "Hemoglobina" (que não têm tarja, fabricante, etc.) sejam corretamente classificados.
 */

/**
 * Verifica se um item tem características explícitas de exame
 */
export function isExamLikeItem(item: Record<string, unknown>): boolean {
  const id = typeof item.id === 'string' ? item.id : ''
  const tipo = typeof item.tipo === 'string' ? item.tipo.toLowerCase() : ''
  const hasExamCodes = Boolean(
    (item.exames_sus_codigo && item.exames_sus_codigo !== '') ||
      (item.exames_tuss_codigo && item.exames_tuss_codigo !== '') ||
      (item.codigo_sus && item.codigo_sus !== '') ||
      (item.codigo_tuss && item.codigo_tuss !== ''),
  )

  return tipo === 'exame' || id.startsWith('e') || hasExamCodes
}

/**
 * Verifica se um item é definitivamente um medicamento
 *
 * Um item é considerado medicamento se possuir pelo menos uma das características
 * específicas de medicamentos. Isso é mais confiável do que verificar campos genéricos
 * como `quantidade` ou `unit` que podem existir em ambos.
 *
 * Características verificadas:
 * - tarja (ex: "Livre", "Vermelha", "Preta")
 * - receituario (ex: "Simples", "Controlado")
 * - fabricante ou fabricante_id
 * - forma_farmaceutica (ex: "Comprimido", "Cápsula")
 * - tipo medicamentoso (ex: "alopático", "fitoterápico", "manipulado", "homeopático")
 */
export function isDefinitelyMedication(
  item: Record<string, unknown>,
): boolean {
  const hasTarja = Boolean(item.tarja && item.tarja !== '')
  const hasReceituario = Boolean(
    item.receituario && item.receituario !== '',
  )
  const hasFabricante = Boolean(item.fabricante || item.fabricante_id)
  const hasFormaFarmaceutica = Boolean(
    (item.forma_farmaceutica && item.forma_farmaceutica !== '') ||
      (item.pharmaceutical_form && item.pharmaceutical_form !== ''),
  )

  // Tipos de medicamentos conhecidos da Memed
  const tipo = typeof item.tipo === 'string' ? item.tipo.toLowerCase() : ''
  const isMedicationType = [
    'alopático',
    'alopatico',
    'fitoterápico',
    'fitoterapico',
    'manipulado',
    'homeopático',
    'homeopatico',
    'biológico',
    'biologico',
  ].includes(tipo)

  return (
    hasTarja ||
    hasReceituario ||
    hasFabricante ||
    hasFormaFarmaceutica ||
    isMedicationType
  )
}

/**
 * Classifica um item da Memed como 'medication' ou 'exam'
 *
 * Lógica de classificação:
 * 1. Se é explicitamente um exame (tipo, ID, códigos) → 'exam'
 * 2. Se é definitivamente um medicamento (tarja, fabricante, etc.) → 'medication'
 * 3. Se não tem características de medicamento → 'exam' (default seguro)
 */
export function classifyMemedItem(
  item: Record<string, unknown>,
): 'medication' | 'exam' {
  // Primeiro: verificar se é explicitamente um exame
  if (isExamLikeItem(item)) {
    return 'exam'
  }

  // Segundo: verificar se é definitivamente um medicamento
  if (isDefinitelyMedication(item)) {
    return 'medication'
  }

  // Default: se não tem características claras de medicamento, tratar como exame
  // Isso garante que itens como "Hemoglobina" (sem tarja, fabricante, etc.) sejam exames
  return 'exam'
}
