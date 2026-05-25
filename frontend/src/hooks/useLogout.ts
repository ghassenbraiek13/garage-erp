import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import api from '@/utils/api'

export function useLogout() {
  const navigate = useNavigate()

  return useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore */
    }
    useAuthStore.getState().clearAuth()
    navigate('/login', { replace: true })
  }, [navigate])
}