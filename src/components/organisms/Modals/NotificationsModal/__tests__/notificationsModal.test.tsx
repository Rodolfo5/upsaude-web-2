/**
 * Testes para NotificationsModal e funcionalidades relacionadas.
 *
 * Executar: pnpm test src/components/organisms/Modals/NotificationsModal/__tests__
 */

import { subDays, subHours } from 'date-fns'
import { describe, expect, it } from 'vitest'

import { groupNotificationsByTime } from '@/lib/notifications/groupNotificationsByTime'
import type { EmailNotificationEntity } from '@/types/entities/emailNotification'
import { EmailNotificationCategory, EmailNotificationStatus } from '@/types/entities/emailNotification'

function createNotification(
  overrides: Partial<EmailNotificationEntity> & { id: string; createdAt: Date },
): EmailNotificationEntity {
  return {
    id: overrides.id,
    eventType: 'consultation_scheduled',
    category: EmailNotificationCategory.CONSULTATIONS,
    recipientId: 'doc1',
    recipientEmail: 'doc@test.com',
    recipientName: 'Dr. Test',
    title: 'Test',
    message: 'Test message',
    eventId: 'e1',
    eventHash: 'h1',
    status: EmailNotificationStatus.SENT,
    sentAt: new Date(),
    createdAt: overrides.createdAt,
    metadata: {},
    error: null,
    isRead: false,
    readAt: null,
    ...overrides,
  }
}

describe('groupNotificationsByTime', () => {
  it('deve agrupar notificações em Hoje, Ontem e Anteriores', () => {
    const now = new Date()
    const today = subHours(now, 2)
    const yesterday = subDays(now, 1)
    const older = subDays(now, 3)

    const notifications = [
      createNotification({ id: '1', createdAt: today }),
      createNotification({ id: '2', createdAt: yesterday }),
      createNotification({ id: '3', createdAt: older }),
    ]

    const { hoje, ontem, antigas } = groupNotificationsByTime(notifications)

    expect(hoje).toHaveLength(1)
    expect(hoje[0].id).toBe('1')
    expect(ontem).toHaveLength(1)
    expect(ontem[0].id).toBe('2')
    expect(antigas).toHaveLength(1)
    expect(antigas[0].id).toBe('3')
  })

  it('deve retornar arrays vazios quando não há notificações', () => {
    const { hoje, ontem, antigas } = groupNotificationsByTime([])
    expect(hoje).toEqual([])
    expect(ontem).toEqual([])
    expect(antigas).toEqual([])
  })

  it('deve agrupar múltiplas notificações no mesmo período', () => {
    const now = new Date()
    const today1 = subHours(now, 1)
    const today2 = subHours(now, 5)

    const notifications = [
      createNotification({ id: '1', createdAt: today1 }),
      createNotification({ id: '2', createdAt: today2 }),
    ]

    const { hoje } = groupNotificationsByTime(notifications)
    expect(hoje).toHaveLength(2)
    expect(hoje.map((n) => n.id).sort()).toEqual(['1', '2'])
  })
})
