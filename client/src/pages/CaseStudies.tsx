import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CaseStudies() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/insights', { replace: true }) }, [navigate])
  return null
}
