import { useEffect, useState } from 'react'

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Textiles')
  const [sellerName, setSellerName] = useState('')
  const [imageBase64, setImageBase64] = useState('')

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${baseUrl}/products`)
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()
      setProducts(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageBase64(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const startCamera = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      const video = document.getElementById('vv-video')
      if (video) {
        video.srcObject = stream
        await video.play()
      }
    } catch (e) {
      setError('Camera access denied or not available')
    }
  }

  const captureFromCamera = () => {
    const video = document.getElementById('vv-video')
    const canvas = document.createElement('canvas')
    if (!video) return
    const width = video.videoWidth
    const height = video.videoHeight
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setImageBase64(dataUrl)
  }

  const stopCamera = () => {
    const video = document.getElementById('vv-video')
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks()
      tracks.forEach(t => t.stop())
      video.srcObject = null
    }
  }

  const clearForm = () => {
    setTitle('')
    setPrice('')
    setDescription('')
    setCategory('Textiles')
    setSellerName('')
    setImageBase64('')
    stopCamera()
  }

  const submitProduct = async (e) => {
    e.preventDefault()
    try {
      setError('')
      if (!title || !price) throw new Error('Please enter title and price')
      const payload = {
        title,
        description,
        price: parseFloat(price),
        category,
        seller_name: sellerName || undefined,
        image_base64: imageBase64 || undefined,
      }
      const res = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Failed to create product')
      await loadProducts()
      clearForm()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-amber-500" />
            <h1 className="text-2xl font-extrabold tracking-tight">VanVastra</h1>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/test" className="text-gray-600 hover:text-gray-900">System Test</a>
            <button onClick={loadProducts} className="px-3 py-1.5 bg-gray-900 text-white rounded">Refresh</button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <section className="lg:col-span-1 bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-4">List your handcrafted product</h2>
          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded p-2">
              {error}
            </div>
          )}
          <form onSubmit={submitProduct} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Handwoven scarf" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="29.99" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full border rounded px-3 py-2">
                <option>Textiles</option>
                <option>Pottery</option>
                <option>Jewelry</option>
                <option>Woodwork</option>
                <option>Paintings</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Seller name</label>
              <input value={sellerName} onChange={e=>setSellerName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Your brand or name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} placeholder="Materials, process, size, care..." />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Photos</label>
              <div className="flex gap-2">
                <input type="file" accept="image/*" onChange={onFileChange} className="block w-full text-sm" />
              </div>
              <div className="space-y-2">
                <div className="rounded overflow-hidden bg-black/5 aspect-video flex items-center justify-center">
                  {imageBase64 ? (
                    <img src={imageBase64} alt="preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-gray-500 text-sm">No preview yet</div>
                  )}
                </div>
                <div className="space-x-2">
                  <button type="button" onClick={startCamera} className="px-3 py-1.5 bg-blue-600 text-white rounded">Open Camera</button>
                  <button type="button" onClick={captureFromCamera} className="px-3 py-1.5 bg-green-600 text-white rounded">Capture</button>
                  <button type="button" onClick={stopCamera} className="px-3 py-1.5 bg-gray-600 text-white rounded">Stop</button>
                </div>
                <video id="vv-video" className="w-full rounded" playsInline muted></video>
              </div>
            </div>

            <button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded">
              Publish product
            </button>
          </form>
        </section>

        <section className="lg:col-span-2">
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Marketplace</h2>
              <p className="text-sm text-gray-600">Discover handcrafted pieces from artisans</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-600">Loading products...</div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products.map(p => (
                <article key={p.id} className="bg-white rounded-xl shadow overflow-hidden flex flex-col">
                  <div className="aspect-square bg-gray-100">
                    {p.image_base64 ? (
                      <img src={p.image_base64} alt={p.title} className="w-full h-full object-cover" />)
                    : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image</div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold line-clamp-1">{p.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{p.description}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-lg font-bold">${Number(p.price).toFixed(2)}</span>
                      <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">{p.category || 'Handcrafted'}</span>
                    </div>
                    {p.seller_name && (
                      <p className="mt-2 text-xs text-gray-500">by {p.seller_name}</p>
                    )}
                    <button className="mt-3 w-full bg-gray-900 text-white py-1.5 rounded">Add to cart</button>
                  </div>
                </article>
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center text-gray-500">No products yet. Be the first to publish!</div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="py-10 text-center text-sm text-gray-600">
        Crafted with love for artisans. © {new Date().getFullYear()} VanVastra
      </footer>
    </div>
  )
}

export default App
