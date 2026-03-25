import { useState, useEffect, useRef } from 'react'
import { getAllFiles, deleteFile, uploadDocument, getClients, type FileEntry, type Client } from '../../lib/api'

const DOC_TYPES: Record<string, string> = {
  contract: 'Contract', nda: 'NDA', invoice: 'Invoice', brief: 'Creative Brief',
  reference: 'Reference', asset: 'Brand Asset', 'signed-proposal': 'Signed Proposal', other: 'Other',
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fileIcon(mime: string) {
  if (mime.includes('pdf')) return 'picture_as_pdf'
  if (mime.includes('image')) return 'image'
  if (mime.includes('word') || mime.includes('doc')) return 'description'
  if (mime.includes('sheet') || mime.includes('excel')) return 'table_chart'
  return 'insert_drive_file'
}

function UploadModal({ clients, onDone, onClose }: {
  clients: Client[]
  onDone: () => void
  onClose: () => void
}) {
  const [clientId, setClientId] = useState('')
  const [docType, setDocType] = useState('other')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (list: FileList | null) => {
    if (!list) return
    setFiles(prev => [...prev, ...Array.from(list)])
  }

  const handleUpload = async () => {
    if (!clientId || files.length === 0) return
    setUploading(true)
    try {
      await Promise.all(files.map(f => uploadDocument(parseInt(clientId), f, docType)))
      onDone()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">Upload File</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-black">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Client *</label>
            <select value={clientId} onChange={e => setClientId(e.target.value)}
              className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10">
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.organization ? ` — ${c.organization}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">File Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full bg-[#f3f3f3] rounded-lg px-3 py-2.5 text-sm border-none focus:outline-none focus:ring-2 focus:ring-black/10">
              {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${drag ? 'border-black bg-zinc-50' : 'border-zinc-200 hover:border-zinc-400'}`}
          >
            <span className="material-symbols-outlined text-zinc-300 text-[36px] block mb-2">cloud_upload</span>
            <p className="text-sm font-medium text-zinc-500">Drop files or click to browse</p>
            <p className="text-xs text-zinc-400 mt-1">PDF, DOC, PNG, JPG, XLSX — max 20MB</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
          </div>
          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-[#f3f3f3] rounded-lg px-3 py-2">
                  <span className="text-sm text-zinc-700 truncate">{f.name}</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    className="text-zinc-400 hover:text-red-500 ml-2 flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-black">Cancel</button>
          <button type="button" onClick={handleUpload} disabled={!clientId || files.length === 0 || uploading}
            className="px-5 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors">
            {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FilesView() {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [stats, setStats] = useState({ total: 0, portalVisible: 0, totalSize: 0 })
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([getAllFiles(), getClients()]).then(([data, cls]) => {
      setFiles(data.files)
      setStats(data.stats)
      setClients(cls)
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = files.filter(f => {
    const name = f.fileName.toLowerCase()
    const clientName = `${f.client.firstName} ${f.client.lastName}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || clientName.includes(search.toLowerCase())
    const matchClient = !filterClient || String(f.clientId) === filterClient
    const matchType = !filterType || f.docType === filterType
    return matchSearch && matchClient && matchType
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeleting(id)
    try {
      await deleteFile(id)
      setFiles(prev => prev.filter(f => f.id !== id))
      setStats(prev => ({ ...prev, total: prev.total - 1 }))
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Agency OS</span><span>/</span><span className="text-black">Files</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tighter">File Portal</h1>
          <p className="text-zinc-400 text-sm mt-1">All client documents in one place</p>
        </div>
        <button type="button" onClick={() => setShowUpload(true)}
          className="bg-black text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
          <span className="material-symbols-outlined text-[18px]">upload</span>Upload File
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Files', value: stats.total, icon: 'folder' },
          { label: 'Client Visible', value: stats.portalVisible, icon: 'folder_shared' },
          { label: 'Storage Used', value: fmtSize(stats.totalSize), icon: 'database' },
        ].map(card => (
          <div key={card.label} className="bg-white p-6 rounded-xl ring-1 ring-black/[0.03]">
            <div className="p-2 bg-[#f3f3f3] rounded-lg w-fit mb-4">
              <span className="material-symbols-outlined text-black text-[20px]">{card.icon}</span>
            </div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">{card.label}</p>
            <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-4 py-2 bg-white ring-1 ring-black/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/15" />
        </div>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
          className="bg-white ring-1 ring-black/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All Clients</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-white ring-1 ring-black/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="">All Types</option>
          {Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl ring-1 ring-black/[0.05] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Client</th>
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Size</th>
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-[#f3f3f3] rounded-xl">
                      <span className="material-symbols-outlined text-zinc-400 text-[32px]">folder_open</span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-500">{search || filterClient || filterType ? 'No files match your filters' : 'No files uploaded yet'}</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map(f => (
              <tr key={f.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#f3f3f3] rounded-lg flex-shrink-0">
                      <span className="material-symbols-outlined text-zinc-500 text-[18px]">{fileIcon(f.mimeType)}</span>
                    </div>
                    <span className="text-sm font-medium text-black truncate max-w-[200px]">{f.fileName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full font-medium">
                    {DOC_TYPES[f.docType] || f.docType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {f.client.firstName} {f.client.lastName}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-400">{fmtSize(f.size)}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{fmtDate(f.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <a href={`/api/admin/download/${f.id}`} target="_blank" rel="noreferrer"
                      className="text-zinc-400 hover:text-black transition-colors">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </a>
                    <button type="button" onClick={() => handleDelete(f.id)} disabled={deleting === f.id}
                      className="text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUpload && (
        <UploadModal clients={clients} onDone={load} onClose={() => setShowUpload(false)} />
      )}
    </div>
  )
}
