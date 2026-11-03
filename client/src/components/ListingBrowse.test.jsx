import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ListingBrowse from "./ListingBrowse"
import { sampleListings } from "../test/helpers"

function setup(listings = sampleListings) {
  const onBuy = vi.fn()
  render(<ListingBrowse listings={listings} onBuy={onBuy} />)
  return { onBuy, user: userEvent.setup() }
}

describe("ListingBrowse", () => {
  it("shows unsold listings and hides sold ones", () => {
    setup()
    expect(screen.getByText("Superman Lunchbox")).toBeInTheDocument()
    expect(screen.getByText("Star Wars Tin")).toBeInTheDocument()
    expect(screen.queryByText("Peanuts Box")).not.toBeInTheDocument()
  })

  it("filters as the user types in the search box", async () => {
    const { user } = setup()
    await user.type(screen.getByPlaceholderText("Search listings..."), "star")
    expect(screen.getByText("Star Wars Tin")).toBeInTheDocument()
    expect(screen.queryByText("Superman Lunchbox")).not.toBeInTheDocument()
  })

  it("builds the maker dropdown from the listings and filters by it", async () => {
    const { user } = setup()
    const makerSelect = screen.getByDisplayValue("All Makers")
    expect(screen.getByRole("option", { name: "Aladdin" })).toBeInTheDocument()

    await user.selectOptions(makerSelect, "Thermos")
    expect(screen.getByText("Star Wars Tin")).toBeInTheDocument()
    expect(screen.queryByText("Superman Lunchbox")).not.toBeInTheDocument()
  })

  it("filters by age and condition", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByDisplayValue("All Ages"), "1980s")
    expect(screen.queryByText("Superman Lunchbox")).not.toBeInTheDocument()

    await user.selectOptions(screen.getByDisplayValue("All Conditions"), "Good")
    expect(screen.queryByText("Star Wars Tin")).not.toBeInTheDocument()
  })

  it("passes Buy clicks up with the listing id", async () => {
    const { onBuy, user } = setup()
    const buttons = screen.getAllByRole("button", { name: "Buy" })
    await user.click(buttons[0])
    expect(onBuy).toHaveBeenCalledWith("l1")
  })

  it("renders no cards for an empty list", () => {
    setup([])
    expect(screen.queryByRole("button", { name: "Buy" })).not.toBeInTheDocument()
  })
})
