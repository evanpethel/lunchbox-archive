import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ListingForm from "./ListingForm"

const values = {
  Title: "Superman Lunchbox",
  Description: "Metal box with matching thermos",
  Price: "45.50",
  "Photo URL": "https://example.com/superman.jpg",
  "Age (e.g. 1960s)": "1960s",
  Condition: "Good",
  Maker: "Aladdin"
}

async function fillAll(user, skip = null) {
  for (const [placeholder, value] of Object.entries(values)) {
    if (placeholder === skip) continue
    await user.type(screen.getByPlaceholderText(placeholder), value)
  }
}

function setup(props = {}) {
  const onSubmit = vi.fn()
  render(<ListingForm onSubmit={onSubmit} {...props} />)
  return { onSubmit, user: userEvent.setup() }
}

describe("ListingForm", () => {
  it("submits all fields with the price converted to a number", async () => {
    const { onSubmit, user } = setup()
    await fillAll(user)
    await user.click(screen.getByRole("button", { name: "Create Listing" }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({
      title: "Superman Lunchbox",
      description: "Metal box with matching thermos",
      price: 45.5,
      photoUrl: "https://example.com/superman.jpg",
      age: "1960s",
      condition: "Good",
      maker: "Aladdin"
    })
  })

  it("does not submit and names the missing field", async () => {
    const { onSubmit, user } = setup()
    await fillAll(user, "Maker")
    await user.click(screen.getByRole("button", { name: "Create Listing" }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText("Missing required field: maker")).toBeInTheDocument()
  })

  it("rejects a completely empty form", async () => {
    const { onSubmit, user } = setup()
    await user.click(screen.getByRole("button", { name: "Create Listing" }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText("Missing required field: title")).toBeInTheDocument()
  })

  it("clears the form after a successful create", async () => {
    const { user } = setup()
    await fillAll(user)
    await user.click(screen.getByRole("button", { name: "Create Listing" }))

    expect(screen.getByPlaceholderText("Title")).toHaveValue("")
    expect(screen.getByPlaceholderText("Price")).toHaveValue(null)
  })

  it("clears a previous error after a successful submit", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: "Create Listing" }))
    expect(screen.getByText(/Missing required field/)).toBeInTheDocument()

    await fillAll(user)
    await user.click(screen.getByRole("button", { name: "Create Listing" }))
    expect(screen.queryByText(/Missing required field/)).not.toBeInTheDocument()
  })

  it("uses a custom submit label", () => {
    setup({ submitLabel: "Save Changes" })
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument()
  })

  it("pre-fills initial values when editing and keeps them after saving", async () => {
    const initialValues = {
      title: "Old Title", description: "Old desc", price: 20,
      photoUrl: "http://x/y.jpg", age: "1970s", condition: "Fair", maker: "Thermos"
    }
    const { onSubmit, user } = setup({ initialValues, submitLabel: "Save Changes" })

    expect(screen.getByPlaceholderText("Title")).toHaveValue("Old Title")

    await user.clear(screen.getByPlaceholderText("Title"))
    await user.type(screen.getByPlaceholderText("Title"), "New Title")
    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "New Title", price: 20 }))
    expect(screen.getByPlaceholderText("Title")).toHaveValue("New Title")
  })
})
