/**
 * Testes para o sistema de notificações por e-mail.
 *
 * Para executar: adicione vitest ou jest ao projeto e rode os testes.
 *
 * Exemplo com vitest:
 * npm install -D vitest
 * npx vitest run src/services/emailNotification/__tests__
 */

import { describe, expect, it } from 'vitest'

import { generateEventHash } from '../emailNotification'
import { getNotificationTemplate } from '../templates'

describe('generateEventHash', () => {
  it('deve gerar hash MD5 consistente para os mesmos parâmetros', () => {
    const hash1 = generateEventHash('consultation_scheduled', 'abc123', 'doc456')
    const hash2 = generateEventHash('consultation_scheduled', 'abc123', 'doc456')
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(32)
    expect(hash1).toMatch(/^[a-f0-9]+$/)
  })

  it('deve gerar hashes diferentes para parâmetros diferentes', () => {
    const hash1 = generateEventHash('consultation_scheduled', 'abc123', 'doc456')
    const hash2 = generateEventHash('consultation_canceled', 'abc123', 'doc456')
    const hash3 = generateEventHash('consultation_scheduled', 'xyz789', 'doc456')
    const hash4 = generateEventHash('consultation_scheduled', 'abc123', 'doc999')

    expect(hash1).not.toBe(hash2)
    expect(hash1).not.toBe(hash3)
    expect(hash1).not.toBe(hash4)
  })

  it('deve incluir additionalData no hash quando fornecido', () => {
    const hash1 = generateEventHash('consultation_reminder', 'c1', 'd1')
    const hash2 = generateEventHash('consultation_reminder', 'c1', 'd1', '24h')
    expect(hash1).not.toBe(hash2)
  })
})

describe('getNotificationTemplate', () => {
  it('deve retornar HTML válido para qualquer evento', () => {
    const html = getNotificationTemplate(
      'consultation_scheduled',
      'Nova consulta',
      'Uma nova consulta foi agendada.',
      {},
    )
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('Nova consulta')
    expect(html).toContain('Uma nova consulta foi agendada.')
  })

  it('deve incluir link de ação quando metadata tem patientId e planId', () => {
    const html = getNotificationTemplate(
      'plan_reevaluation_requested',
      'Reavaliação solicitada',
      'O paciente solicitou reavaliação.',
      { patientId: 'p1', planId: 'pl1' },
    )
    expect(html).toContain('Ver Plano Terapêutico')
    expect(html).toContain('/pacientes/p1/plano-terapeutico/pl1')
  })

  it('deve incluir link do chat quando metadata tem chatId', () => {
    const html = getNotificationTemplate(
      'new_message',
      'Nova mensagem',
      'Você tem uma nova mensagem!',
      { chatId: 'chat123' },
    )
    expect(html).toContain('Abrir Chat')
    expect(html).toContain('chat123')
  })
})
