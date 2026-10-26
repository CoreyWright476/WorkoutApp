import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useWorkoutsContext } from '../context/WorkoutsContext'
import { METRIC_TYPES, FIELD_LABELS, todayInput } from '../utils/format'
import ExercisePicker from './ExercisePicker'
import RepCounter from './RepCounter'
import DemoClip from './DemoClip'

let nextKey = 1
const emptySet = () => ({ reps: '', load: '', durationSec: '', distanceM: '' })
const newEntry = (exerciseId, planned) => ({
    key: nextKey++,
    exerciseId,
    target: planned || null,
    sets: Array.from({ length: (planned && planned.sets) || 1 }, () => emptySet())
})

const isEmptySet = (set) => ['reps', 'load', 'durationSec', 'distanceM'].every((f) => set[f] === '' || set[f] === undefined)

// Logs a training session: several exercises, each with sets measured by the
// exercise's metric type. Can be pre-filled from a plan day.
export const WorkoutForm = ({ plan, planDay, initialExerciseId }) => {
    const { exercises, dispatch } = useWorkoutsContext()
    const navigate = useNavigate()

    const [title, setTitle] = useState('')
    const [date, setDate] = useState(todayInput())
    const [notes, setNotes] = useState('')
    const [entries, setEntries] = useState([])
    const [adding, setAdding] = useState('')
    const [counterFor, setCounterFor] = useState(null)
    const [demoFor, setDemoFor] = useState(null)
    const [error, setError] = useState(null)
    const [saving, setSaving] = useState(false)

    // Pre-fill from the chosen plan day or exercise
    useEffect(() => {
        if (plan && planDay) {
            setTitle(`${plan.name}: ${planDay.name}`)
            setEntries(planDay.exercises
                .filter((p) => p.exercise)
                .map((p) => newEntry(p.exercise._id, p)))
        } else if (initialExerciseId) {
            setEntries([newEntry(initialExerciseId)])
        }
    }, [plan, planDay, initialExerciseId])

    if (!exercises) return <p>Loading exercises…</p>
    const byId = Object.fromEntries(exercises.map((ex) => [ex._id, ex]))

    const updateEntry = (key, fn) => setEntries((list) => list.map((e) => e.key === key ? fn(e) : e))
    const updateSet = (key, index, field, value) => updateEntry(key, (e) => ({
        ...e,
        sets: e.sets.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }))
    const addSet = (key) => updateEntry(key, (e) => {
        const last = e.sets[e.sets.length - 1]
        return { ...e, sets: [...e.sets, { ...emptySet(), load: last ? last.load : '' }] }
    })
    const removeSet = (key, index) => updateEntry(key, (e) => ({ ...e, sets: e.sets.filter((_, i) => i !== index) }))
    const removeEntry = (key) => setEntries((list) => list.filter((e) => e.key !== key))

    const addExercise = (id) => {
        if (!id) return
        setEntries((list) => [...list, newEntry(id)])
        setAdding('')
    }

    // Rep counter result goes into the first set without reps, or a new set.
    const logReps = (key, reps) => updateEntry(key, (e) => {
        const index = e.sets.findIndex((s) => s.reps === '')
        if (index >= 0) {
            return { ...e, sets: e.sets.map((s, i) => i === index ? { ...s, reps: String(reps) } : s) }
        }
        const last = e.sets[e.sets.length - 1]
        return { ...e, sets: [...e.sets, { ...emptySet(), load: last ? last.load : '', reps: String(reps) }] }
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        const payloadEntries = []
        for (const entry of entries) {
            const ex = byId[entry.exerciseId]
            if (!ex) continue
            const fields = METRIC_TYPES[ex.metricType].fields
            const sets = entry.sets.filter((s) => !isEmptySet(s)).map((s) => {
                const out = {}
                fields.forEach((f) => { if (s[f] !== '') out[f] = Number(s[f]) })
                return out
            })
            if (sets.some((s) => Object.values(s).some((v) => !Number.isFinite(v) || v < 0))) {
                return setError(`${ex.name}: enter numbers only`)
            }
            if (sets.length) payloadEntries.push({ exercise: entry.exerciseId, sets })
        }
        if (!payloadEntries.length) {
            return setError('Log at least one set')
        }

        setSaving(true)
        try {
            const json = await api.createWorkout({
                title: title.trim() || 'Workout',
                date: new Date(`${date}T12:00:00`),
                notes,
                plan: plan ? plan._id : undefined,
                planDay: planDay ? planDay.name : undefined,
                entries: payloadEntries
            })
            dispatch({ type: 'CREATE_WORKOUT', payload: json })
            navigate('/')
        } catch (err) {
            setError(err.message)
            setSaving(false)
        }
    }

    return (
        <form className="create session-form" onSubmit={handleSubmit}>
            <div className="form-row">
                <label>
                    Workout title
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leg day" />
                </label>
                <label className="narrow">
                    Date
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </label>
            </div>

            {entries.map((entry) => {
                const ex = byId[entry.exerciseId]
                if (!ex) return null
                const fields = METRIC_TYPES[ex.metricType].fields
                const countsReps = fields.includes('reps')
                const target = entry.target
                return (
                    <section className="entry-card" key={entry.key}>
                        <div className="entry-head">
                            <div>
                                <h4><Link to={`/exercises/${ex._id}`}>{ex.name}</Link></h4>
                                {target && (
                                    <p className="muted">
                                        Plan: {target.sets} × {target.reps ? `${target.reps} reps` : `${target.durationSec}s`}
                                        {target.targetLoad ? ` @ ${target.targetLoad} kg` : ''}
                                        {target.restSec ? ` · rest ${target.restSec}s` : ''}
                                    </p>
                                )}
                            </div>
                            <div className="entry-actions">
                                <button type="button" className="link-button" onClick={() => setDemoFor(demoFor === entry.key ? null : entry.key)}>
                                    {demoFor === entry.key ? 'Hide demo' : 'Demo'}
                                </button>
                                {countsReps && (
                                    <button type="button" className="link-button" onClick={() => setCounterFor(counterFor === entry.key ? null : entry.key)}>
                                        {counterFor === entry.key ? 'Hide counter' : 'Rep counter'}
                                    </button>
                                )}
                                <button type="button" className="link-button danger" onClick={() => removeEntry(entry.key)}>Remove</button>
                            </div>
                        </div>

                        {demoFor === entry.key && <DemoClip exercise={ex} />}

                        <table className="sets-table">
                            <thead>
                                <tr>
                                    <th>Set</th>
                                    {fields.map((f) => <th key={f}>{FIELD_LABELS[f]}</th>)}
                                    <th><span className="visually-hidden">Remove</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {entry.sets.map((set, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        {fields.map((f) => (
                                            <td key={f}>
                                                <input
                                                    type="number" inputMode="decimal" min="0" step="any"
                                                    aria-label={`Set ${i + 1} ${FIELD_LABELS[f]}`}
                                                    value={set[f]}
                                                    placeholder={target && f === 'reps' && target.reps ? String(target.reps)
                                                        : target && f === 'durationSec' && target.durationSec ? String(target.durationSec)
                                                        : target && f === 'load' && target.targetLoad ? String(target.targetLoad) : ''}
                                                    onChange={(e) => updateSet(entry.key, i, f, e.target.value)}
                                                />
                                            </td>
                                        ))}
                                        <td>
                                            {entry.sets.length > 1 && (
                                                <button type="button" className="icon-button" onClick={() => removeSet(entry.key, i)} aria-label={`Remove set ${i + 1}`}>×</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="button" className="link-button" onClick={() => addSet(entry.key)}>+ Add set</button>

                        {counterFor === entry.key && (
                            <RepCounter
                                target={target && target.reps}
                                restSec={(target && target.restSec) || 90}
                                onLog={(reps) => logReps(entry.key, reps)}
                                onClose={() => setCounterFor(null)}
                            />
                        )}
                    </section>
                )
            })}

            <label>
                Add exercise
                <ExercisePicker exercises={exercises} value={adding} onChange={addExercise} />
            </label>

            <label>
                Notes
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="How did it feel?" />
            </label>

            <button disabled={saving}>{saving ? 'Saving…' : 'Save workout'}</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}
