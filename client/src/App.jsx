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
  const { currentUser, register, login, logout, expireSession, error } = useAuth()

  // Single place for authenticated requests. If the server answers 401
  // (token missing, invalid, or expired), log the user out and return null
  // so callers can simply stop.
  async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
      }
    })

    if (res.status === 401) {
      expireSession()
      setView("browse")
      setApiError("")
      return null
    }

    return res
  }

  // The server returns listings one page at a time (10 per page). Keep asking
  // for pages until it says there are no more, so search and the filters,
  // which run in the browser, can see every listing.
  async function fetchListings() {
    try {
      let all = []
      let page = 1
      let hasMore = true

      while (hasMore && page <= 50) {  // 50 is a safety cap against a runaway loop
        const res = await fetch(`${API_BASE}/listings?page=${page}`)
        const data = await res.json()
        if (!res.ok) return
        all = all.concat(data.listings)
        hasMore = data.hasMore === true
        page += 1
      }

      setListings(all)
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
      // No sellerId here: the server takes the owner from the login token.
      const res = await apiFetch("/listings", {
        method: "POST",
        body: JSON.stringify(newListing)
      })
      if (!res) return
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
      const res = await apiFetch(`/listings/${id}/buy`, { method: "POST" })
      if (!res) return
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
      const res = await apiFetch(`/listings/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatedFields)
      })
      if (!res) return
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error.message)  // 403 shows "You do not own this listing."
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
      const res = await apiFetch(`/listings/${id}`, { method: "DELETE" })
      if (!res) return
      // Success is 204 No Content, so there is no body to parse.
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