const mongoose = require('mongoose')

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id)

// Copies only the listed keys that are present on `body`.
const pick = (body, keys) => keys.reduce((out, key) => {
    if (body[key] !== undefined) out[key] = body[key]
    return out
}, {})

module.exports = { isValidId, pick }
