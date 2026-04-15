import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function PlanningNewRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/planning?new=1', { replace: true })
  }, [navigate])
  return null
}
