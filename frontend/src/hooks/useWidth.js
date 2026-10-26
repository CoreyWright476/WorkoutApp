import { useEffect, useRef, useState } from 'react'

// Tracks an element's rendered width so SVG charts can lay out in real pixels.
export const useWidth = (fallback = 600) => {
    const ref = useRef(null)
    const [width, setWidth] = useState(fallback)

    useEffect(() => {
        if (!ref.current || typeof ResizeObserver === 'undefined') return undefined
        const observer = new ResizeObserver(([entry]) => {
            setWidth(Math.max(240, Math.floor(entry.contentRect.width)))
        })
        observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    return [ref, width]
}
