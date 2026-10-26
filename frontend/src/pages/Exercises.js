import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useWorkoutsContext } from '../context/WorkoutsContext'
import { StickFigure } from '../components/DemoClip'
import { METRIC_TYPES } from '../utils/format'
import { PATTERNS } from '../utils/demoPoses'

const NewExerciseForm = ({ onDone }) => {
    const { dispatch } = useWorkoutsContext()
    const [form, setForm] = useState({ name: '', muscleGroup: '', equipment: 'none', metricType: 'weight_reps', pattern: 'squat', demoUrl: '' })
    const [error, setError] = useState(null)
    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

    const submit = async (e) => {
        e.preventDefault()
        try {
            const json = await api.createExercise({ ...form, muscleGroup: form.muscleGroup || 'full body' })
            dispatch({ type: 'CREATE_EXERCISE', payload: json })
            onDone()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <form className="create card" onSubmit={submit}>
            <h3>New exercise</h3>
            <label>Name<input value={form.name} onChange={set('name')} required /></label>
            <div className="form-row">
                <label>Muscle group<input value={form.muscleGroup} onChange={set('muscleGroup')} placeholder="e.g. legs" /></label>
                <label>Equipment<input value={form.equipment} onChange={set('equipment')} /></label>
            </div>
            <div className="form-row">
                <label>Tracked by
                    <select value={form.metricType} onChange={set('metricType')}>
                        {Object.entries(METRIC_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </label>
                <label>Movement (for the demo)
                    <select value={form.pattern} onChange={set('pattern')}>
                        {Object.entries(PATTERNS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </label>
            </div>
            <label>Demo video URL (optional)<input value={form.demoUrl} onChange={set('demoUrl')} placeholder="YouTube link or .mp4" /></label>
            <button>Add exercise</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}

const Exercises = () => {
    const { exercises } = useWorkoutsContext()
    const [query, setQuery] = useState('')
    const [group, setGroup] = useState('')
    const [creating, setCreating] = useState(false)

    if (!exercises) return <p>Loading…</p>

    const groups = [...new Set(exercises.map((ex) => ex.muscleGroup))].sort()
    const shown = exercises.filter((ex) =>
        (!group || ex.muscleGroup === group) &&
        ex.name.toLowerCase().includes(query.trim().toLowerCase()))

    return (
        <div className="page">
            <div className="page-head">
                <h2>Exercise library</h2>
                <button type="button" className="button" onClick={() => setCreating(!creating)}>
                    {creating ? 'Cancel' : 'New exercise'}
                </button>
            </div>
            {creating && <NewExerciseForm onDone={() => setCreating(false)} />}

            <div className="filter-row">
                <input type="search" placeholder="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search exercises" />
                <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Muscle group">
                    <option value="">All muscle groups</option>
                    {groups.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>

            <div className="exercise-grid">
                {shown.map((ex) => (
                    <Link to={`/exercises/${ex._id}`} key={ex._id} className="exercise-card">
                        <StickFigure pattern={ex.pattern} equipment={ex.equipment} playing={false} />
                        <div>
                            <h4>{ex.name}</h4>
                            <p className="muted">{ex.muscleGroup} · {ex.equipment}</p>
                            {ex.demoUrl && <span className="badge">Video</span>}
                        </div>
                    </Link>
                ))}
                {!shown.length && <p className="muted">No exercises match.</p>}
            </div>
        </div>
    )
}

export default Exercises
