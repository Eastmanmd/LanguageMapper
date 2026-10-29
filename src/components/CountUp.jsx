import { useEffect, useRef, useState } from 'react'

const DURATION_MS = 1100

/** A number that counts up from zero the first time it scrolls into view. */
export default function CountUp({ value }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? value : 0,
  )

  useEffect(() => {
    if (shown === value) return undefined
    let frame
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const tick = (now) => {
        const t = Math.min((now - start) / DURATION_MS, 1)
        // Ease out, so it settles gently on the final number.
        setShown(Math.round(value * (1 - (1 - t) ** 3)))
        if (t < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    })
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
    // Runs once: the count only ever plays the first time it's seen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString('en-US')}
    </span>
  )
}
