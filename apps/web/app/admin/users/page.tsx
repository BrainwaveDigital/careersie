"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2, Eye, Ban, CheckCircle, Search } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  created_at: string
  updated_at: string
}

export default function AdminUsers() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [])

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

      const { data: adminData } = await supabaseClient
        .from('app_admins')
        .select('role')
        .eq('user_id', user.id)
        .single()

      setIsSuperAdmin(adminData?.role === 'super_admin')
      await loadProfiles()
      setLoading(false)
    } catch (error) {
      console.error('Access check error:', error)
      router.push('/login')
    }
  }

  async function loadProfiles() {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error('Error loading profiles:', error)
    }
  }

  async function handleDeleteProfile(profileId: string) {
    if (!isSuperAdmin) {
      alert('Only super administrators can delete profiles')
      return
    }

    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('id', profileId)

      if (error) throw error

      alert('Profile deleted successfully')
      await loadProfiles()
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Failed to delete profile')
    }
  }

  const filteredProfiles = profiles.filter(profile =>
    profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold text-white">User Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              All Users ({filteredProfiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Phone</th>
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Joined</th>
                    <th className="text-right py-3 px-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile) => (
                    <tr key={profile.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-3 px-4 text-white">{profile.name || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-300">{profile.email || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-300">{profile.phone || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <Link href={`/admin/users/${profile.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteProfile(profile.id)}
                              className="border-red-600 text-red-400 hover:bg-red-900/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
