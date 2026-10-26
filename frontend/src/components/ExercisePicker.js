import React from 'react'

// <select> of the exercise library grouped by muscle group.
const ExercisePicker = ({ exercises, value, onChange, placeholder = 'Choose an exercise…', id }) => {
    const groups = {}
    exercises.forEach((ex) => {
        (groups[ex.muscleGroup] = groups[ex.muscleGroup] || []).push(ex)
    })

    return (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">{placeholder}</option>
            {Object.keys(groups).sort().map((group) => (
                <optgroup key={group} label={group}>
                    {groups[group].map((ex) => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
                </optgroup>
            ))}
        </select>
    )
}

export default ExercisePicker
