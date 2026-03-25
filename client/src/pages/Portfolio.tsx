import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Portfolio() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/services', { replace: true }) }, [navigate])
  return null
}
