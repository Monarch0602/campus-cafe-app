// Simple in-memory user session
// Stores the currently logged in user across screens
// No OTP required — phone number is the unique identifier

let currentUser = null

export function setCurrentUser(user) {
    currentUser = user
}

export function getCurrentUser() {
    return currentUser
}

export function clearCurrentUser() {
    currentUser = null
}
