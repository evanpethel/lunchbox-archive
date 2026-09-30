import { useState } from "react"

export function useListingFilters(listings) {
  const [searchTerm, setSearchTerm] = useState("")
  const [ageFilter, setAgeFilter] = useState("")
  const [conditionFilter, setConditionFilter] = useState("")
  const [makerFilter, setMakerFilter] = useState("")

  const ages = [...new Set(listings.map(l => l.age))]
  const conditions = [...new Set(listings.map(l => l.condition))]
  const makers = [...new Set(listings.map(l => l.maker))]

  const filtered = listings.filter(listing => {
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