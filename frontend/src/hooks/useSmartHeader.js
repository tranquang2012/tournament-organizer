import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const TOP_REVEAL = 16
const DIRECTION_DELTA = 8

export const useSmartHeader = ({ enabled = true } = {}) => {
  const { pathname } = useLocation()
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    setHidden(false)
    lastY.current = window.scrollY
  }, [pathname])

  useEffect(() => {
    if (!enabled) {
      setHidden(false)
      return undefined
    }

    lastY.current = window.scrollY

    const onScroll = () => {
      if (ticking.current) return
      ticking.current = true
      window.requestAnimationFrame(() => {
        const y = Math.max(0, window.scrollY)
        const delta = y - lastY.current

        if (y < TOP_REVEAL) {
          setHidden(false)
        } else if (delta > DIRECTION_DELTA) {
          setHidden(true)
        } else if (delta < -DIRECTION_DELTA) {
          setHidden(false)
        }

        lastY.current = y
        ticking.current = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enabled])

  return hidden
}

