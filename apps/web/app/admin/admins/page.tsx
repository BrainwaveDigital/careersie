"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserPlus, Trash2, Shield, Ban, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Admin {
  id: string
  user_id: string
  email: string
  full_name: string | null
  role: string
  access_level: number
  is_active: boolean
  permissions: string[]
  created_at: string
  last_activity_at: string | null
}

export default function AdminManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

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

      const { data: adminData } = await supabaseClient
        .from('app_admins')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (adminData?.role !== 'super_admin' && adminData?.role !== 'admin') {
        router.push('/admin')
        return
      }

      setIsSuperAdmin(adminData.role === 'super_admin')
      await loadAdmins()
      setLoading(false)
    } catch (error) {
      console.error('Access check error:', error)
      router.push('/admin')
    }
  }

  async function loadAdmins() {
    try {
      const { data, error } = await supabaseClient
        .from('app_admins')
        .select('*')
        .order('access_level', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAdmins(data || [])
    } catch (error) {
      console.error('Error loading admins:', error)
    }
  }

  async function toggleAdminStatus(adminId: string, currentStatus: boolean) {
    if (!isSuperAdmin) {
      alert('Only super administrators can modify admin status')
      return
    }

    try {
      const { error } = await supabaseClient
        .from('app_admins')
        .update({ is_active: !currentStatus })
        .eq('id', adminId)

      if (error) throw error

      alert(`Admin ${currentStatus ? 'deactivated' : 'activated'} successfully`)
      await loadAdmins()
    } catch (error) {
      console.error('Error updating admin status:', error)
      alert('Failed to update admin status')
    }
  }

  async function deleteAdmin(adminId: string) {
    if (!isSuperAdmin) {
      alert('Only super administrators can delete admins')
      return
    }

    if (!confirm('Are you sure you want to delete this administrator? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabaseClient
        .from('app_admins')
        .delete()
        .eq('id', adminId)

      if (error) throw error

      alert('Administrator deleted successfully')
      await loadAdmins()
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Failed to delete administrator')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-600'
      case 'admin':
        return 'bg-purple-600'
      case 'moderator':
        return 'bg-blue-600'
      default:
        return 'bg-gray-600'
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
              <h1 className="text-2xl font-bold text-white">Admin Management</h1>
            </div>
            {isSuperAdmin && (
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Administrator
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">All Administrators ({admins.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="p-4 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <div>
                          <h3 className="text-white font-semibold">
                            {admin.full_name || admin.email}
                          </h3>
                          <p className="text-slate-400 text-sm">{admin.email}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getRoleBadgeColor(admin.role)}`}>
                          {admin.role.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-slate-400 text-sm">
                          Level {admin.access_level}
                        </span>
                        {admin.is_active ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400 text-sm">
                            <Ban className="w-4 h-4" />
                            Inactive
                          </span>
                        )}
                      </div>
                      {admin.permissions && admin.permissions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-slate-400 text-xs">
                            Permissions: {admin.permissions.join(', ')}
                          </p>
                        </div>
                      )}
                      <div className="mt-2 text-slate-400 text-xs">
                        Last active: {admin.last_activity_at 
                          ? new Date(admin.last_activity_at).toLocaleString()
                          : 'Never'}
                      </div>
                    </div>
                    {isSuperAdmin && admin.role !== 'super_admin' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                          className={admin.is_active 
                            ? "border-yellow-600 text-yellow-400 hover:bg-yellow-900/50"
                            : "border-green-600 text-green-400 hover:bg-green-900/50"
                          }
                        >
                          {admin.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteAdmin(admin.id)}
                          className="border-red-600 text-red-400 hover:bg-red-900/50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
