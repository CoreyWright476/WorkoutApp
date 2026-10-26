// Stick-figure keyframes for each movement pattern, used by <DemoClip>.
//
// A pose is a set of joint angles in degrees. Limbs (t1/s1 front thigh/shin,
// t2/s2 rear thigh/shin, u/f upper arm/forearm) are measured from straight
// down, positive = toward the direction the figure faces. The torso `tor` is
// measured from straight up, positive = leaning forward. The figure is then
// placed so its lowest foot (or hand, for floor exercises) touches the ground
// and the `anchor` joint sits at a fixed x (or x/y for hanging exercises).

export const SEGMENTS = { thigh: 34, shin: 34, torso: 50, neck: 16, upperArm: 26, forearm: 24 }
export const GROUND_Y = 182

const standing = { t1: 0, s1: 0, t2: 0, s2: 0, tor: 0, u: 0, f: 0 }

export const PATTERNS = {
    squat: {
        label: 'Squat',
        anchor: { joint: 'foot1', x: 100 },
        prop: 'shoulders',
        frames: [
            { ...standing, t2: 4, s2: 4, u: 90, f: 90 },
            { t1: 80, s1: -30, t2: 84, s2: -26, tor: 38, u: 70, f: 85 }
        ]
    },
    hinge: {
        label: 'Hip hinge',
        anchor: { joint: 'foot1', x: 90 },
        prop: 'hands',
        frames: [
            { ...standing, t2: 3, s2: 3 },
            { t1: 22, s1: -8, t2: 25, s2: -5, tor: 78, u: 0, f: 0 }
        ]
    },
    lunge: {
        label: 'Lunge',
        anchor: { joint: 'foot1', x: 120 },
        prop: 'hands',
        frames: [
            { ...standing, t1: 25, s1: 0, t2: -25, s2: -25 },
            { t1: 85, s1: 0, t2: -10, s2: -85, tor: 0, u: 0, f: 0 }
        ]
    },
    horizontal_push: {
        label: 'Horizontal push',
        anchor: { joint: 'foot1', x: 40 },
        handsOnGround: true,
        frames: [
            { t1: -65, s1: -65, t2: -65, s2: -65, tor: 65, u: 0, f: 0 },
            { t1: -71, s1: -71, t2: -71, s2: -71, tor: 71, u: -40, f: 40 }
        ]
    },
    vertical_push: {
        label: 'Overhead press',
        anchor: { joint: 'foot1', x: 100 },
        prop: 'hands',
        frames: [
            { ...standing, t2: 3, s2: 3, u: 30, f: 170 },
            { ...standing, t2: 3, s2: 3, u: 178, f: 178 }
        ]
    },
    horizontal_pull: {
        label: 'Row',
        anchor: { joint: 'foot1', x: 85 },
        prop: 'hands',
        frames: [
            { t1: 18, s1: -6, t2: 20, s2: -4, tor: 62, u: 0, f: 0 },
            { t1: 18, s1: -6, t2: 20, s2: -4, tor: 62, u: -65, f: -5 }
        ]
    },
    vertical_pull: {
        label: 'Vertical pull',
        anchor: { joint: 'hand', x: 112, y: 40 },
        bar: true,
        frames: [
            { t1: 10, s1: -25, t2: 5, s2: -35, tor: 0, u: 178, f: 178 },
            { t1: 20, s1: -20, t2: 15, s2: -30, tor: -5, u: 40, f: 170 }
        ]
    },
    curl: {
        label: 'Curl',
        anchor: { joint: 'foot1', x: 100 },
        prop: 'hands',
        frames: [
            { ...standing, t2: 3, s2: 3, u: 0, f: 5 },
            { ...standing, t2: 3, s2: 3, u: 12, f: 150 }
        ]
    },
    core_hold: {
        label: 'Core hold',
        anchor: { joint: 'foot1', x: 45 },
        handsOnGround: true,
        frames: [
            { t1: -77, s1: -77, t2: -77, s2: -77, tor: 77, u: 0, f: 90 },
            { t1: -78, s1: -78, t2: -78, s2: -78, tor: 78, u: 0, f: 90 }
        ]
    },
    cardio: {
        label: 'Cardio',
        anchor: { joint: 'hip', x: 100 },
        frames: [
            { t1: 38, s1: -10, t2: -25, s2: -75, tor: 10, u: -35, f: 55 },
            { t1: -25, s1: -75, t2: 38, s2: -10, tor: 10, u: 40, f: 115 }
        ]
    }
}

const rad = (deg) => (deg * Math.PI) / 180
const down = (deg, len) => ({ x: Math.sin(rad(deg)) * len, y: Math.cos(rad(deg)) * len })
const up = (deg, len) => ({ x: Math.sin(rad(deg)) * len, y: -Math.cos(rad(deg)) * len })
const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y })

// Joint positions for a pose, placed on the ground / anchor.
export const solvePose = (pose, pattern) => {
    const S = SEGMENTS
    const hip = { x: 0, y: 0 }
    const knee1 = add(hip, down(pose.t1, S.thigh))
    const foot1 = add(knee1, down(pose.s1, S.shin))
    const knee2 = add(hip, down(pose.t2, S.thigh))
    const foot2 = add(knee2, down(pose.s2, S.shin))
    const shoulder = add(hip, up(pose.tor, S.torso))
    const head = add(shoulder, up(pose.tor, S.neck))
    const elbow = add(shoulder, down(pose.u, S.upperArm))
    const hand = add(elbow, down(pose.f, S.forearm))
    const joints = { hip, knee1, foot1, knee2, foot2, shoulder, head, elbow, hand }

    const anchorPoint = joints[pattern.anchor.joint]
    let dy
    if (pattern.anchor.y !== undefined) {
        dy = pattern.anchor.y - anchorPoint.y
    } else {
        const contacts = [foot1.y, foot2.y]
        if (pattern.handsOnGround) contacts.push(hand.y, elbow.y)
        dy = GROUND_Y - Math.max(...contacts)
    }
    const dx = pattern.anchor.x - anchorPoint.x

    return Object.fromEntries(
        Object.entries(joints).map(([k, p]) => [k, { x: p.x + dx, y: p.y + dy }])
    )
}

export const interpolatePose = (a, b, t) =>
    Object.fromEntries(Object.keys(a).map((k) => [k, a[k] + (b[k] - a[k]) * t]))
