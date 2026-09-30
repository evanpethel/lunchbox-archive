import { useState } from "react"

export function useListingFilters(listings) {
  const [searchTerm, setSearchTerm] = useState("")
  const [ageFilter, setAgeFilter] = useState("")
  const [conditionFilter, setConditionFilter] = useState("")
  const [makerFilter, setMakerFilter] = useState("")

  // Only consider active (unsold) listings for filter options and results
  const activeListings = listings.filter(l => l.status === "listed")

  const ages = [...new Set(activeListings.map(l => l.age))]
  const conditions = [...new Set(activeListings.map(l => l.condition))]
  const makers = [...new Set(activeListings.map(l => l.maker))]

  const filtered = activeListings.filter(listing => {
    const matchesSearch =
      searchTerm === "" ||
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchTerm.toLowerCase())

    return (
      matchesSearch &&
      (ageFilter === "" || listing.age === ageFilter) &&
      (conditionFilter === "" || listing.condition === conditionFilter) &&
      (makerFilter === "" || listing.maker === makerFilter)
    )
  })

  return {
    searchTerm, setSearchTerm,
    ageFilter, setAgeFilter,
    conditionFilter, setConditionFilter,
    makerFilter, setMakerFilter,
    ages, conditions, makers,
    filtered
  }
}