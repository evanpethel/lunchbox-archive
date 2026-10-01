import { useState } from "react"
import { mockListings } from "./mockListings"
import ListingBrowse from "./components/ListingBrowse"
import ListingForm from "./components/ListingForm"
import AuthForm from "./components/AuthForm"
import { useAuth } from "./hooks/useAuth"
import "./App.css"

function App() {
  const [listings, setListings] = useState(mockListings)
  const [view, setView] = useState("browse")
  const { currentUser, register, login, logout, error } = useAuth()

  function handleCreate(newListing) {
    setListings([...listings, { ...newListing, sellerId: currentUser.id }])
    setView("browse")
  }

  function handleBuy(id) {
    setListings(listings.map(listing =>
      listing.id === id ? { ...listing, status: "sold" } : listing
    ))
  }

  return (
    <div>
      <h1>Lunchbox Archive</h1>

      {currentUser ? (
        <div style={{ marginBottom: 16 }}>
          <span>Logged in as {currentUser.username}</span>
          <button onClick={logout} style={{ marginLeft: 8 }}>Log Out</button>
          <button onClick={() => setView(view === "browse" ? "create" : "browse")} style={{ marginLeft: 8 }}>
            {view === "browse" ? "Create Listing" : "Back to Browse"}
          </button>
        </div>
      ) : (
        <AuthForm onRegister={register} onLogin={login} error={error} />
      )}

      {currentUser && view === "browse" && <ListingBrowse listings={listings} onBuy={handleBuy} />}
      {currentUser && view === "create" && <ListingForm onCreate={handleCreate} />}
    </div>
  )
}

export default App