import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ListingCard from "./ListingCard"
import { sampleListings } from "../test/helpers"

const [listed, , sold] = sampleListings

describe("ListingCard", () => {
  it("shows the title, details, price and photo", () => {
    render(<ListingCard listing={listed} onBuy={() => {}} />)
    expect(screen.getByRole("heading", { name: "Superman Lunchbox" })).toBeInTheDocument()
    expect(screen.getByText("1960s · Good · Aladdin")).toBeInTheDocument()
    expect(screen.getByText("$45")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Superman Lunchbox" })).toHaveAttribute("src", "http://x/1.jpg")
  })

  it("calls onBuy with the listing id when Buy is clicked", async () => {
    const onBuy = vi.fn()
    render(<ListingCard listing={listed} onBuy={onBuy} />)
    await userEvent.click(screen.getByRole("button", { name: "Buy" }))
    expect(onBuy).toHaveBeenCalledWith("l1")
  })

  it("shows Sold instead of a Buy button for sold listings", () => {
    render(<ListingCard listing={sold} onBuy={() => {}} />)
    expect(screen.getByText("Sold")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Buy" })).not.toBeInTheDocument()
  })
})
