import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import MyListings from "./MyListings"
import { sampleListings } from "../test/helpers"

const seller = { id: "u1", username: "seed_seller1" }

function setup(props = {}) {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  render(
    <MyListings
      listings={sampleListings}
      currentUser={seller}
      onEdit={onEdit}
      onDelete={onDelete}
      {...props}
    />
  )
  return { onEdit, onDelete, user: userEvent.setup() }
}

describe("MyListings", () => {
  it("shows only the current user's listings, including sold ones", () => {
    setup()
    expect(screen.getByText("Superman Lunchbox")).toBeInTheDocument()
    expect(screen.getByText("Peanuts Box")).toBeInTheDocument()
    expect(screen.queryByText("Star Wars Tin")).not.toBeInTheDocument()
  })

  it("shows each listing's status", () => {
    setup()
    expect(screen.getByText(/— listed$/)).toBeInTheDocument()
    expect(screen.getByText(/— sold$/)).toBeInTheDocument()
  })

  it("shows an empty message when the user has no listings", () => {
    setup({ currentUser: { id: "nobody", username: "x" } })
    expect(screen.getByText("You haven't created any listings yet.")).toBeInTheDocument()
  })

  it("calls onDelete with the listing id", async () => {
    const { onDelete, user } = setup()
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])
    expect(onDelete).toHaveBeenCalledWith("l1")
  })

  it("opens the edit form pre-filled with the listing", async () => {
    const { user } = setup()
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0])
    expect(screen.getByRole("heading", { name: "Save Changes" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Title")).toHaveValue("Superman Lunchbox")
  })

  it("saves edits through onEdit and returns to the list", async () => {
    const { onEdit, user } = setup()
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0])

    const title = screen.getByPlaceholderText("Title")
    await user.clear(title)
    await user.type(title, "Renamed")
    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(onEdit).toHaveBeenCalledWith("l1", expect.objectContaining({ title: "Renamed", price: 45 }))
    expect(screen.getByRole("heading", { name: "My Listings" })).toBeInTheDocument()
  })
})
