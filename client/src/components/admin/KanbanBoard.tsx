import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, GripVertical, Calendar, Flag, Pencil, Trash2, Check } from 'lucide-react'
import { KanbanTask, createTask, updateTask, deleteTask } from '../../lib/api'

interface Props {
  clientId: number
  tasks: KanbanTask[]
  onTasksChange: (tasks: KanbanTask[]) => void
}

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'text-text-muted', dot: 'bg-white/20' },
  { id: 'inprogress', label: 'In Progress', color: 'text-accent-secondary', dot: 'bg-accent-secondary' },
  { id: 'review', label: 'Review', color: 'text-yellow-400', dot: 'bg-yellow-400' },
  { id: 'done', label: 'Done', color: 'text-green-400', dot: 'bg-green-400' },
]

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-text-muted bg-white/5',
  medium: 'text-yellow-400 bg-yellow-400/10',
  high: 'text-red-400 bg-red-400/10',
}

interface AddTaskForm {
  title: string
  description: string
  priority: string
  dueDate: string
}

interface EditState {
  taskId: number
  title: string
  description: string
  priority: string
  dueDate: string
}

export default function KanbanBoard({ clientId, tasks, onTasksChange }: Props) {
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null)
  const [addForm, setAddForm] = useState<AddTaskForm>({ title: '', description: '', priority: 'medium', dueDate: '' })
  const [editState, setEditState] = useState<EditState | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const dragTask = useRef<KanbanTask | null>(null)

  const tasksByColumn = (col: string) =>
    tasks.filter(t => t.column === col).sort((a, b) => a.order - b.order)

  const handleAddTask = async (column: string) => {
    if (!addForm.title.trim()) return
    try {
      const task = await createTask(clientId, {
        title: addForm.title.trim(),
        description: addForm.description.trim() || undefined,
        priority: addForm.priority,
        dueDate: addForm.dueDate || undefined,
        column,
        order: tasksByColumn(column).length,
      })
      onTasksChange([...tasks, task])
      setAddForm({ title: '', description: '', priority: 'medium', dueDate: '' })
      setAddingToColumn(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleMoveTask = async (task: KanbanTask, newColumn: string) => {
    try {
      const updated = await updateTask(clientId, task.id, { column: newColumn, order: tasksByColumn(newColumn).length })
      onTasksChange(tasks.map(t => (t.id === task.id ? updated : t)))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(clientId, taskId)
      onTasksChange(tasks.filter(t => t.id !== taskId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveEdit = async () => {
    if (!editState) return
    try {
      const updated = await updateTask(clientId, editState.taskId, {
        title: editState.title,
        description: editState.description || undefined,
        priority: editState.priority,
        dueDate: editState.dueDate || undefined,
      })
      onTasksChange(tasks.map(t => (t.id === editState.taskId ? updated : t)))
      setEditState(null)
    } catch (err) {
      console.error(err)
    }
  }

  // Drag & drop handlers
  const onDragStart = (task: KanbanTask) => {
    dragTask.current = task
    setDraggingId(task.id)
  }

  const onDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault()
    setDragOverColumn(column)
  }

  const onDrop = async (column: string) => {
    if (dragTask.current && dragTask.current.column !== column) {
      await handleMoveTask(dragTask.current, column)
    }
    dragTask.current = null
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const onDragEnd = () => {
    dragTask.current = null
    setDraggingId(null)
    setDragOverColumn(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => {
        const colTasks = tasksByColumn(col.id)
        const isDragOver = dragOverColumn === col.id
        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-colors ${
              isDragOver ? 'border-accent/40 bg-accent/[0.03]' : 'border-white/[0.08] bg-white/[0.02]'
            }`}
            onDragOver={e => onDragOver(e, col.id)}
            onDrop={() => onDrop(col.id)}
            onDragLeave={() => setDragOverColumn(null)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className={`text-sm font-medium ${col.color}`}>{col.label}</span>
                <span className="text-xs text-text-muted bg-white/5 px-1.5 py-0.5 rounded">
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => { setAddingToColumn(col.id); setAddForm({ title: '', description: '', priority: 'medium', dueDate: '' }) }}
                className="text-text-muted hover:text-accent transition-colors"
                title="Add task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tasks */}
            <div className="flex-1 p-3 space-y-2 min-h-[100px]">
              <AnimatePresence>
                {colTasks.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: draggingId === task.id ? 0.4 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    draggable
                    onDragStart={() => onDragStart(task)}
                    onDragEnd={onDragEnd}
                    className="group bg-[#0d1017] border border-white/[0.08] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors"
                  >
                    {editState?.taskId === task.id ? (
                      <div className="space-y-2" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editState.title}
                          onChange={e => setEditState(s => s ? { ...s, title: e.target.value } : s)}
                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-accent/50"
                        />
                        <textarea
                          value={editState.description}
                          onChange={e => setEditState(s => s ? { ...s, description: e.target.value } : s)}
                          placeholder="Description..."
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent/50 resize-none"
                        />
                        <div className="flex gap-2">
                          <select
                            value={editState.priority}
                            onChange={e => setEditState(s => s ? { ...s, priority: e.target.value } : s)}
                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                          <input
                            type="date"
                            value={editState.dueDate}
                            onChange={e => setEditState(s => s ? { ...s, dueDate: e.target.value } : s)}
                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditState(null)}
                            className="text-xs text-text-muted hover:text-text-primary px-2 py-1 transition-colors"
                          >Cancel</button>
                          <button
                            onClick={handleSaveEdit}
                            className="text-xs bg-accent text-black px-2 py-1 rounded font-medium hover:bg-accent/90 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <GripVertical className="w-3 h-3 text-white/20 flex-shrink-0" />
                            <p className="text-sm text-text-primary leading-tight">{task.title}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => setEditState({ taskId: task.id, title: task.title, description: task.description ?? '', priority: task.priority, dueDate: task.dueDate ?? '' })}
                              className="text-text-muted hover:text-accent transition-colors p-0.5"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-text-muted hover:text-red-400 transition-colors p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-xs text-text-muted mt-1.5 pl-5 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex items-center gap-2 mt-2.5 pl-5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded capitalize flex items-center gap-1 ${PRIORITY_COLORS[task.priority]}`}>
                            <Flag className="w-2.5 h-2.5" />
                            {task.priority}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {task.dueDate}
                            </span>
                          )}
                        </div>

                        {/* Move buttons */}
                        <div className="flex gap-1 mt-2.5 pl-5 flex-wrap">
                          {COLUMNS.filter(c => c.id !== col.id).map(target => (
                            <button
                              key={target.id}
                              onClick={() => handleMoveTask(task, target.id)}
                              className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 transition-colors"
                            >
                              → {target.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add task inline form */}
              {addingToColumn === col.id && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0d1017] border border-accent/30 rounded-lg p-3 space-y-2"
                >
                  <input
                    autoFocus
                    value={addForm.title}
                    onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask(col.id)}
                    placeholder="Task title..."
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent/50"
                  />
                  <textarea
                    value={addForm.description}
                    onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description (optional)..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-text-primary placeholder-text-muted/40 focus:outline-none focus:border-accent/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <select
                      value={addForm.priority}
                      onChange={e => setAddForm(f => ({ ...f, priority: e.target.value }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <input
                      type="date"
                      value={addForm.dueDate}
                      onChange={e => setAddForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setAddingToColumn(null)}
                      className="text-xs text-text-muted hover:text-text-primary px-2 py-1 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button
                      onClick={() => handleAddTask(col.id)}
                      className="text-xs bg-accent text-black px-3 py-1 rounded font-medium hover:bg-accent/90 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
