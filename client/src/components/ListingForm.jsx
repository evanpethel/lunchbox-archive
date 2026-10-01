import { useState } from "react"

const emptyForm = {
  title: "",
  description: "",
  price: "",
  photoUrl: "",
  age: "",
  condition: "",
  maker: ""
}

export default function ListingForm({ initialValues, onSubmit, submitLabel = "Create Listing" }) {
  const [form, setForm] = useState(initialValues || emptyForm)
  const [error, setError] = useState("")

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()

    const missingField = Object.entries(form).find(([, value]) => value === "")
    if (missingField) {
      setError(`Missing required field: ${missingField[0]}`)
      return
    }

    onSubmit({ ...form, price: parseFloat(form.price) })
    if (!initialValues) setForm(emptyForm)
    setError("")
  }

  return (
    <form onSubmit={handleSubmit} className="listing-form">
      <h2>{submitLabel}</h2>
      {error && <p className="error-text">{error}</p>}

      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} />
      <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
      <input name="price" type="number" step="0.01" placeholder="Price" value={form.price} onChange={handleChange} />
      <input name="photoUrl" placeholder="Photo URL" value={form.photoUrl} onChange={handleChange} />
      <input name="age" placeholder="Age (e.g. 1960s)" value={form.age} onChange={handleChange} />
      <input name="condition" placeholder="Condition" value={form.condition} onChange={handleChange} />
      <input name="maker" placeholder="Maker" value={form.maker} onChange={handleChange} />

      <button type="submit" className="btn btn-primary">{submitLabel}</button>
    </form>
  )
}