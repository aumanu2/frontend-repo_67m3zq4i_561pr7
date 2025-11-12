import { useEffect, useMemo, useState } from 'react'

function App() {
  // Data
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Create product form
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Textiles')
  const [sellerName, setSellerName] = useState('')
  const [imageBase64, setImageBase64] = useState('')

  // Discovery
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const CATEGORIES = ['All', 'Textiles', 'Pottery', 'Jewelry', 'Woodwork', 'Paintings']

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    loadProducts()
    return () => stopCamera()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${baseUrl}/products`)
      if (!res.ok) throw new Error('Failed to load products')
      const data = await res.json()

      if (Array.isArray(data) && data.length === 0) {
        await seedSampleProduct()
        const res2 = await fetch(`${baseUrl}/products`)
        const data2 = await res2.json()
        setProducts(data2)
      } else {
        setProducts(data)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Seed a beautiful handcrafted sample so the gallery never feels empty
  const seedSampleProduct = async () => {
    try {
      const svg = encodeURIComponent(`<?xml version='1.0' encoding='UTF-8'?>\n<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 960 720'>\n  <defs>\n    <linearGradient id='bg' x1='0' x2='1'>\n      <stop offset='0%' stop-color='#fff1f2'/>\n      <stop offset='100%' stop-color='#ecfeff'/>\n    </linearGradient>\n    <radialGradient id='orb' cx='50%' cy='40%' r='60%'>\n      <stop offset='0%' stop-color='#ffffff' stop-opacity='0.95'/>\n      <stop offset='100%' stop-color='#ffffff' stop-opacity='0.6'/>\n    </radialGradient>\n  </defs>\n  <rect width='960' height='720' fill='url(#bg)'/>\n  <g transform='translate(480 360)'>\n    <circle r='220' fill='url(#orb)'/>\n    <g transform='translate(-180 -120) rotate(-6)'>\n      <rect x='0' y='0' rx='16' width='360' height='240' fill='#fef3c7' stroke='#f59e0b' stroke-width='3'/>\n      <path d='M20 40 L340 40 M20 90 L340 90 M20 140 L340 140 M20 190 L220 190' stroke='#b45309' stroke-width='3' stroke-linecap='round'/>\n    </g>\n    <text x='0' y='160' text-anchor='middle' font-family='Georgia, serif' font-size='36' fill='#0f172a'>Handwoven Cotton Scarf</text>\n    <text x='0' y='198' text-anchor='middle' font-family='Georgia, serif' font-size='22' fill='#334155'>VanVastra · Textiles</text>\n  </g>\n</svg>`)\n      const sample = {
        title: 'Handwoven Cotton Scarf',
        description:
          'Soft, breathable, and woven on a traditional pit loom. Natural indigo dyed, finished with hand-knotted fringes.',
        price: 39.0,
        category: 'Textiles',
        seller_name: 'Asha',
        image_base64: `data:image/svg+xml;charset=utf-8,${svg}`,
      }
      await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample),
      })
    } catch (e) {
      console.warn('Seeding sample failed', e)
    }
  }

  // Uploader & camera
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageBase64(reader.result)
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
    if (!video) return
    const canvas = document.createElement('canvas')
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
      tracks.forEach((t) => t.stop())
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
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to create product')
      await loadProducts()
      clearForm()
    } catch (e) {
      setError(e.message)
    }
  }

  // Derived filtered list
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'All' || (p.category || '').toLowerCase() === activeCategory.toLowerCase()
      const q = search.trim().toLowerCase()
      const matchesSearch = !q || [p.title, p.description, p.seller_name, p.category].filter(Boolean).some((s) => String(s).toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [products, activeCategory, search])

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,rgba(255,228,230,.6),rgba(240,253,244,.6)_40%,transparent_65%),radial-gradient(ellipse_at_bottom_right,rgba(219,234,254,.6),transparent_55%)]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 shadow-inner" />
            <div>
              <h1 className="text-2xl font-black tracking-tight">VanVastra</h1>
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Handcrafted marketplace</p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <a href="/test" className="text-slate-600 hover:text-slate-900">System Test</a>
            <button onClick={loadProducts} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg shadow hover:bg-slate-800">Refresh</button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16 grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-600 via-amber-600 to-emerald-700">Celebrate the art of handmade</h2>
            <p className="mt-3 text-slate-700 max-w-2xl">Capture your craft with the camera, share your story, and reach customers who value authenticity.</p>

            {/* Discovery controls */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search scarves, pottery, jewelry..."
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌘K</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className={`px-3 py-2 rounded-lg border text-sm whitespace-nowrap transition ${
                      activeCategory === c
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-white/80 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Create product card */}
          <section className="bg-white/90 rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-lg font-semibold">List your handcrafted product</h3>
            {error && (
              <div className="mt-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded p-2">{error}</div>
            )}
            <form onSubmit={submitProduct} className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Handwoven scarf" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="39.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400">
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Seller name</label>
                <input value={sellerName} onChange={(e) => setSellerName(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="Your brand or name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400" rows={3} placeholder="Materials, process, size, care..." />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Photos</label>
                <div className="flex gap-2">
                  <input type="file" accept="image/*" onChange={onFileChange} className="block w-full text-sm" />
                </div>
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden bg-slate-100 aspect-video flex items-center justify-center border border-slate-200">
                    {imageBase64 ? (
                      <img src={imageBase64} alt="preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-slate-500 text-sm">No preview yet</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={startCamera} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Open Camera</button>
                    <button type="button" onClick={captureFromCamera} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700">Capture</button>
                    <button type="button" onClick={stopCamera} className="px-3 py-1.5 bg-slate-700 text-white rounded-lg shadow hover:bg-slate-800">Stop</button>
                  </div>
                  <video id="vv-video" className="w-full rounded-lg" playsInline muted></video>
                </div>
              </div>

              <button type="submit" className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-amber-600 hover:from-emerald-700 hover:to-amber-700 text-white font-semibold py-2.5 rounded-xl shadow">
                Publish product
              </button>
            </form>
          </section>
        </div>
      </section>

      {/* Gallery */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Marketplace</h2>
            <p className="text-sm text-slate-600">Discover handcrafted pieces from artisans</p>
          </div>
          <div className="text-sm text-slate-500">{filtered.length} items</div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/80 rounded-2xl border border-slate-200 p-3 animate-pulse">
                <div className="aspect-square rounded-xl bg-slate-200" />
                <div className="mt-3 h-4 w-2/3 bg-slate-200 rounded" />
                <div className="mt-2 h-3 w-full bg-slate-200 rounded" />
                <div className="mt-1 h-3 w-5/6 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <article key={p.id} className="group bg-white/90 rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col">
                <div className="relative aspect-square bg-slate-100">
                  {p.image_base64 ? (
                    <img src={p.image_base64} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No image</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold line-clamp-1">{p.title}</h3>
                    <span className="text-lg font-bold">${Number(p.price).toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{p.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">{p.category || 'Handcrafted'}</span>
                    {p.seller_name && <span className="text-xs text-slate-500">by {p.seller_name}</span>}
                  </div>
                  <button className="mt-3 w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800">Add to cart</button>
                </div>
              </article>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-slate-500">No matching products found.</div>
            )}
          </div>
        )}
      </main>

      <footer className="py-10 text-center text-sm text-slate-600">
        Crafted with love for artisans. © {new Date().getFullYear()} VanVastra
      </footer>
    </div>
  )
}

export default App
