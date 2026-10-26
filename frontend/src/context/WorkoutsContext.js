import React, { createContext, useContext, useEffect, useReducer } from 'react'
import { api } from '../api'

export const WorkoutsContext = createContext()

const initialState = { workouts: null, exercises: null, error: null }

export const workoutsReducer = (state, action) => {
    switch (action.type) {
        case 'SET_WORKOUTS':
            return { ...state, workouts: action.payload }
        case 'CREATE_WORKOUT':
            return { ...state, workouts: [action.payload, ...(state.workouts || [])] }
        case 'DELETE_WORKOUT':
            return { ...state, workouts: (state.workouts || []).filter((w) => w._id !== action.payload._id) }
        case 'SET_EXERCISES':
            return { ...state, exercises: action.payload }
        case 'CREATE_EXERCISE':
            return {
                ...state,
                exercises: [...(state.exercises || []), action.payload]
                    .sort((a, b) => a.name.localeCompare(b.name))
            }
        case 'UPDATE_EXERCISE':
            return {
                ...state,
                exercises: (state.exercises || []).map((ex) => ex._id === action.payload._id ? action.payload : ex)
            }
        case 'SET_ERROR':
            return { ...state, error: action.payload }
        default:
            return state
    }
}

export const WorkoutsContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(workoutsReducer, initialState)

    useEffect(() => {
        Promise.all([api.getWorkouts(), api.getExercises()])
            .then(([workouts, exercises]) => {
                dispatch({ type: 'SET_WORKOUTS', payload: workouts })
                dispatch({ type: 'SET_EXERCISES', payload: exercises })
            })
            .catch((error) => dispatch({ type: 'SET_ERROR', payload: error.message }))
    }, [])

    return (
        <WorkoutsContext.Provider value={{ ...state, dispatch }}>
            {children}
        </WorkoutsContext.Provider>
    )
}

export const useWorkoutsContext = () => {
    const context = useContext(WorkoutsContext)
    if (!context) {
        throw Error('useWorkoutsContext must be used inside a WorkoutsContextProvider')
    }
    return context
}
