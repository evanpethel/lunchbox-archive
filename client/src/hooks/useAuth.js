import { useState, useEffect } from "react"

const API_BASE = "/api"

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [error, setError] = useState("")

  // Restore session on page load if a token was saved
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

  async function register(username, password) {
    setError("")
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error.message)
        return false
      }

      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("currentUser", JSON.stringify(data.user))
      setCurrentUser(data.user)
      return true
    } catch (err) {
      setError("Could not reach the server. Is it running?")
      return false
    }
  }

  async function login(username, password) {
    setError("")
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error.message)
        return false
      }

      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("currentUser", JSON.stringify(data.user))
      setCurrentUser(data.user)
      return true
    } catch (err) {
      setError("Could not reach the server. Is it running?")
      return false
    }
  }

  function logout() {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("currentUser")
    setCurrentUser(null)
  }

  return { currentUser, register, login, logout, error }
}