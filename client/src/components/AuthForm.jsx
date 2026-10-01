import { useState } from "react"

export default function AuthForm({ onRegister, onLogin, error }) {
  const [mode, setMode] = useState("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  function handleSubmit(e) {
    e.preventDefault()
    if (mode === "login") {
      onLogin(username, password)
    } else {
      onRegister(username, password)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>{mode === "login" ? "Log In" : "Register"}</h2>
      {error && <p className="error-text">{error}</p>}
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" className="btn btn-primary">
        {mode === "login" ? "Log In" : "Register"}
      </button>
      <button type="button" className="btn" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
      </button>
    </form>
  )
}