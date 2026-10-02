import { useEffect, useState } from 'react'

/**
 * visible: el elemento está en pantalla (las escenas corren solo así).
 * near: está cerca (montamos el Canvas antes de llegar y lo desmontamos al alejarnos).
 */
export function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io1 = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 })
    const io2 = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '120% 0px 120% 0px' })
    io1.observe(el)
    io2.observe(el)
    return () => {
      io1.disconnect()
      io2.disconnect()
    }
  }, [ref])

  return { visible, near }
}
