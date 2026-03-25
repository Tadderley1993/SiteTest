const STAT_CARDS = [
  { label: 'Total Files', value: '0', icon: 'folder' },
  { label: 'Client Visible', value: '0', icon: 'folder_shared' },
  { label: 'Storage Used', value: '0 MB', icon: 'database' },
  { label: 'Active Links', value: '0', icon: 'link' },
]

export default function FilesView() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <nav className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Agency OS</span>
            <span>/</span>
            <span className="text-black">Files</span>
          </nav>
          <h1 className="text-4xl font-bold tracking-tighter">File Portal</h1>
          <p className="text-zinc-400 text-sm mt-1">Share files and documents with clients</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-white text-black px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-zinc-50 transition-colors ring-1 ring-black/[0.08]">
            <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
            New Folder
          </button>
          <button className="bg-black text-white px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Upload File
          </button>
        </div>
      </div>

      {/* Coming soon note */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-zinc-400 text-[20px]">info</span>
        <p className="text-sm text-zinc-500">File storage coming soon — planned integration with Supabase Storage.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="bg-white p-6 rounded-xl ring-1 ring-black/[0.03]">
            <div className="p-2 bg-[#f3f3f3] rounded-lg w-fit mb-4">
              <span className="material-symbols-outlined text-black text-[20px]">{card.icon}</span>
            </div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">{card.label}</p>
            <h3 className="text-3xl font-bold tracking-tight">{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Files table */}
      <div className="bg-white rounded-xl ring-1 ring-black/[0.05] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-black">All Files</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-50">
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-6 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Uploaded By</th>
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Access Level</th>
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Date</th>
              <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-[#f3f3f3] rounded-xl">
                    <span className="material-symbols-outlined text-zinc-400 text-[32px]">folder_open</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-500">No files uploaded yet</p>
                  <p className="text-xs text-zinc-400">Upload files to share with your clients</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
