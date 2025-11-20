'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Shield, UserX, UserCheck, ArrowLeft } from 'lucide-react'

interface User {
  user_id: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  admin_approval_status?: 'pending' | 'approved' | 'rejected' | null
  admin_permissions?: Record<string, boolean> | null
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    // STRICT: Only admin can access
    if (!currentUser) {
      router.push('/auth/signin')
      return
    }
    if (currentUser.role !== 'admin') {
      router.push('/admin') // Redirect to admin dashboard, not HR dashboard
      return
    }
    loadUsers()
  }, [page, search, currentUser, router])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 || response.status === 403) {
        router.push('/auth/signin')
        return
      }

      const data = await response.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId: string, updates: { role?: string; is_active?: boolean; admin_approval_status?: string; admin_permissions?: Record<string, boolean> }) => {
    // STRICT: Prevent admin from deactivating themselves
    if (currentUser && currentUser.id === userId && updates.is_active === false) {
      alert('You cannot deactivate your own account')
      return
    }

    // STRICT: Prevent admin from removing their own admin role
    if (currentUser && currentUser.id === userId && updates.role && updates.role !== 'admin') {
      alert('You cannot remove your own admin role')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (response.ok) {
        if (data.requires_approval) {
          alert('Admin role assigned. User requires approval before they can access admin features.')
        }
        loadUsers()
      } else {
        alert(data.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('An error occurred while updating the user')
    }
  }

  const approveAdmin = async (userId: string) => {
    await updateUser(userId, { admin_approval_status: 'approved' })
  }

  const rejectAdmin = async (userId: string) => {
    await updateUser(userId, { admin_approval_status: 'rejected', role: 'user' })
  }

  const deleteUser = async (userId: string) => {
    // STRICT: Prevent admin from deleting themselves
    if (currentUser && currentUser.id === userId) {
      alert('You cannot delete your own account')
      return
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        loadUsers()
      } else {
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('An error occurred while deleting the user')
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Users</h1>
            <p className="text-gray-400">View and manage all system users</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10 bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle>Users ({total})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((userItem) => {
                    const isCurrentUser = currentUser && currentUser.id === userItem.user_id
                    return (
                      <div
                        key={userItem.user_id}
                        className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg hover:bg-neutral-750"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{userItem.email}</span>
                            {isCurrentUser && (
                              <Badge variant="outline" className="border-blue-500 text-blue-500">
                                You
                              </Badge>
                            )}
                            <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'}>
                              {userItem.role}
                            </Badge>
                            {userItem.role === 'admin' && userItem.admin_approval_status === 'pending' && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                                Pending Approval
                              </Badge>
                            )}
                            {userItem.role === 'admin' && userItem.admin_approval_status === 'approved' && (
                              <Badge variant="outline" className="border-green-500 text-green-500">
                                Approved
                              </Badge>
                            )}
                            <Badge variant={userItem.is_active ? 'default' : 'destructive'}>
                              {userItem.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            Created: {new Date(userItem.created_at).toLocaleDateString()}
                          </p>
                          {userItem.role === 'admin' && userItem.admin_permissions && Object.keys(userItem.admin_permissions).length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Permissions: {Object.entries(userItem.admin_permissions)
                                .filter(([_, enabled]) => enabled)
                                .map(([key, _]) => key.replace('_', ' '))
                                .join(', ') || 'None'}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {userItem.role !== 'admin' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                if (confirm('Promote this user to admin? They will require approval before accessing admin features.')) {
                                  updateUser(userItem.user_id, { 
                                    role: 'admin',
                                    admin_permissions: {
                                      manage_users: true,
                                      manage_companies: true,
                                      manage_jobs: true,
                                      manage_applications: true,
                                      view_analytics: true
                                    }
                                  })
                                }
                              }}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Make Admin
                            </Button>
                          )}
                          {userItem.role === 'admin' && userItem.admin_approval_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveAdmin(userItem.user_id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => rejectAdmin(userItem.user_id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {userItem.role === 'admin' && userItem.admin_approval_status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const permissions = userItem.admin_permissions || {}
                                const enabledPerms = Object.entries(permissions)
                                  .filter(([_, v]) => v)
                                  .map(([k]) => k)
                                  .join(', ')
                                const newPerms = prompt(
                                  `Edit permissions (comma-separated):\nAvailable: manage_users, manage_companies, manage_jobs, manage_applications, view_analytics\nCurrent: ${enabledPerms || 'None'}\n\nEnter permissions to enable:`,
                                  enabledPerms
                                )
                                if (newPerms !== null) {
                                  const permList = newPerms.split(',').map(p => p.trim()).filter(Boolean)
                                  const allPerms = ['manage_users', 'manage_companies', 'manage_jobs', 'manage_applications', 'view_analytics']
                                  const updatedPerms: Record<string, boolean> = {}
                                  allPerms.forEach(perm => {
                                    updatedPerms[perm] = permList.includes(perm)
                                  })
                                  updateUser(userItem.user_id, { admin_permissions: updatedPerms })
                                }
                              }}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Permissions
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUser(userItem.user_id, { is_active: !userItem.is_active })}
                            disabled={isCurrentUser && !userItem.is_active}
                            title={isCurrentUser && !userItem.is_active ? 'You cannot deactivate your own account' : ''}
                          >
                            {userItem.is_active ? (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(userItem.user_id)}
                            disabled={isCurrentUser}
                            title={isCurrentUser ? 'You cannot delete your own account' : ''}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {users.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    No users found
                  </div>
                )}

                {total > 20 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-gray-400">
                      Page {page} of {Math.ceil(total / 20)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page >= Math.ceil(total / 20)}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

