import { useState } from "react"

// Temporary in-memory "database" of registered users until the real backend exists
const mockUsers = []

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [error, setError] = useState("")

  function register(username, password) {
    if (!username || !password) {
      setError("Username and password are required")
      return false
    }
    if (mockUsers.some(u => u.username === username)) {
      setError("Username already taken")
      return false
    }
    const newUser = { id: Date.now(), username, password }
    mockUsers.push(newUser)
    setCurrentUser(newUser)
    setError("")
    return true
  }

  function login(username, password) {
    const user = mockUsers.find(u => u.username === username && u.password === password)
    if (!user) {
      setError("Invalid credentials")
      return false
    }
    setCurrentUser(user)
    setError("")
    return true
  }

  function logout() {
    setCurrentUser(null)
  }

  return { currentUser, register, login, logout, error }
}