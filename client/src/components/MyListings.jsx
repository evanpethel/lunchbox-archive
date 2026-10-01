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
    <div style={{ padding: 16 }}>
      <h2>My Listings</h2>
      {myListings.length === 0 && <p>You haven't created any listings yet.</p>}
      {myListings.map(listing => (
        <div key={listing.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <strong>{listing.title}</strong> — ${listing.price} — {listing.status}
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setEditingId(listing.id)}>Edit</button>
            <button onClick={() => onDelete(listing.id)} style={{ marginLeft: 8 }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}