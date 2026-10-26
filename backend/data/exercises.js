// Default exercise library, seeded into an empty database on startup.
// `pattern` selects the built-in animated demonstration clip; users can
// attach their own video via `demoUrl` from the exercise page.
module.exports = [
    {
        name: 'Back Squat', muscleGroup: 'legs', equipment: 'barbell',
        metricType: 'weight_reps', pattern: 'squat',
        instructions: [
            'Bar on upper back, feet shoulder-width apart',
            'Brace your core and sit hips back and down',
            'Descend until thighs are at least parallel',
            'Drive up through the whole foot, keeping chest tall'
        ]
    },
    {
        name: 'Goblet Squat', muscleGroup: 'legs', equipment: 'dumbbell',
        metricType: 'weight_reps', pattern: 'squat',
        instructions: [
            'Hold a dumbbell vertically against your chest',
            'Squat down between your knees, elbows inside thighs',
            'Stand back up, squeezing glutes at the top'
        ]
    },
    {
        name: 'Bodyweight Squat', muscleGroup: 'legs', equipment: 'none',
        metricType: 'bodyweight_reps', pattern: 'squat',
        instructions: [
            'Feet shoulder-width, arms forward for balance',
            'Sit back and down to a comfortable depth',
            'Stand up fully between reps'
        ]
    },
    {
        name: 'Deadlift', muscleGroup: 'posterior chain', equipment: 'barbell',
        metricType: 'weight_reps', pattern: 'hinge',
        instructions: [
            'Bar over mid-foot, grip just outside the knees',
            'Flat back, pull the slack out of the bar',
            'Push the floor away and stand tall',
            'Hinge at the hips to lower under control'
        ]
    },
    {
        name: 'Romanian Deadlift', muscleGroup: 'hamstrings', equipment: 'barbell',
        metricType: 'weight_reps', pattern: 'hinge',
        instructions: [
            'Start standing with soft knees',
            'Push hips back, sliding the bar down your thighs',
            'Stop when you feel a hamstring stretch, then return'
        ]
    },
    {
        name: 'Kettlebell Swing', muscleGroup: 'posterior chain', equipment: 'kettlebell',
        metricType: 'weight_reps', pattern: 'hinge',
        instructions: [
            'Hike the bell back between your legs',
            'Snap hips forward to float the bell to chest height',
            'Let it fall back and hinge to absorb it'
        ]
    },
    {
        name: 'Walking Lunge', muscleGroup: 'legs', equipment: 'dumbbell',
        metricType: 'weight_reps', pattern: 'lunge',
        instructions: [
            'Step forward and lower the back knee toward the floor',
            'Keep the front knee tracking over the toes',
            'Push through the front foot into the next step'
        ]
    },
    {
        name: 'Bulgarian Split Squat', muscleGroup: 'legs', equipment: 'dumbbell',
        metricType: 'weight_reps', pattern: 'lunge',
        instructions: [
            'Rear foot elevated on a bench',
            'Lower straight down until the front thigh is parallel',
            'Drive up through the front heel'
        ]
    },
    {
        name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell',
        metricType: 'weight_reps', pattern: 'horizontal_push',
        instructions: [
            'Eyes under the bar, shoulder blades pinned back',
            'Lower the bar to mid-chest with elbows ~45°',
            'Press up and slightly back over the shoulders'
        ]
    },
    {
        name: 'Dumbbell Bench Press', muscleGroup: 'chest', equipment: 'dumbbell',
        metricType: 'weight_reps', pattern: 'horizontal_push',
        instructions: [
            'Lie back with dumbbells at chest level',
            'Press up until arms are straight',
            'Lower slowly to a deep stretch'
        ]
    },
    {
        name: 'Push-up', muscleGroup: 'chest', equipment: 'none',
        metricType: 'bodyweight_reps', pattern: 'horizontal_push',
        instructions: [
            'Hands under shoulders, body in a straight line',
            'Lower chest to just above the floor',
            'Press back up without letting hips sag'
        ]
    },
    {
        name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'barbell',
        metricType: 'weight_reps', pattern: 'vertical_push',
        instructions: [
            'Bar on front of shoulders, glutes squeezed',
            'Press straight up, moving your head back then through',
            'Lock out overhead with biceps by the ears'
        ]
    },
    {
        name: 'Dumbbell Shoulder Press', muscleGroup: 'shoulders', equipment: 'dumbbell',
        metricType: 'weight_reps', pattern: 'vertical_push',
        instructions: [
            'Dumbbells at shoulder height, palms forward',
            'Press overhead until arms are straight',
            'Lower back to the shoulders under control'
        ]
    },
    {
        name: 'Barbell Row', muscleGroup: 'back', equipment: 'barbell',
        metricType: 'weight_reps', pattern: 'horizontal_pull',
        instructions: [
            'Hinge to roughly 45°, flat back',
            'Row the bar to your lower ribs',
            'Lower with control, keeping the torso still'
        ]
    },
    {
        name: 'Dumbbell Row', muscleGroup: 'back', equipment: 'dumbbell',
        metricType: 'weight_reps', pattern: 'horizontal_pull',
        instructions: [
            'One hand and knee on a bench',
            'Pull the dumbbell toward your hip',
            'Lower until the arm is straight'
        ]
    },
    {
        name: 'Pull-up', muscleGroup: 'back', equipment: 'pull-up bar',
        metricType: 'bodyweight_reps', pattern: 'vertical_pull',
        instructions: [
            'Hang with hands just wider than shoulders',
            'Pull until your chin clears the bar',
            'Lower to a full hang each rep'
        ]
    },
    {
        name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable',
        metricType: 'weight_reps', pattern: 'vertical_pull',
        instructions: [
            'Thighs locked under the pad, wide grip',
            'Pull the bar to your upper chest',
            'Let it rise slowly to full arm extension'
        ]
    },
    {
        name: 'Biceps Curl', muscleGroup: 'arms', equipment: 'dumbbell',
        metricType: 'weight_reps', pattern: 'curl',
        instructions: [
            'Stand tall, elbows pinned to your sides',
            'Curl the weights up without swinging',
            'Lower all the way down'
        ]
    },
    {
        name: 'Hammer Curl', muscleGroup: 'arms', equipment: 'dumbbell',
        metricType: 'weight_reps', pattern: 'curl',
        instructions: [
            'Palms facing each other',
            'Curl up keeping wrists neutral',
            'Lower slowly'
        ]
    },
    {
        name: 'Plank', muscleGroup: 'core', equipment: 'none',
        metricType: 'time', pattern: 'core_hold',
        instructions: [
            'Forearms under shoulders, body straight',
            'Squeeze glutes and brace your abs',
            'Hold without letting hips sag or pike'
        ]
    },
    {
        name: 'Side Plank', muscleGroup: 'core', equipment: 'none',
        metricType: 'time', pattern: 'core_hold',
        instructions: [
            'Elbow under shoulder, feet stacked',
            'Lift hips into a straight line',
            'Hold, then switch sides'
        ]
    },
    {
        name: 'Running', muscleGroup: 'cardio', equipment: 'none',
        metricType: 'distance_time', pattern: 'cardio',
        instructions: [
            'Warm up with 5 minutes of easy jogging',
            'Land under your hips with a quick cadence',
            'Keep most runs at a conversational pace'
        ]
    },
    {
        name: 'Rowing Machine', muscleGroup: 'cardio', equipment: 'rower',
        metricType: 'distance_time', pattern: 'cardio',
        instructions: [
            'Drive with legs, then lean back, then pull arms',
            'Return arms, then torso, then legs',
            'Aim for a smooth, steady stroke rate'
        ]
    },
    {
        name: 'Jump Rope', muscleGroup: 'cardio', equipment: 'jump rope',
        metricType: 'time', pattern: 'cardio',
        instructions: [
            'Small jumps on the balls of your feet',
            'Turn the rope with your wrists, not your arms',
            'Keep elbows close to your sides'
        ]
    }
]
