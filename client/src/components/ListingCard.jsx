export default function ListingCard({ listing, onBuy }) {
  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 12, width: 220 }}>
      <img src={listing.photoUrl} alt={listing.title} style={{ width: "100%", borderRadius: 4 }} />
      <h3 style={{ fontSize: 16, margin: "8px 0 4px" }}>{listing.title}</h3>
      <p style={{ margin: 0, fontSize: 14, color: "#555" }}>{listing.age} · {listing.condition} · {listing.maker}</p>
      <p style={{ fontWeight: "bold", marginTop: 8 }}>${listing.price}</p>

      {listing.status === "listed" ? (
        <button onClick={() => onBuy(listing.id)}>Buy</button>
      ) : (
        <p style={{ color: "gray" }}>Sold</p>
      )}
    </div>
  )
}