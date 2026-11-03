import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "./App"
import { makeToken, sampleListings } from "./test/helpers"

const user1 = { id: "u1", username: "seed_seller1" }

// Fake backend: routes are keyed "METHOD /path". A route returns
// { status, body } and anything unlisted gets a 404.
let routes
let calls

function jsonResponse({ status = 200, body } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (body === undefined) throw new Error("no body")
      return body
    }
  }
}

beforeEach(() => {
  calls = []
  routes = {
    "GET /api/listings": () => ({ status: 200, body: { listings: sampleListings } })
  }
  vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
    const method = options.method || "GET"
    calls.push({ url, method, options })
    const handler = routes[`${method} ${url}`]
    return jsonResponse(handler ? handler() : { status: 404, body: { error: { message: "not found" } } })
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function loginAsSeller() {
  localStorage.setItem("accessToken", makeToken(600))
  localStorage.setItem("currentUser", JSON.stringify(user1))
}

async function renderLoggedIn() {
  loginAsSeller()
  render(<App />)
  await screen.findByText("Star Wars Tin")
  return userEvent.setup()
}

const callsTo = (method, url) => calls.filter(c => c.method === method && c.url === url)

describe("App: logged out", () => {
  it("shows the log-in form and no navigation", () => {
    render(<App />)
    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Create Listing" })).not.toBeInTheDocument()
  })

  it("shows an error if listings cannot be loaded", async () => {
    fetch.mockRejectedValue(new Error("down"))
    render(<App />)
    expect(await screen.findByText("Could not load listings. Is the server running?")).toBeInTheDocument()
  })
})

describe("App: browsing", () => {
  it("loads and shows listings after login", async () => {
    await renderLoggedIn()
    expect(screen.getByText("Hi, seed_seller1")).toBeInTheDocument()
    expect(screen.getByText("Superman Lunchbox")).toBeInTheDocument()
    expect(screen.queryByText("Peanuts Box")).not.toBeInTheDocument()
  })
})

describe("App: buying", () => {
  it("sends the token, then refreshes the listings", async () => {
    const user = await renderLoggedIn()
    routes["POST /api/listings/l2/buy"] = () => ({ status: 200, body: { id: "l2", status: "sold" } })

    await user.click(screen.getAllByRole("button", { name: "Buy" })[1])

    await waitFor(() => expect(callsTo("POST", "/api/listings/l2/buy")).toHaveLength(1))
    const headers = callsTo("POST", "/api/listings/l2/buy")[0].options.headers
    expect(headers.Authorization).toMatch(/^Bearer header\./)
    await waitFor(() => expect(callsTo("GET", "/api/listings").length).toBeGreaterThanOrEqual(2))
  })

  it("shows the server message when the listing was already sold (409)", async () => {
    const user = await renderLoggedIn()
    routes["POST /api/listings/l2/buy"] = () => ({
      status: 409, body: { error: { message: "Listing is no longer available." } }
    })

    await user.click(screen.getAllByRole("button", { name: "Buy" })[1])

    expect(await screen.findByText("Listing is no longer available.")).toBeInTheDocument()
  })

  it("logs out with a session-expired message when the token is rejected (401)", async () => {
    const user = await renderLoggedIn()
    routes["POST /api/listings/l2/buy"] = () => ({
      status: 401, body: { error: { message: "Invalid or expired token." } }
    })

    await user.click(screen.getAllByRole("button", { name: "Buy" })[1])

    expect(await screen.findByRole("heading", { name: "Log In" })).toBeInTheDocument()
    expect(screen.getByText(/session expired/i)).toBeInTheDocument()
    expect(localStorage.getItem("accessToken")).toBeNull()
  })

  it("shows a message when the server cannot be reached", async () => {
    const user = await renderLoggedIn()
    // Make the next fetch (the buy request) fail at the network level
    fetch.mockImplementationOnce(async () => { throw new Error("offline") })

    await user.click(screen.getAllByRole("button", { name: "Buy" })[1])

    expect(await screen.findByText("Could not complete purchase. Is the server running?")).toBeInTheDocument()
  })
})

describe("App: creating a listing", () => {
  it("posts the form without a sellerId and returns to browse", async () => {
    const user = await renderLoggedIn()
    routes["POST /api/listings"] = () => ({ status: 201, body: { id: "new" } })

    await user.click(screen.getByRole("button", { name: "Create Listing" }))
    const fields = {
      Title: "New Box", Description: "Nice", Price: "12.5", "Photo URL": "http://x/n.jpg",
      "Age (e.g. 1960s)": "1990s", Condition: "Good", Maker: "Thermos"
    }
    for (const [placeholder, value] of Object.entries(fields)) {
      fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } })
    }
    await user.click(screen.getAllByRole("button", { name: "Create Listing" })[1])

    await waitFor(() => expect(callsTo("POST", "/api/listings")).toHaveLength(1))
    const sent = JSON.parse(callsTo("POST", "/api/listings")[0].options.body)
    expect(sent).toMatchObject({ title: "New Box", price: 12.5 })
    expect(sent).not.toHaveProperty("sellerId")
    expect(await screen.findByPlaceholderText("Search listings...")).toBeInTheDocument()
  })
})

describe("App: my listings", () => {
  it("deletes a listing (204, no body) and refreshes", async () => {
    const user = await renderLoggedIn()
    routes["DELETE /api/listings/l1"] = () => ({ status: 204 })

    await user.click(screen.getByRole("button", { name: "My Listings" }))
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])

    await waitFor(() => expect(callsTo("DELETE", "/api/listings/l1")).toHaveLength(1))
    await waitFor(() => expect(callsTo("GET", "/api/listings").length).toBeGreaterThanOrEqual(2))
  })

  it("shows the server's message when an edit is forbidden (403)", async () => {
    const user = await renderLoggedIn()
    routes["PUT /api/listings/l1"] = () => ({
      status: 403, body: { error: { message: "You do not own this listing." } }
    })

    await user.click(screen.getByRole("button", { name: "My Listings" }))
    await user.click(screen.getAllByRole("button", { name: "Edit" })[0])
    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    expect(await screen.findByText("You do not own this listing.")).toBeInTheDocument()
  })

  it("logs out when a delete is rejected with 401", async () => {
    const user = await renderLoggedIn()
    routes["DELETE /api/listings/l1"] = () => ({
      status: 401, body: { error: { message: "Invalid or expired token." } }
    })

    await user.click(screen.getByRole("button", { name: "My Listings" }))
    await user.click(screen.getAllByRole("button", { name: "Delete" })[0])

    expect(await screen.findByText(/session expired/i)).toBeInTheDocument()
  })
})

describe("App: log out", () => {
  it("returns to the log-in form", async () => {
    const user = await renderLoggedIn()
    await user.click(screen.getByRole("button", { name: "Log Out" }))
    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument()
  })
})
