import { useState, useEffect } from 'react'
import { 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Ban, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users
} from 'lucide-react'
import { User } from '../types'
import { useUsers, useInvestments } from '../hooks/useFirebase'
import { exportUsersToCSV } from '../utils/csvExport'

export default function UserManagement() {
  const { data: users, loading, error } = useUsers()
  const { data: investments } = useInvestments()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterSignupDate, setFilterSignupDate] = useState<'all' | 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth'>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name'>('latest')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  
  // Ensure users is an array
  const safeUsers = Array.isArray(users) ? users : []
  const safeInvestments = Array.isArray(investments) ? investments : []
  
  // Helper function to get phone number from user object (handles various field names)
  const getUserPhone = (user: any): string => {
    // Check multiple possible field names
    return user.phone || 
           user.phone_number || 
           user.Phone || 
           user.phoneNumber ||
           user.telephone ||
           user.mobile ||
           user.mobile_number ||
           user.contact_number ||
           user.contact ||
           ''
  }
  
  // Debug: Log user structure to help identify phone field name
  useEffect(() => {
    if (safeUsers.length > 0) {
      const firstUser = safeUsers[0] as any
      const phoneValue = getUserPhone(firstUser)
      console.log('🔍 User Management - Phone Field Debug:', {
        userId: firstUser.id,
        userName: firstUser.full_name,
        allFields: Object.keys(firstUser),
        phoneValue: phoneValue,
        phoneField: firstUser.phone,
        phone_number: firstUser.phone_number,
        Phone: firstUser.Phone,
        sampleUser: firstUser
      })
    }
  }, [safeUsers.length])
  
  // Helper function to get user's total investment amount from investments collection
  const getUserTotalInvestment = (userId: string, userEmail: string) => {
    return safeInvestments
      .filter(inv => 
        inv.userId === userId || 
        inv.user_id === userId || 
        inv.userEmail === userEmail || 
        (inv as any).user_email === userEmail
      )
      .reduce((total, inv) => total + ((inv as any).amount_paid || (inv as any).Amount_paid || 0), 0)
  }
  
  // Helper function to get user's portfolio sqm from investments collection
  const getUserPortfolioSqm = (userId: string, userEmail: string) => {
    return safeInvestments
      .filter(inv => 
        inv.userId === userId || 
        inv.user_id === userId || 
        inv.userEmail === userEmail || 
        (inv as any).user_email === userEmail
      )
      .reduce((total, inv) => total + ((inv as any).sqm_purchased || inv.sqm || 0), 0)
  }
  
  // Helper function to get user's created_at date for sorting
  const getUserCreatedDate = (user: User): Date => {
    if (!user.created_at) return new Date(0) // Very old date if missing
    
    // Handle Firebase timestamp objects
    if (user.created_at && typeof user.created_at === 'object' && 'toDate' in user.created_at) {
      return (user.created_at as any).toDate()
    }
    
    // Handle Date objects
    if (user.created_at instanceof Date) {
      return user.created_at
    }
    
    // Handle string dates
    const dateObj = new Date(user.created_at as any)
    return isNaN(dateObj.getTime()) ? new Date(0) : dateObj
  }

  const filteredUsers = safeUsers
    .filter(user => {
      // Use actual field names from your Firebase: full_name, email
      const fullName = user.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
      const userEmail = user.email || ''
      const matchesSearch = (userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      // Use status field from user_profiles
      const isActive = user.status === 'active'
      const matchesFilter = filterStatus === 'all' || 
                           (filterStatus === 'active' && isActive) ||
                           (filterStatus === 'inactive' && !isActive)
      
      // Filter by signup date
      const userCreatedDate = getUserCreatedDate(user)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      let matchesSignupDate = true
      
      if (filterSignupDate !== 'all') {
        // Normalize user date to start of day for comparison
        const userDate = new Date(userCreatedDate.getFullYear(), userCreatedDate.getMonth(), userCreatedDate.getDate())
        
        switch (filterSignupDate) {
          case 'today':
            matchesSignupDate = userDate.getTime() === today.getTime()
            break
          case 'last7days':
            const last7Days = new Date(today)
            last7Days.setDate(last7Days.getDate() - 7)
            matchesSignupDate = userDate >= last7Days && userDate <= tomorrow
            break
          case 'last30days':
            const last30Days = new Date(today)
            last30Days.setDate(last30Days.getDate() - 30)
            matchesSignupDate = userDate >= last30Days && userDate <= tomorrow
            break
          case 'thisMonth':
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            matchesSignupDate = userDate >= thisMonthStart && userDate <= tomorrow
            break
          case 'lastMonth':
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
            matchesSignupDate = userDate >= lastMonthStart && userDate <= lastMonthEnd
            break
        }
      }
      
      return matchesSearch && matchesFilter && matchesSignupDate
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        // Sort by latest signups first (newest first)
        const dateA = getUserCreatedDate(a).getTime()
        const dateB = getUserCreatedDate(b).getTime()
        return dateB - dateA
      } else if (sortBy === 'oldest') {
        // Sort by oldest signups first
        const dateA = getUserCreatedDate(a).getTime()
        const dateB = getUserCreatedDate(b).getTime()
        return dateA - dateB
      } else if (sortBy === 'name') {
        // Sort alphabetically by name
        const nameA = (a.full_name || `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || '').toLowerCase()
        const nameB = (b.full_name || `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.email || '').toLowerCase()
        return nameA.localeCompare(nameB)
      }
      return 0
    })

  const handleUserAction = async (userId: string, action: string) => {
    // Implement user actions (activate, deactivate, verify, etc.)
    console.log(`Performing ${action} on user ${userId}`)
  }

  const handleExportUsers = () => {
    exportUsersToCSV(filteredUsers, safeInvestments)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    
    // Handle Firebase timestamp objects
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    
    // Handle string dates
    const dateObj = new Date(date)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    
    return 'Invalid Date'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage platform users and their activities</p>
        </div>
        <button
          onClick={handleExportUsers}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{safeUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeUsers.filter(user => user.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Investment</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(safeInvestments.reduce((sum, inv) => sum + ((inv as any).amount_paid || (inv as any).Amount_paid || 0), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Portfolio</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeUsers.filter(user => getUserPortfolioSqm(user.id, user.email || '') > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <select
              className="input-field"
              value={filterSignupDate}
              onChange={(e) => setFilterSignupDate(e.target.value as 'all' | 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth')}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
            </select>
            <select
              className="input-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest' | 'name')}
            >
              <option value="latest">Latest Signups</option>
              <option value="oldest">Oldest Signups</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Portfolio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                        <div className="text-sm text-gray-500">
                          {getUserPhone(user) || 'No phone'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : user.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(getUserTotalInvestment(user.id, user.email || ''))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getUserPortfolioSqm(user.id, user.email || '').toLocaleString()} SQM
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowUserModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUserAction(user.id, 'edit')}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate')}
                        className={user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                      >
                        {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No users available in the system.'}
            </p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Investment</label>
                  <p className="text-sm text-gray-900">{formatCurrency(getUserTotalInvestment(selectedUser.id, selectedUser.email || ''))}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Portfolio</label>
                  <p className="text-sm text-gray-900">{getUserPortfolioSqm(selectedUser.id, selectedUser.email || '').toLocaleString()} SQM</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Referral Code</label>
                  <p className="text-sm text-gray-900">{selectedUser.referral_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}