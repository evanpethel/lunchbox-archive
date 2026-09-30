import { useState } from "react"

const initialForm = {
  title: "",
  description: "",
  price: "",
  photoUrl: "",
  age: "",
  condition: "",
  maker: ""
}

export default function ListingForm({ onCreate }) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()

    // Required-field check per Story 2 acceptance criteria
    const missingField = Object.entries(form).find(([, value]) => value === "")
    if (missingField) {
      setError(`Missing required field: ${missingField[0]}`)
      return
    }

    const newListing = {
      ...form,
      id: Date.now(),      // temporary local id until the backend assigns real ones
      price: parseFloat(form.price),
      status: "listed",
      sellerId: null        // will come from auth once login exists
    }

    onCreate(newListing)
    setForm(initialForm)
    setError("")
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320, padding: 16 }}>
      <h2>Create a Listing</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} />
      <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
      <input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={handleChange} />
      <input name="photoUrl" placeholder="Photo URL" value={form.photoUrl} onChange={handleChange} />
      <input name="age" placeholder="Age (e.g. 1960s)" value={form.age} onChange={handleChange} />
      <input name="condition" placeholder="Condition" value={form.condition} onChange={handleChange} />
      <input name="maker" placeholder="Maker" value={form.maker} onChange={handleChange} />

      <button type="submit">Create Listing</button>
    </form>
  )
}