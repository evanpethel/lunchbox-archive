import { useState } from "react"
import { mockListings } from "./mockListings"
import ListingBrowse from "./components/ListingBrowse"
import ListingForm from "./components/ListingForm"
import "./App.css"

function App() {
  const [listings, setListings] = useState(mockListings)
  const [view, setView] = useState("browse")

  function handleCreate(newListing) {
    setListings([...listings, newListing])
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
      <button onClick={() => setView(view === "browse" ? "create" : "browse")}>
        {view === "browse" ? "Create Listing" : "Back to Browse"}
      </button>

      {view === "browse" && <ListingBrowse listings={listings} onBuy={handleBuy} />}
      {view === "create" && <ListingForm onCreate={handleCreate} />}
    </div>
  )
}

export default App