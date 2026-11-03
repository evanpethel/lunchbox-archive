import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useListingFilters } from "./useListingFilters"

const listings = [
  { id: "1", title: "Superman Lunchbox", description: "Metal box with thermos", age: "1960s", condition: "Good", maker: "Aladdin", status: "listed" },
  { id: "2", title: "Star Wars Tin", description: "Rare Empire Strikes Back art", age: "1980s", condition: "Mint", maker: "Thermos", status: "listed" },
  { id: "3", title: "Peanuts Box", description: "Snoopy and friends", age: "1960s", condition: "Fair", maker: "Thermos", status: "listed" },
  { id: "4", title: "Sold Hot Wheels", description: "Already purchased", age: "1970s", condition: "Good", maker: "Mattel", status: "sold" }
]

function setup() {
  return renderHook(() => useListingFilters(listings))
}

describe("useListingFilters", () => {
  it("returns every active listing when no filters are set", () => {
    const { result } = setup()
    expect(result.current.filtered.map(l => l.id)).toEqual(["1", "2", "3"])
  })

  it("excludes sold listings from results", () => {
    const { result } = setup()
    expect(result.current.filtered.some(l => l.status === "sold")).toBe(false)
  })

  it("builds unique filter options from active listings only", () => {
    const { result } = setup()
    expect(result.current.ages).toEqual(["1960s", "1980s"])
    expect(result.current.conditions).toEqual(["Good", "Mint", "Fair"])
    expect(result.current.makers).toEqual(["Aladdin", "Thermos"])
  })

  it("searches titles case-insensitively", () => {
    const { result } = setup()
    act(() => result.current.setSearchTerm("SUPERMAN"))
    expect(result.current.filtered.map(l => l.id)).toEqual(["1"])
  })

  it("searches descriptions too", () => {
    const { result } = setup()
    act(() => result.current.setSearchTerm("snoopy"))
    expect(result.current.filtered.map(l => l.id)).toEqual(["3"])
  })

  it("filters by age", () => {
    const { result } = setup()
    act(() => result.current.setAgeFilter("1960s"))
    expect(result.current.filtered.map(l => l.id)).toEqual(["1", "3"])
  })

  it("filters by condition", () => {
    const { result } = setup()
    act(() => result.current.setConditionFilter("Mint"))
    expect(result.current.filtered.map(l => l.id)).toEqual(["2"])
  })

  it("filters by maker", () => {
    const { result } = setup()
    act(() => result.current.setMakerFilter("Thermos"))
    expect(result.current.filtered.map(l => l.id)).toEqual(["2", "3"])
  })

  it("combines filters with AND logic", () => {
    const { result } = setup()
    act(() => {
      result.current.setAgeFilter("1960s")
      result.current.setMakerFilter("Thermos")
    })
    expect(result.current.filtered.map(l => l.id)).toEqual(["3"])
  })

  it("returns an empty list when nothing matches", () => {
    const { result } = setup()
    act(() => result.current.setSearchTerm("no such lunchbox"))
    expect(result.current.filtered).toEqual([])
  })

  it("does not match a sold listing even when searched by its title", () => {
    const { result } = setup()
    act(() => result.current.setSearchTerm("hot wheels"))
    expect(result.current.filtered).toEqual([])
  })

  it("restores all results when a filter is cleared", () => {
    const { result } = setup()
    act(() => result.current.setMakerFilter("Aladdin"))
    expect(result.current.filtered).toHaveLength(1)
    act(() => result.current.setMakerFilter(""))
    expect(result.current.filtered).toHaveLength(3)
  })

  it("handles an empty listings array", () => {
    const { result } = renderHook(() => useListingFilters([]))
    expect(result.current.filtered).toEqual([])
    expect(result.current.makers).toEqual([])
  })
})