import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useWorkoutsContext } from '../context/WorkoutsContext'
import DemoClip from '../components/DemoClip'
import ProgressChart from '../components/ProgressChart'
import ProgressTimeline from '../components/ProgressTimeline'
import { formatDate } from '../utils/format'

const ExerciseDetail = () => {
    const { id } = useParams()
    const { workouts, dispatch } = useWorkoutsContext()
    const [data, setData] = useState(null)
    const [target, setTarget] = useState('')
    const [appliedTarget, setAppliedTarget] = useState('')
    const [videoUrl, setVideoUrl] = useState('')
    const [editingVideo, setEditingVideo] = useState(false)
    const [error, setError] = useState(null)

    // Reload when the exercise, target or logged workouts change
    useEffect(() => {
        api.getProgress(id, appliedTarget)
            .then((json) => {
                setData(json)
                setVideoUrl(json.exercise.demoUrl || '')
                setError(null)
            })
            .catch((e) => setError(e.message))
    }, [id, appliedTarget, workouts])

    if (error) return <div className="page"><div className="error">{error}</div></div>
    if (!data) return <div className="page"><p>Loading…</p></div>

    const { exercise, history, projection } = data
    const unit = projection.metric.unit

    const saveVideo = async (e) => {
        e.preventDefault()
        try {
            const json = await api.updateExercise(exercise._id, { demoUrl: videoUrl.trim() })
            dispatch({ type: 'UPDATE_EXERCISE', payload: json })
            setData({ ...data, exercise: json })
            setEditingVideo(false)
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="page">
            <p><Link to="/exercises">← Exercise library</Link></p>
            <div className="page-head">
                <div>
                    <h2>{exercise.name}</h2>
                    <p className="muted">{exercise.muscleGroup} · {exercise.equipment} · tracked by {projection.metric.label}</p>
                </div>
                <Link className="button" to="/log" state={{ exerciseId: exercise._id }}>Log this exercise</Link>
            </div>

            <div className="detail-grid">
                <section className="card">
                    <h3>Demonstration</h3>
                    <DemoClip exercise={exercise} />
                    {exercise.instructions.length > 0 && (
                        <ol className="instructions">
                            {exercise.instructions.map((step) => <li key={step}>{step}</li>)}
                        </ol>
                    )}
                    {editingVideo ? (
                        <form className="inline-form" onSubmit={saveVideo}>
                            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="Paste a YouTube link or .mp4 URL" aria-label="Demo video URL" />
                            <button>Save</button>
                            <button type="button" className="link-button" onClick={() => setEditingVideo(false)}>Cancel</button>
                        </form>
                    ) : (
                        <button type="button" className="link-button" onClick={() => setEditingVideo(true)}>
                            {exercise.demoUrl ? 'Change demo video' : 'Add your own demo video'}
                        </button>
                    )}
                </section>

                <section className="card">
                    <h3>Progress</h3>
                    {projection.basis === 'none' ? (
                        <p className="muted">No sessions logged for this exercise yet. Log one to start tracking your {projection.metric.label} and see a progress timeline.</p>
                    ) : (
                        <>
                            <p className="muted">{projection.metric.label} ({unit}) per session{exercise.metricType === 'weight_reps' && ', estimated from your best set'}</p>
                            <ProgressChart history={history} projection={projection} />
                            <form className="inline-form" onSubmit={(e) => { e.preventDefault(); setAppliedTarget(target) }}>
                                <label htmlFor="target">Target ({unit})</label>
                                <input id="target" type="number" min="0" step="any" value={target}
                                    placeholder={String(projection.target)} onChange={(e) => setTarget(e.target.value)} />
                                <button>Update timeline</button>
                            </form>
                            <ProgressTimeline projection={projection} />
                        </>
                    )}
                </section>
            </div>

            {history.length > 0 && (
                <section className="card">
                    <h3>History</h3>
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>{projection.metric.label} ({unit})</th><th>Sets</th><th>Reps</th><th>Volume (kg)</th></tr></thead>
                        <tbody>
                            {[...history].reverse().map((p) => (
                                <tr key={p.workoutId}><td>{formatDate(p.date)}</td><td>{p.value}</td><td>{p.sets}</td><td>{p.reps}</td><td>{p.volume}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    )
}

export default ExerciseDetail
