import { useState } from "react"
import ListingForm from "./ListingForm"

export default function MyListings({ listings, currentUser, onEdit, onDelete }) {
  const [editingId, setEditingId] = useState(null)

  const myListings = listings.filter(l => l.sellerId === currentUser.id)

  if (editingId !== null) {
    const listing = myListings.find(l => l.id === editingId)
    return (
      <ListingForm
        initialValues={listing}
        submitLabel="Save Changes"
        onSubmit={updated => {
          onEdit(editingId, updated)
          setEditingId(null)
        }}
      />
    )
  }

  return (
    <div style={{ padding: "16px 24px" }}>
      <h2 style={{ fontFamily: "'Bungee', cursive", color: "var(--teal)", fontSize: 22 }}>My Listings</h2>
      {myListings.length === 0 && <p>You haven't created any listings yet.</p>}
      {myListings.map(listing => (
        <div key={listing.id} className="my-listing-row">
          <span><strong>{listing.title}</strong> — ${listing.price} — {listing.status}</span>
          <div>
            <button className="btn btn-primary" onClick={() => setEditingId(listing.id)}>Edit</button>
            <button className="btn" style={{ borderColor: "var(--rust)", color: "var(--rust)", marginLeft: 8 }} onClick={() => onDelete(listing.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}