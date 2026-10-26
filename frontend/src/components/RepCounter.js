import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRepDetector } from '../utils/repDetector'

const beep = (ctxRef, frequency = 880, duration = 0.08) => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return
        if (!ctxRef.current) ctxRef.current = new AudioCtx()
        const ctx = ctxRef.current
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = frequency
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + duration)
    } catch (e) {
        // Audio is a nicety; ignore failures.
    }
}

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')

// Counts reps by tap, keyboard (Space / ↑ / ↓) or phone motion, with an
// optional tempo metronome and a rest timer once the set is logged.
const RepCounter = ({ target, restSec = 90, onLog, onClose }) => {
    const [count, setCount] = useState(0)
    const [tempo, setTempo] = useState(0) // seconds per rep, 0 = off
    const [motion, setMotion] = useState('off') // off | on | unsupported | denied
    const [rest, setRest] = useState(null)
    const audio = useRef(null)
    const detector = useRef(createRepDetector())

    const bump = useCallback((delta) => {
        setCount((c) => Math.max(0, c + delta))
        if (delta > 0 && navigator.vibrate) navigator.vibrate(30)
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const onKey = (e) => {
            if (isTyping(document.activeElement)) return
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault()
                bump(1)
            } else if (e.code === 'ArrowDown') {
                e.preventDefault()
                bump(-1)
            }
        }
        // Stop Space from also "clicking" whichever button has focus.
        const onKeyUp = (e) => {
            if (e.code === 'Space' && !isTyping(document.activeElement)) e.preventDefault()
        }
        window.addEventListener('keydown', onKey)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKey)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [bump])

    // Tempo metronome: high beep at the start of each rep, low at the midpoint
    useEffect(() => {
        if (!tempo) return undefined
        let half = false
        const id = setInterval(() => {
            beep(audio, half ? 440 : 880)
            half = !half
        }, (tempo * 1000) / 2)
        return () => clearInterval(id)
    }, [tempo])

    // Motion-based auto counting
    useEffect(() => {
        if (motion !== 'on') return undefined
        detector.current.reset()
        const onMotion = (e) => {
            const a = e.accelerationIncludingGravity
            if (!a || a.x === null) return
            const magnitude = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z)
            if (detector.current.push(magnitude, e.timeStamp)) bump(1)
        }
        window.addEventListener('devicemotion', onMotion)
        return () => window.removeEventListener('devicemotion', onMotion)
    }, [motion, bump])

    // Rest countdown
    useEffect(() => {
        if (rest === null || rest <= 0) return undefined
        const id = setTimeout(() => {
            if (rest === 1) beep(audio, 660, 0.3)
            setRest(rest - 1)
        }, 1000)
        return () => clearTimeout(id)
    }, [rest])

    const toggleMotion = async () => {
        if (motion === 'on') return setMotion('off')
        if (typeof window.DeviceMotionEvent === 'undefined') return setMotion('unsupported')
        if (typeof window.DeviceMotionEvent.requestPermission === 'function') {
            try {
                const result = await window.DeviceMotionEvent.requestPermission()
                return setMotion(result === 'granted' ? 'on' : 'denied')
            } catch (e) {
                return setMotion('denied')
            }
        }
        return setMotion('on')
    }

    const logSet = () => {
        if (!count) return
        onLog(count)
        setCount(0)
        setRest(restSec)
    }

    const progress = target ? Math.min(1, count / target) : 0
    const r = 70
    const circumference = 2 * Math.PI * r

    return (
        <div className="rep-counter">
            <div className="rep-counter-head">
                <h4>Rep counter</h4>
                {onClose && <button type="button" className="link-button" onClick={onClose}>Close</button>}
            </div>

            <button type="button" className="rep-dial" onClick={() => bump(1)}
                aria-label={`Count rep. Current count ${count}${target ? ` of ${target}` : ''}`}>
                <svg viewBox="0 0 160 160" aria-hidden="true">
                    <circle cx="80" cy="80" r={r} className="rep-track" />
                    <circle cx="80" cy="80" r={r} className="rep-progress"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - progress)} />
                </svg>
                <span className="rep-count" aria-live="polite">{count}</span>
                <span className="rep-target">{target ? `of ${target}` : 'tap to count'}</span>
            </button>

            <div className="rep-controls">
                <button type="button" onClick={() => bump(-1)} aria-label="Remove one rep">−1</button>
                <button type="button" onClick={() => setCount(0)}>Reset</button>
                <button type="button" className="primary" onClick={logSet} disabled={!count}>Log set</button>
            </div>
            <p className="hint">Tap the dial or press Space. ↓ removes a rep.</p>

            <div className="rep-options">
                <label>
                    Tempo guide
                    <select value={tempo} onChange={(e) => setTempo(Number(e.target.value))}>
                        <option value={0}>Off</option>
                        <option value={2}>2s / rep</option>
                        <option value={3}>3s / rep</option>
                        <option value={4}>4s / rep</option>
                    </select>
                </label>
                <button type="button" className={motion === 'on' ? 'toggle on' : 'toggle'} onClick={toggleMotion}>
                    {motion === 'on' ? 'Motion counting on' : 'Count with phone motion'}
                </button>
            </div>
            {motion === 'on' && <p className="hint">Hold or strap your phone to the moving limb. Each full up-down counts as one rep.</p>}
            {motion === 'unsupported' && <p className="hint">This device doesn't report motion. Tap to count instead.</p>}
            {motion === 'denied' && <p className="hint">Motion access was blocked. Tap to count instead.</p>}

            {rest !== null && (
                <div className={rest > 0 ? 'rest-timer' : 'rest-timer done'} role="timer">
                    {rest > 0 ? (
                        <>
                            <span>Rest</span>
                            <strong>{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</strong>
                            <button type="button" className="link-button" onClick={() => setRest(rest + 15)}>+15s</button>
                            <button type="button" className="link-button" onClick={() => setRest(null)}>Skip</button>
                        </>
                    ) : (
                        <>
                            <span>Rest over. Start your next set</span>
                            <button type="button" className="link-button" onClick={() => setRest(null)}>Dismiss</button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default RepCounter
