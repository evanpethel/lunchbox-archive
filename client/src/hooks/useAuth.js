import { useState, useEffect } from "react"

const API_BASE = "/api"

// Reads the "exp" (expiry, in seconds) from a JWT without verifying it.
// This is only used to avoid showing a logged-in UI with a dead token;
// the server is still the one that actually enforces authentication.
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    return !payload.exp || payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null)
  const [error, setError] = useState("")

  // Restore session on page load if a saved token is still valid
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    const savedToken = localStorage.getItem("accessToken")

    if (savedUser && savedToken && !isTokenExpired(savedToken)) {
      setCurrentUser(JSON.parse(savedUser))
    } else if (savedUser || savedToken) {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("currentUser")
      if (savedUser) {
        setError("Your session expired. Please log in again.")
      }
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

  // Called when the server rejects our token (401): log out and tell the user why.
  function expireSession() {
    logout()
    setError("Your session expired. Please log in again.")
  }

  return { currentUser, register, login, logout, expireSession, error }
}