import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Trash2, Download, File, AlertCircle, X } from 'lucide-react'
import {
  ClientDocument, DOC_TYPES,
  getDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl,
} from '../../lib/api'

interface Props {
  clientId: number
}

const FILE_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'image/png': '🖼️',
  'image/jpeg': '🖼️',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'text/plain': '📃',
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentManager({ clientId }: Props) {
  const [docs, setDocs] = useState<ClientDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('contract')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getDocuments(clientId)
      .then(setDocs)
      .catch(() => setError('Failed to load documents'))
      .finally(() => setIsLoading(false))
  }, [clientId])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(f => uploadDocument(clientId, f, selectedType))
      )
      setDocs(prev => [...uploaded, ...prev])
    } catch {
      setError('Upload failed. Check file type and size (max 20MB).')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (docId: number) => {
    try {
      await deleteDocument(clientId, docId)
      setDocs(prev => prev.filter(d => d.id !== docId))
      setDeleteConfirm(null)
    } catch {
      setError('Delete failed')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  const grouped = Object.keys(DOC_TYPES).reduce((acc, type) => {
    const group = docs.filter(d => d.docType === type)
    if (group.length) acc[type] = group
    return acc
  }, {} as Record<string, ClientDocument[]>)

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-6 transition-colors ${
          dragOver ? 'border-accent/60 bg-accent/5' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-accent flex-shrink-0" />
              <div>
                <p className="text-sm text-text-primary font-medium">Upload Documents</p>
                <p className="text-xs text-text-muted">Drag & drop or click to browse · PDF, DOC, DOCX, PNG, JPG, XLSX, TXT · Max 20MB</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-text-muted flex-shrink-0">File type:</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent/50 flex-1"
              >
                {Object.entries(DOC_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {uploading ? (
              <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" />Choose Files</>
            )}
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-400/5 border border-red-400/20 rounded-lg text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-text-muted text-sm">Loading documents...</div>
      ) : docs.length === 0 ? (
        <div className="py-8 text-center text-text-muted text-sm">No documents uploaded yet.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <p className="text-xs text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-3 h-px bg-white/20" />{DOC_TYPES[type]}<span className="flex-1 h-px bg-white/[0.06]" />
              </p>
              <div className="space-y-2">
                <AnimatePresence>
                  {items.map(doc => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg group hover:border-white/10 transition-colors"
                    >
                      <span className="text-xl flex-shrink-0">{FILE_ICONS[doc.mimeType] ?? '📎'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{doc.fileName}</p>
                        <p className="text-xs text-text-muted">{fmtSize(doc.size)} · {new Date(doc.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={getDocumentDownloadUrl(doc.id)}
                          download={doc.fileName}
                          className="p-1.5 text-text-muted hover:text-accent transition-colors rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {deleteConfirm === doc.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-text-muted">Delete?</span>
                            <button onClick={() => handleDelete(doc.id)} className="text-xs text-red-400 px-2 py-0.5 hover:underline">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-xs text-text-muted px-2 py-0.5 hover:underline">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(doc.id)} className="p-1.5 text-text-muted hover:text-red-400 transition-colors rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
