import React, { useState } from 'react';
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useWorkoutsContext } from '../context/WorkoutsContext'
import { compactNumber, formatDate, formatSet } from '../utils/format'

const WorkoutDetails = ({ workout }) => {
    const { dispatch } = useWorkoutsContext()
    const [error, setError] = useState(null)

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${workout.title}"?`)) return
        try {
            const json = await api.deleteWorkout(workout._id)
            dispatch({ type: 'DELETE_WORKOUT', payload: json })
        } catch (e) {
            setError(e.message)
        }
    }

    const { summary } = workout

    return (
        <div className="workout-details">
            <h4>{workout.title}</h4>
            <p className="muted">
                {formatDate(workout.date)}
                {workout.planDay && <> · {workout.planDay}</>}
                {summary && <> · {summary.sets} sets{summary.volume > 0 && <> · {compactNumber(summary.volume)} kg volume</>}</>}
            </p>
            <ul className="entry-list">
                {workout.entries.map((entry, i) => (
                    <li key={i}>
                        {entry.exercise
                            ? <Link to={`/exercises/${entry.exercise._id}`}>{entry.exercise.name}</Link>
                            : <span>Deleted exercise</span>}
                        <span className="muted">
                            {entry.sets.map((set) => formatSet(set, entry.exercise && entry.exercise.metricType)).join(', ')}
                        </span>
                    </li>
                ))}
            </ul>
            {workout.notes && <p className="notes">{workout.notes}</p>}
            {error && <div className="error">{error}</div>}
            <button type="button" className="delete" onClick={handleDelete} aria-label={`Delete ${workout.title}`}>Delete</button>
        </div>
    )
}

export default WorkoutDetails
