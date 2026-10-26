// Small wrapper around fetch for the backend API. Throws an Error carrying
// the server's message on non-2xx responses.
const request = async (path, options = {}) => {
    const response = await fetch(`/api${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok) {
        throw new Error(json.error || `Request failed (${response.status})`)
    }
    return json
}

export const api = {
    getWorkouts: () => request('/workouts'),
    createWorkout: (workout) => request('/workouts', { method: 'POST', body: workout }),
    deleteWorkout: (id) => request(`/workouts/${id}`, { method: 'DELETE' }),

    getExercises: () => request('/exercises'),
    getExercise: (id) => request(`/exercises/${id}`),
    createExercise: (exercise) => request('/exercises', { method: 'POST', body: exercise }),
    updateExercise: (id, changes) => request(`/exercises/${id}`, { method: 'PATCH', body: changes }),

    getPlans: () => request('/plans'),
    getPlan: (id) => request(`/plans/${id}`),
    createPlan: (plan) => request('/plans', { method: 'POST', body: plan }),
    generatePlan: (options) => request('/plans/generate', { method: 'POST', body: options }),
    deletePlan: (id) => request(`/plans/${id}`, { method: 'DELETE' }),

    getSummary: () => request('/metrics/summary'),
    getProgress: (exerciseId, target) =>
        request(`/metrics/exercise/${exerciseId}${target ? `?target=${encodeURIComponent(target)}` : ''}`)
}
