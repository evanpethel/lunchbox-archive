import ListingCard from "./ListingCard"
import { useListingFilters } from "../hooks/useListingFilters"

export default function ListingBrowse({ listings, onBuy }) {
  const {
    searchTerm, setSearchTerm,
    ageFilter, setAgeFilter,
    conditionFilter, setConditionFilter,
    makerFilter, setMakerFilter,
    ages, conditions, makers,
    filtered
  } = useListingFilters(listings)

  return (
    <div>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search listings..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}>
          <option value="">All Ages</option>
          {ages.map(age => <option key={age} value={age}>{age}</option>)}
        </select>
        <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}>
          <option value="">All Conditions</option>
          {conditions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={makerFilter} onChange={e => setMakerFilter(e.target.value)}>
          <option value="">All Makers</option>
          {makers.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="listing-grid">
        {filtered.map(listing => (
          <ListingCard key={listing.id} listing={listing} onBuy={onBuy} />
        ))}
      </div>
    </div>
  )
}