"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import Link from 'next/link'

interface MasterDataTable {
  name: string
  label: string
  description: string
}

const MASTER_DATA_TABLES: MasterDataTable[] = [
  {
    name: 'skill_categories',
    label: 'Skill Categories',
    description: 'Categories for organizing skills'
  },
  {
    name: 'industries',
    label: 'Industries',
    description: 'Industry classifications'
  },
  {
    name: 'job_levels',
    label: 'Job Levels',
    description: 'Career level definitions'
  },
  {
    name: 'certifying_bodies',
    label: 'Certifying Bodies',
    description: 'Organizations that issue certifications'
  }
]

interface MasterDataItem {
  id: string
  name: string
  description?: string
  is_active?: boolean
  created_at: string
}

export default function MasterDataManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [items, setItems] = useState<MasterDataItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    checkAccess()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable)
    }
  }, [selectedTable])

  async function checkAccess() {
    try {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
      
      if (authError || !user) {
        router.push('/admin/login')
        return
      }

      const { data: isAdmin } = await supabaseClient.rpc('is_admin')
      if (!isAdmin) {
        router.push('/login')
        return
      }

      setLoading(false)
    } catch (error) {
      console.error('Access check error:', error)
      router.push('/login')
    }
  }

  async function loadTableData(tableName: string) {
    try {
      const { data, error } = await supabaseClient
        .from(tableName)
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading table data:', error)
      alert('Failed to load data. Table may not exist yet.')
      setItems([])
    }
  }

  function startEdit(item: MasterDataItem) {
    setEditingId(item.id)
    setEditName(item.name)
    setEditDescription(item.description || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditDescription('')
  }

  async function saveEdit(itemId: string) {
    if (!selectedTable) return

    try {
      const { error } = await supabaseClient
        .from(selectedTable)
        .update({
          name: editName,
          description: editDescription || null
        })
        .eq('id', itemId)

      if (error) throw error

      await loadTableData(selectedTable)
      cancelEdit()
      alert('Item updated successfully')
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Failed to update item')
    }
  }

  async function deleteItem(itemId: string) {
    if (!selectedTable) return
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabaseClient
        .from(selectedTable)
        .delete()
        .eq('id', itemId)

      if (error) throw error

      await loadTableData(selectedTable)
      alert('Item deleted successfully')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  async function addNewItem() {
    if (!selectedTable || !newName.trim()) return

    try {
      const { error } = await supabaseClient
        .from(selectedTable)
        .insert({
          name: newName,
          description: newDescription || null,
          is_active: true
        })

      if (error) throw error

      await loadTableData(selectedTable)
      setIsAdding(false)
      setNewName('')
      setNewDescription('')
      alert('Item added successfully')
    } catch (error) {
      console.error('Error adding item:', error)
      alert('Failed to add item')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              asChild
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Link href="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-white">Master Data Management</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Data Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MASTER_DATA_TABLES.map((table) => (
                    <button
                      key={table.name}
                      onClick={() => setSelectedTable(table.name)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedTable === table.name
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="font-medium">{table.label}</div>
                      <div className="text-xs opacity-80 mt-1">{table.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table Content */}
          <div className="lg:col-span-2">
            {selectedTable ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">
                        {MASTER_DATA_TABLES.find(t => t.name === selectedTable)?.label}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Manage {selectedTable} entries
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setIsAdding(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Add New Form */}
                  {isAdding && (
                    <div className="mb-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
                      <h4 className="text-white font-medium mb-3">Add New Item</h4>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="new-item-name" className="block text-sm text-slate-300 mb-1">Name *</label>
                          <input
                            id="new-item-name"
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                            placeholder="Enter name"
                          />
                        </div>
                        <div>
                          <label htmlFor="new-item-description" className="block text-sm text-slate-300 mb-1">Description</label>
                          <textarea
                            id="new-item-description"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                            placeholder="Enter description"
                            rows={2}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={addNewItem} className="bg-green-600 hover:bg-green-700">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setIsAdding(false)
                              setNewName('')
                              setNewDescription('')
                            }}
                            variant="outline"
                            className="border-slate-600 text-slate-300"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        No items found. Click "Add New" to create one.
                      </div>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                        >
                          {editingId === item.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                                aria-label="Edit item name"
                              />
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white"
                                rows={2}
                                aria-label="Edit item description"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(item.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={cancelEdit}
                                  variant="outline"
                                  className="border-slate-600 text-slate-300"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-white font-medium">{item.name}</div>
                                {item.description && (
                                  <div className="text-slate-400 text-sm mt-1">{item.description}</div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(item)}
                                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteItem(item.id)}
                                  className="border-red-600 text-red-400 hover:bg-red-900/50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="py-16">
                  <div className="text-center text-slate-400">
                    Select a table from the left to view and manage data
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
