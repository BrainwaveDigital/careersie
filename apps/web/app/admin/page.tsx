"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Users, Shield, Database, FileText, Activity, Settings } from 'lucide-react'
import Link from 'next/link'

interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: string
  access_level: number
  is_active: boolean
  last_activity_at: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProfiles: 0,
    totalMedia: 0,
    totalAssessments: 0
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
      
      if (authError || !user) {
        router.push('/admin/login')
        return
      }

      // Check if user is an admin
      const { data: isAdmin, error: adminCheckError } = await supabaseClient
        .rpc('is_admin')

      if (adminCheckError || !isAdmin) {
        router.push('/login')
        return
      }

      // Get admin details
      const { data: adminData, error: adminError } = await supabaseClient
        .from('app_admins')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (adminError || !adminData) {
        router.push('/login')
        return
      }

      setAdminUser(adminData)

      // Load dashboard stats
      await loadStats()
      setLoading(false)
    } catch (error) {
      console.error('Admin access check error:', error)
      router.push('/login')
    }
  }

  async function loadStats() {
    try {
      const [usersRes, profilesRes, mediaRes, assessmentsRes] = await Promise.all([
        supabaseClient.from('profiles').select('id', { count: 'exact', head: true }),
        supabaseClient.from('profiles').select('id', { count: 'exact', head: true }),
        supabaseClient.from('media_library').select('id', { count: 'exact', head: true }),
        supabaseClient.from('personality_assessments').select('id', { count: 'exact', head: true })
      ])

      setStats({
        totalUsers: usersRes.count || 0,
        totalProfiles: profilesRes.count || 0,
        totalMedia: mediaRes.count || 0,
        totalAssessments: assessmentsRes.count || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  async function handleLogout() {
    await supabaseClient.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-400" />
              Admin Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {adminUser?.full_name || adminUser?.email} • {adminUser?.role}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 text-sm font-medium">Total Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalProfiles}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 text-sm font-medium">Media Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalMedia}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200 text-sm font-medium">Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalAssessments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                User Management
              </CardTitle>
              <CardDescription className="text-slate-400">
                View, edit, and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/admin/users">
                  Manage Users
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Admin Management */}
          {(adminUser?.role === 'super_admin' || adminUser?.role === 'admin') && (
            <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Admin Management
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Manage administrators and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                  <Link href="/admin/admins">
                    Manage Admins
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Profile Management */}
          <Card className="bg-slate-800 border-slate-700 hover:border-green-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" />
                Profile Management
              </CardTitle>
              <CardDescription className="text-slate-400">
                View and manage user profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link href="/admin/profiles">
                  Manage Profiles
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Master Data */}
          <Card className="bg-slate-800 border-slate-700 hover:border-yellow-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-yellow-400" />
                Master Data
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage master data tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-yellow-600 hover:bg-yellow-700">
                <Link href="/admin/master-data">
                  Manage Data
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card className="bg-slate-800 border-slate-700 hover:border-orange-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-400" />
                Activity Logs
              </CardTitle>
              <CardDescription className="text-slate-400">
                View system activity and audit logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                <Link href="/admin/activity">
                  View Logs
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          {adminUser?.role === 'super_admin' && (
            <Card className="bg-slate-800 border-slate-700 hover:border-red-500 transition-colors">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-red-400" />
                  System Settings
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Configure system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-red-600 hover:bg-red-700">
                  <Link href="/admin/settings">
                    Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Role Badge */}
        <div className="mt-8 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold">Your Access Level</h3>
              <p className="text-slate-400 text-sm mt-1">
                You have {adminUser?.role} privileges with access level {adminUser?.access_level}
              </p>
            </div>
            <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
              {adminUser?.role?.toUpperCase().replace('_', ' ')}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
