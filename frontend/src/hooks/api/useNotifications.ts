import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/utils/api'
import type { ApiListResponse } from '@/hooks/api/types'
import type { NotificationItem } from '@/types'

function mapNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    title: String(raw.title ?? raw.type ?? 'Notification'),
    body: String(raw.message ?? ''),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    read: Boolean(raw.isRead ?? raw.read),
  }
}

export function useNotificationsUnreadCount() {
  return useQuery({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { count: number } }>('/notifications/unread-count')
      return data.data.count
    },
    refetchInterval: 60_000,
  })
}

export function useNotificationsList() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<ApiListResponse<Record<string, unknown>>>('/notifications', {
        params: { limit: 20, page: 1 },
      })
      return data.data.map(mapNotification)
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all')
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] })
      void qc.invalidateQueries({ queryKey: ['notifications-count'] })
    },
  })
}
