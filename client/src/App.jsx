import { useState } from "react"
import { mockListings } from "./mockListings"
import ListingBrowse from "./components/ListingBrowse"
import ListingForm from "./components/ListingForm"
import MyListings from "./components/MyListings"
import AuthForm from "./components/AuthForm"
import { useAuth } from "./hooks/useAuth"
import "./App.css"

function App() {
  const [listings, setListings] = useState(mockListings)
  const [view, setView] = useState("browse")
  const { currentUser, register, login, logout, error } = useAuth()

  function handleCreate(newListing) {
    setListings([...listings, { ...newListing, id: Date.now(), status: "listed", sellerId: currentUser.id }])
    setView("browse")
  }

  function handleBuy(id) {
    setListings(listings.map(listing =>
      listing.id === id ? { ...listing, status: "sold" } : listing
    ))
  }

  function handleEdit(id, updatedFields) {
    setListings(listings.map(listing =>
      listing.id === id ? { ...listing, ...updatedFields } : listing
    ))
  }

  function handleDelete(id) {
    setListings(listings.filter(listing => listing.id !== id))
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