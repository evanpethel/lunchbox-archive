export default function ListingCard({ listing, onBuy }) {
  return (
    <div className="listing-card">
      <img src={listing.photoUrl} alt={listing.title} />
      <div className="listing-card-body">
        <h3>{listing.title}</h3>
        <p className="listing-card-meta">{listing.age} · {listing.condition} · {listing.maker}</p>
        <p className="listing-card-price">${listing.price}</p>
        {listing.status === "listed" ? (
          <button className="btn-primary btn" onClick={() => onBuy(listing.id)}>Buy</button>
        ) : (
          <p className="sold-label">Sold</p>
        )}
      </div>
    </div>
  )
}