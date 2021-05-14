class FriendlyError extends Error {
    constructor(message) {
        super(message)
    }
}

module.exports.FriendlyError = FriendlyError;