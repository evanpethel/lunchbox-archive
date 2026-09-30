import { mockListings } from "../mockListings"
import ListingCard from "./ListingCard"
import { useListingFilters } from "../hooks/useListingFilters"

export default function ListingBrowse() {
  const {
    searchTerm, setSearchTerm,
    ageFilter, setAgeFilter,
    conditionFilter, setConditionFilter,
    makerFilter, setMakerFilter,
    ages, conditions, makers,
    filtered
  } = useListingFilters(mockListings)

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search listings..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginRight: 8, padding: 4 }}
        />

        <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}>
          <option value="">All Ages</option>
          {ages.map(age => (
            <option key={age} value={age}>{age}</option>
          ))}
        </select>

        <select value={conditionFilter} onChange={e => setConditionFilter(e.target.value)}>
          <option value="">All Conditions</option>
          {conditions.map(condition => (
            <option key={condition} value={condition}>{condition}</option>
          ))}
        </select>

        <select value={makerFilter} onChange={e => setMakerFilter(e.target.value)}>
          <option value="">All Makers</option>
          {makers.map(maker => (
            <option key={maker} value={maker}>{maker}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {filtered.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  )
}