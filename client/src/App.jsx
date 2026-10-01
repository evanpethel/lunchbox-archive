import { useState, useEffect } from "react"
import ListingBrowse from "./components/ListingBrowse"
import ListingForm from "./components/ListingForm"
import MyListings from "./components/MyListings"
import AuthForm from "./components/AuthForm"
import { useAuth } from "./hooks/useAuth"
import "./App.css"

const API_BASE = "/api"

function App() {
  const [listings, setListings] = useState([])
  const [view, setView] = useState("browse")
  const [apiError, setApiError] = useState("")
  const { currentUser, register, login, logout, error } = useAuth()

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
    }
  }

  async function fetchListings() {
    try {
      const res = await fetch(`${API_BASE}/listings`)
      const data = await res.json()
      if (res.ok) {
        setListings(data.listings)
      }
    } catch (err) {
      setApiError("Could not load listings. Is the server running?")
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  async function handleCreate(newListing) {
    setApiError("")
    try {
      const res = await fetch(`${API_BASE}/listings`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...newListing, sellerId: currentUser.id })
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error.message)
        return
      }
      await fetchListings()
      setView("browse")
    } catch (err) {
      setApiError("Could not create listing. Is the server running?")
    }
  }

  async function handleBuy(id) {
    setApiError("")
    try {
      const res = await fetch(`${API_BASE}/listings/${id}/buy`, {
        method: "POST",
        headers: authHeaders()
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error.message)  // e.g. "Listing is no longer available" on 409
        await fetchListings()  // refresh so the now-stale "available" card updates
        return
      }
      await fetchListings()
    } catch (err) {
      setApiError("Could not complete purchase. Is the server running?")
    }
  }

  async function handleEdit(id, updatedFields) {
    setApiError("")
    try {
      const res = await fetch(`${API_BASE}/listings/${id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(updatedFields)
      })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error.message)
        return
      }
      await fetchListings()
    } catch (err) {
      setApiError("Could not save changes. Is the server running?")
    }
  }

  async function handleDelete(id) {
    setApiError("")
    try {
      const res = await fetch(`${API_BASE}/listings/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      })
      if (!res.ok) {
        const data = await res.json()
        setApiError(data.error.message)
        return
      }
      await fetchListings()
    } catch (err) {
      setApiError("Could not delete listing. Is the server running?")
    }
  }

  return (
    <div>
      <header className="app-header">
        <h1>Lunchbox Archive</h1>
        {currentUser ? (
          <div className="nav-actions">
            <span>Hi, {currentUser.username}</span>
            <button className="btn" onClick={() => setView("browse")}>Browse</button>
            <button className="btn" onClick={() => setView("create")}>Create Listing</button>
            <button className="btn" onClick={() => setView("mine")}>My Listings</button>
            <button className="btn btn-primary" onClick={logout}>Log Out</button>
          </div>
        ) : null}
      </header>

      {apiError && <p className="error-text" style={{ padding: "0 24px" }}>{apiError}</p>}

      {!currentUser && <AuthForm onRegister={register} onLogin={login} error={error} />}
      {currentUser && view === "browse" && <ListingBrowse listings={listings} onBuy={handleBuy} />}
      {currentUser && view === "create" && <ListingForm onSubmit={handleCreate} submitLabel="Create Listing" />}
      {currentUser && view === "mine" && (
        <MyListings listings={listings} currentUser={currentUser} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  )
}

export default App