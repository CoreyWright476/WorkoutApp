import React, { useEffect, useRef, useState } from 'react'
import { PATTERNS, GROUND_Y, solvePose, interpolatePose } from '../utils/demoPoses'

const CYCLE_MS = 2600

const youtubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
    return match ? match[1] : null
}
const isVideoFile = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Animated stick-figure demonstration of an exercise's movement pattern.
export const StickFigure = ({ pattern, equipment, playing }) => {
    const spec = PATTERNS[pattern] || PATTERNS.squat
    const [phase, setPhase] = useState(0)
    const frame = useRef()

    useEffect(() => {
        if (!playing) return undefined
        const start = performance.now() - phase * CYCLE_MS
        const tick = (now) => {
            setPhase(((now - start) % CYCLE_MS) / CYCLE_MS)
            frame.current = requestAnimationFrame(tick)
        }
        frame.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame.current)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing, pattern])

    // Ease out and back: 0 -> 1 -> 0 over one cycle.
    const t = (1 - Math.cos(phase * 2 * Math.PI)) / 2
    const j = solvePose(interpolatePose(spec.frames[0], spec.frames[1], t), spec)
    const line = (a, b, extra = {}) => (
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} {...extra} />
    )
    const loaded = equipment && equipment !== 'none'
    const weightAt = spec.prop === 'shoulders' ? j.shoulder : j.hand

    return (
        <svg viewBox="0 0 200 200" className="stick-figure" role="img"
            aria-label={`${spec.label} demonstration animation`}>
            <line x1="10" y1={GROUND_Y + 2} x2="190" y2={GROUND_Y + 2} className="ground" />
            {spec.bar && <line x1="60" y1="40" x2="170" y2="40" className="bar" />}
            <g className="limb-back">
                {line(j.hip, j.knee2)}
                {line(j.knee2, j.foot2)}
            </g>
            <g className="limb">
                {line(j.hip, j.shoulder)}
                {line(j.hip, j.knee1)}
                {line(j.knee1, j.foot1)}
                {line(j.shoulder, j.elbow)}
                {line(j.elbow, j.hand)}
            </g>
            <circle cx={j.head.x} cy={j.head.y} r="9" className="head" />
            {loaded && spec.prop && (
                equipment === 'barbell'
                    ? <circle cx={weightAt.x} cy={weightAt.y} r="11" className="weight" />
                    : <rect x={weightAt.x - 7} y={weightAt.y - 4} width="14" height="8" rx="2" className="weight" />
            )}
        </svg>
    )
}

const DemoClip = ({ exercise }) => {
    const hasVideo = Boolean(exercise.demoUrl)
    const [mode, setMode] = useState(hasVideo ? 'video' : 'animation')
    const [playing, setPlaying] = useState(!prefersReducedMotion())

    useEffect(() => {
        setMode(exercise.demoUrl ? 'video' : 'animation')
    }, [exercise._id, exercise.demoUrl])

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} exercise form`)}`

    let video = null
    if (hasVideo) {
        const id = youtubeId(exercise.demoUrl)
        if (id) {
            video = (
                <iframe
                    title={`${exercise.name} demonstration video`}
                    src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            )
        } else if (isVideoFile(exercise.demoUrl)) {
            video = <video src={exercise.demoUrl} controls loop muted playsInline />
        } else {
            video = (
                <a className="demo-link" href={exercise.demoUrl} target="_blank" rel="noopener noreferrer">
                    Open demonstration video ↗
                </a>
            )
        }
    }

    return (
        <div className="demo-clip">
            {hasVideo && (
                <div className="segmented" role="tablist">
                    <button type="button" role="tab" aria-selected={mode === 'video'}
                        className={mode === 'video' ? 'active' : ''} onClick={() => setMode('video')}>Video</button>
                    <button type="button" role="tab" aria-selected={mode === 'animation'}
                        className={mode === 'animation' ? 'active' : ''} onClick={() => setMode('animation')}>Animation</button>
                </div>
            )}
            <div className="demo-stage">
                {mode === 'video' && video}
                {mode === 'animation' && (
                    <>
                        <StickFigure pattern={exercise.pattern} equipment={exercise.equipment} playing={playing} />
                        <button type="button" className="demo-play" onClick={() => setPlaying((p) => !p)}
                            aria-label={playing ? 'Pause demonstration' : 'Play demonstration'}>
                            {playing ? 'Pause' : 'Play'}
                        </button>
                    </>
                )}
            </div>
            <div className="demo-meta">
                <span>{(PATTERNS[exercise.pattern] || PATTERNS.squat).label} pattern</span>
                <a href={searchUrl} target="_blank" rel="noopener noreferrer">Find video clips ↗</a>
            </div>
        </div>
    )
}

export default DemoClip
