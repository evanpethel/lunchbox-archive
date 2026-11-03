import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAuth } from "./useAuth"

// Builds a fake JWT whose payload has the given expiry. The signature is not
// checked on the client, so it only needs to be shaped like a token.
function makeToken(secondsFromNow) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }))
  return `header.${payload}.signature`
}

function mockFetchOnce({ ok, body }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, json: async () => body }))
}

const user = { id: "u1", username: "evan" }

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useAuth: session restore", () => {
  it("starts logged out when nothing is saved", () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.currentUser).toBeNull()
    expect(result.current.error).toBe("")
  })

  it("restores the user when the saved token is still valid", () => {
    localStorage.setItem("accessToken", makeToken(600))
    localStorage.setItem("currentUser", JSON.stringify(user))
    const { result } = renderHook(() => useAuth())
    expect(result.current.currentUser).toEqual(user)
  })

  it("clears an expired session and explains why", () => {
    localStorage.setItem("accessToken", makeToken(-60))
    localStorage.setItem("currentUser", JSON.stringify(user))
    const { result } = renderHook(() => useAuth())
    expect(result.current.currentUser).toBeNull()
    expect(result.current.error).toMatch(/session expired/i)
    expect(localStorage.getItem("accessToken")).toBeNull()
    expect(localStorage.getItem("currentUser")).toBeNull()
  })

  it("treats a malformed token as expired", () => {
    localStorage.setItem("accessToken", "not-a-jwt")
    localStorage.setItem("currentUser", JSON.stringify(user))
    const { result } = renderHook(() => useAuth())
    expect(result.current.currentUser).toBeNull()
  })
})

describe("useAuth: login", () => {
  it("stores the token and user on success", async () => {
    mockFetchOnce({ ok: true, body: { accessToken: "tok", user } })
    const { result } = renderHook(() => useAuth())

    let ok
    await act(async () => { ok = await result.current.login("evan", "pw") })

    expect(ok).toBe(true)
    expect(result.current.currentUser).toEqual(user)
    expect(localStorage.getItem("accessToken")).toBe("tok")
    expect(JSON.parse(localStorage.getItem("currentUser"))).toEqual(user)
  })

  it("posts the credentials to the login endpoint", async () => {
    mockFetchOnce({ ok: true, body: { accessToken: "tok", user } })
    const { result } = renderHook(() => useAuth())
    await act(async () => { await result.current.login("evan", "pw") })

    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe("/api/auth/login")
    expect(options.method).toBe("POST")
    expect(JSON.parse(options.body)).toEqual({ username: "evan", password: "pw" })
  })

  it("shows the server's message and stays logged out on failure", async () => {
    mockFetchOnce({ ok: false, body: { error: { message: "Invalid credentials" } } })
    const { result } = renderHook(() => useAuth())

    let ok
    await act(async () => { ok = await result.current.login("evan", "wrong") })

    expect(ok).toBe(false)
    expect(result.current.error).toBe("Invalid credentials")
    expect(result.current.currentUser).toBeNull()
    expect(localStorage.getItem("accessToken")).toBeNull()
  })

  it("reports a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))
    const { result } = renderHook(() => useAuth())

    let ok
    await act(async () => { ok = await result.current.login("evan", "pw") })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/could not reach the server/i)
  })
})

describe("useAuth: register", () => {
  it("logs the new user in on success", async () => {
    mockFetchOnce({ ok: true, body: { accessToken: "tok", user } })
    const { result } = renderHook(() => useAuth())

    let ok
    await act(async () => { ok = await result.current.register("evan", "pw") })

    expect(ok).toBe(true)
    expect(fetch.mock.calls[0][0]).toBe("/api/auth/register")
    expect(result.current.currentUser).toEqual(user)
  })

  it("reports a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")))
    const { result } = renderHook(() => useAuth())

    let ok
    await act(async () => { ok = await result.current.register("evan", "pw") })

    expect(ok).toBe(false)
    expect(result.current.error).toMatch(/could not reach the server/i)
  })

  it("shows the error when the username is taken", async () => {
    mockFetchOnce({ ok: false, body: { error: { message: "Username already taken" } } })
    const { result } = renderHook(() => useAuth())

    await act(async () => { await result.current.register("evan", "pw") })

    expect(result.current.error).toBe("Username already taken")
    expect(result.current.currentUser).toBeNull()
  })
})

describe("useAuth: logout and expireSession", () => {
  async function loggedIn() {
    mockFetchOnce({ ok: true, body: { accessToken: "tok", user } })
    const hook = renderHook(() => useAuth())
    await act(async () => { await hook.result.current.login("evan", "pw") })
    return hook
  }

  it("logout clears the user and the stored session", async () => {
    const { result } = await loggedIn()
    act(() => result.current.logout())
    expect(result.current.currentUser).toBeNull()
    expect(localStorage.getItem("accessToken")).toBeNull()
    expect(localStorage.getItem("currentUser")).toBeNull()
  })

  it("expireSession logs out and sets a session-expired message", async () => {
    const { result } = await loggedIn()
    act(() => result.current.expireSession())
    expect(result.current.currentUser).toBeNull()
    expect(result.current.error).toMatch(/session expired/i)
    expect(localStorage.getItem("accessToken")).toBeNull()
  })

  it("clears the old error when a new login starts", async () => {
    const { result } = await loggedIn()
    act(() => result.current.expireSession())
    mockFetchOnce({ ok: true, body: { accessToken: "tok2", user } })
    await act(async () => { await result.current.login("evan", "pw") })
    expect(result.current.error).toBe("")
  })
})