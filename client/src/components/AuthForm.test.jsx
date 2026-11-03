import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import AuthForm from "./AuthForm"

function setup(props = {}) {
  const onLogin = vi.fn()
  const onRegister = vi.fn()
  render(<AuthForm onLogin={onLogin} onRegister={onRegister} {...props} />)
  return { onLogin, onRegister, user: userEvent.setup() }
}

describe("AuthForm", () => {
  it("starts in log-in mode", () => {
    setup()
    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Need an account? Register" })).toBeInTheDocument()
  })

  it("calls onLogin with the typed credentials", async () => {
    const { onLogin, onRegister, user } = setup()
    await user.type(screen.getByPlaceholderText("Username"), "evan")
    await user.type(screen.getByPlaceholderText("Password"), "secret")
    await user.click(screen.getByRole("button", { name: "Log In" }))

    expect(onLogin).toHaveBeenCalledWith("evan", "secret")
    expect(onRegister).not.toHaveBeenCalled()
  })

  it("switches to register mode and calls onRegister", async () => {
    const { onLogin, onRegister, user } = setup()
    await user.click(screen.getByRole("button", { name: "Need an account? Register" }))
    expect(screen.getByRole("heading", { name: "Register" })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText("Username"), "newuser")
    await user.type(screen.getByPlaceholderText("Password"), "pw12345")
    await user.click(screen.getByRole("button", { name: "Register" }))

    expect(onRegister).toHaveBeenCalledWith("newuser", "pw12345")
    expect(onLogin).not.toHaveBeenCalled()
  })

  it("can switch back to log-in mode", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: "Need an account? Register" }))
    await user.click(screen.getByRole("button", { name: "Already have an account? Log in" }))
    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument()
  })

  it("masks the password field", () => {
    setup()
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "password")
  })

  it("shows an error message when one is passed in", () => {
    setup({ error: "Your session expired. Please log in again." })
    expect(screen.getByText("Your session expired. Please log in again.")).toBeInTheDocument()
  })

  it("shows no error text by default", () => {
    setup()
    expect(document.querySelector(".error-text")).toBeNull()
  })
})
