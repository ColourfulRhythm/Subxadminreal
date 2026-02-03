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
  Users,
  History,
  Mail,
  Save,
  X,
  AlertTriangle,
  Trash2,
  Merge
} from 'lucide-react'
import { User } from '../types'
import { useUsers, useInvestments, useInvestmentRequests, firebaseUtils } from '../hooks/useFirebase'
import { exportUsersToCSV } from '../utils/csvExport'
import toast from 'react-hot-toast'

export default function UserManagement() {
  const { data: users, loading, error } = useUsers()
  const { data: investments } = useInvestments()
  const { data: investmentRequests } = useInvestmentRequests()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [filterSignupDate, setFilterSignupDate] = useState<'all' | 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth'>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'name'>('latest')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    bank_name: ''
  })
  const [processing, setProcessing] = useState(false)
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<Array<{email: string, users: User[]}>>([])
  
  // Ensure users is an array
  const safeUsers = Array.isArray(users) ? users : []
  const safeInvestments = Array.isArray(investments) ? investments : []
  const safeInvestmentRequests = Array.isArray(investmentRequests) ? investmentRequests : []
  
  // Combine investments and approved investment_requests for portfolio calculation
  const allInvestmentData = [
    ...safeInvestments,
    ...safeInvestmentRequests.filter((req: any) => 
      req.status === 'approved' || req.status === 'completed'
    )
  ]

  // Normalize status across inconsistent Firestore/user schema variants.
  const getUserStatus = (user: any): 'active' | 'inactive' | 'unknown' => {
    const raw = (user?.status ?? user?.Status ?? user?.account_status ?? user?.accountStatus ?? '').toString().toLowerCase().trim()
    if (raw === 'active') return 'active'
    if (raw === 'inactive' || raw === 'disabled' || raw === 'banned' || raw === 'blocked') return 'inactive'
    if (typeof user?.isActive === 'boolean') return user.isActive ? 'active' : 'inactive'
    return 'unknown'
  }
  
  // Helper function to get phone number from user object (handles various field names)
  const getUserPhone = (user: any): string => {
    if (!user) return ''
    
    // Check multiple possible field names (case-insensitive check)
    const phoneFields = [
      'phone', 'phone_number', 'Phone', 'phoneNumber', 'PHONE',
      'telephone', 'mobile', 'mobile_number', 'Mobile', 'MOBILE',
      'contact_number', 'contact', 'Contact', 'CONTACT',
      'tel', 'telephone_number', 'cell', 'cellphone', 'cell_phone'
    ]
    
    // First try exact matches
    for (const field of phoneFields) {
      if (user[field] && typeof user[field] === 'string' && user[field].trim()) {
        return user[field].trim()
      }
    }
    
    // Then try case-insensitive search through all keys
    const userKeys = Object.keys(user)
    for (const key of userKeys) {
      const lowerKey = key.toLowerCase()
      if ((lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('contact') || lowerKey.includes('tel')) 
          && user[key] && typeof user[key] === 'string' && user[key].trim()) {
        return user[key].trim()
      }
    }
    
    return ''
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
  
  // Normalize email for comparison (lowercase, trim)
  const normalizeEmail = (email: string | undefined | null): string => {
    return (email || '').toLowerCase().trim()
  }

  // Check if investment matches user (by ID or email)
  const investmentMatchesUser = (inv: any, userId: string, userEmail: string): boolean => {
    const normalizedUserEmail = normalizeEmail(userEmail)
    
    // Check various ID fields
    if (inv.userId === userId || inv.user_id === userId) return true
    
    // Check various email fields (case-insensitive) - including more variations
    const invEmails = [
      normalizeEmail(inv.userEmail),
      normalizeEmail(inv.user_email),
      normalizeEmail(inv.email),
      normalizeEmail(inv.Email),          // Capital E
      normalizeEmail(inv.USER_EMAIL),     // All caps
      normalizeEmail(inv.useremail),      // No underscore
      normalizeEmail(inv.emailAddress),   // Alternative name
      normalizeEmail(inv.email_address),  // Snake case alternative
    ]
    
    return invEmails.some(e => e && e === normalizedUserEmail)
  }

  // Helper function to get user's total investment amount from investments + approved requests
  const getUserTotalInvestment = (userId: string, userEmail: string) => {
    return allInvestmentData
      .filter(inv => investmentMatchesUser(inv, userId, userEmail))
      .reduce((total, inv) => {
        const amount = Number((inv as any).amount_paid || (inv as any).Amount_paid || 0)
        return total + (Number.isFinite(amount) ? amount : 0)
      }, 0)
  }
  
  // Helper function to get user's portfolio sqm from investments + approved requests
  const getUserPortfolioSqm = (userId: string, userEmail: string) => {
    return allInvestmentData
      .filter(inv => investmentMatchesUser(inv, userId, userEmail))
      .reduce((total, inv) => {
        // Check multiple possible SQM field names
        const sqm = Number(
          (inv as any).sqm_purchased || 
          (inv as any).sqm || 
          (inv as any).SQM ||
          (inv as any).Sqm ||
          (inv as any).sqmPurchased ||
          (inv as any).sqm_bought ||
          (inv as any).purchased_sqm ||
          (inv as any).area ||
          0
        )
        return total + (Number.isFinite(sqm) ? sqm : 0)
      }, 0)
  }

  // Get user's investment history (from both collections)
  const getUserInvestmentHistory = (userId: string, userEmail: string) => {
    // Get from investments collection
    const fromInvestments = safeInvestments.filter(inv => 
      investmentMatchesUser(inv, userId, userEmail)
    )
    // Get from investment_requests collection (approved/completed)
    const fromRequests = safeInvestmentRequests.filter((inv: any) => 
      investmentMatchesUser(inv, userId, userEmail) && 
      (inv.status === 'approved' || inv.status === 'completed' || inv.status === 'pending')
    )
    return [...fromInvestments, ...fromRequests]
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
      
      // Use normalized status field from user_profiles (and compatibility fallbacks)
      const isActive = getUserStatus(user) === 'active'
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

  // User Actions
  const handleActivateUser = async (userId: string) => {
    setProcessing(true)
    try {
      await firebaseUtils.updateUserStatus(userId, { 
        status: 'active',
        isActive: true,
        updated_at: new Date()
      })
      toast.success('User activated successfully')
    } catch (error) {
      toast.error('Failed to activate user')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleDeactivateUser = async (userId: string) => {
    setProcessing(true)
    try {
      await firebaseUtils.updateUserStatus(userId, { 
        status: 'inactive',
        isActive: false,
        updated_at: new Date()
      })
      toast.success('User deactivated successfully')
    } catch (error) {
      toast.error('Failed to deactivate user')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: getUserPhone(user) || '',
      address: user.address || '',
      occupation: user.occupation || '',
      bank_name: user.bank_name || ''
    })
    setShowEditModal(true)
  }

  const handleSaveUser = async () => {
    if (!selectedUser) return
    setProcessing(true)
    try {
      await firebaseUtils.updateUserStatus(selectedUser.id, {
        full_name: editForm.full_name,
        phone: editForm.phone,
        address: editForm.address,
        occupation: editForm.occupation,
        bank_name: editForm.bank_name,
        updated_at: new Date()
      })
      toast.success('User updated successfully')
      setShowEditModal(false)
    } catch (error) {
      toast.error('Failed to update user')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleViewHistory = (user: User) => {
    setSelectedUser(user)
    
    // Debug logging to help identify data issues
    const userHistory = getUserInvestmentHistory(user.id, user.email || '')
    const normalizedSearchEmail = normalizeEmail(user.email)
    
    // Find ALL investments that might match this user (partial match for debugging)
    const possibleMatches = [...safeInvestments, ...safeInvestmentRequests].filter((inv: any) => {
      const allEmailFields = [
        inv.userEmail, inv.user_email, inv.email, inv.Email, 
        inv.USER_EMAIL, inv.useremail, inv.emailAddress, inv.email_address
      ].filter(Boolean).map(e => normalizeEmail(e))
      
      // Check if any email field contains part of the search email or vice versa
      return allEmailFields.some(e => 
        e.includes(normalizedSearchEmail.split('@')[0]) || 
        normalizedSearchEmail.includes(e.split('@')[0])
      )
    })
    
    console.log('📊 Investment History Debug for:', user.email, {
      userId: user.id,
      userEmail: user.email,
      normalizedEmail: normalizedSearchEmail,
      historyCount: userHistory.length,
      history: userHistory,
      totalSqm: getUserPortfolioSqm(user.id, user.email || ''),
      totalInvestment: getUserTotalInvestment(user.id, user.email || ''),
      allInvestmentsCount: safeInvestments.length,
      allRequestsCount: safeInvestmentRequests.length,
      // Show possible matches (partial email match)
      possibleMatchesCount: possibleMatches.length,
      possibleMatches: possibleMatches.map((inv: any) => ({
        id: inv.id,
        allFields: Object.keys(inv),
        userEmail: inv.userEmail,
        user_email: inv.user_email,
        email: inv.email,
        Email: inv.Email,
        userId: inv.userId,
        user_id: inv.user_id,
        userName: inv.userName,
        user_name: inv.user_name,
        sqm: inv.sqm,
        sqm_purchased: inv.sqm_purchased,
        amount_paid: inv.amount_paid,
        Amount_paid: inv.Amount_paid,
        totalAmount: inv.totalAmount,
        status: inv.status
      })),
      // Show ALL investments raw (first 10)
      allInvestmentsRaw: safeInvestments.slice(0, 10).map((inv: any) => ({
        id: inv.id,
        fields: Object.keys(inv),
        emails: {
          userEmail: inv.userEmail,
          user_email: inv.user_email,
          email: inv.email,
          Email: inv.Email
        },
        sqm: inv.sqm || inv.sqm_purchased,
        amount: inv.amount_paid || inv.Amount_paid || inv.totalAmount
      }))
    })
    
    setShowHistoryModal(true)
  }

  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`
  }

  const handleExportUsers = () => {
    exportUsersToCSV(filteredUsers, safeInvestments)
  }

  // Detect duplicate users by email
  const detectDuplicates = () => {
    const emailMap = new Map<string, User[]>()
    
    safeUsers.forEach(user => {
      const email = normalizeEmail(user.email)
      if (email) {
        if (!emailMap.has(email)) {
          emailMap.set(email, [])
        }
        emailMap.get(email)!.push(user)
      }
    })
    
    // Filter to only groups with duplicates (more than 1 user per email)
    const duplicates: Array<{email: string, users: User[]}> = []
    emailMap.forEach((users, email) => {
      if (users.length > 1) {
        duplicates.push({ email, users })
      }
    })
    
    setDuplicateGroups(duplicates)
    setShowDuplicatesModal(true)
    
    if (duplicates.length === 0) {
      toast.success('No duplicate users found!')
    } else {
      toast(`Found ${duplicates.length} duplicate email(s)`, { icon: '⚠️' })
    }
  }

  // Delete a duplicate user (keep the other one)
  const handleDeleteDuplicate = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete this duplicate user record? This action cannot be undone.`)) {
      return
    }
    
    setProcessing(true)
    try {
      await firebaseUtils.deleteUser(userId)
      toast.success('Duplicate user deleted')
      
      // Update the duplicates list
      setDuplicateGroups(prev => 
        prev.map(group => {
          if (group.email === email) {
            return {
              ...group,
              users: group.users.filter(u => u.id !== userId)
            }
          }
          return group
        }).filter(group => group.users.length > 1) // Remove groups that no longer have duplicates
      )
    } catch (error) {
      toast.error('Failed to delete user')
      console.error(error)
    }
    setProcessing(false)
  }

  // Merge two duplicate users (combine their data into the primary one)
  const handleMergeDuplicates = async (primaryUser: User, secondaryUser: User) => {
    if (!confirm(`Merge user data into ${primaryUser.email}? The secondary record will be deleted.`)) {
      return
    }
    
    setProcessing(true)
    try {
      // Get the best values from both users
      const mergedData: any = {
        full_name: primaryUser.full_name || secondaryUser.full_name,
        phone: getUserPhone(primaryUser) || getUserPhone(secondaryUser),
        address: (primaryUser as any).address || (secondaryUser as any).address,
        occupation: (primaryUser as any).occupation || (secondaryUser as any).occupation,
        bank_name: (primaryUser as any).bank_name || (secondaryUser as any).bank_name,
        bank_account: (primaryUser as any).bank_account || (secondaryUser as any).bank_account,
        // Keep the earliest created date
        created_at: getUserCreatedDate(primaryUser) && getUserCreatedDate(secondaryUser)
          ? (getUserCreatedDate(primaryUser)! < getUserCreatedDate(secondaryUser)! 
              ? (primaryUser as any).created_at 
              : (secondaryUser as any).created_at)
          : (primaryUser as any).created_at || (secondaryUser as any).created_at,
        // Combine investment totals (will be recalculated from investments anyway)
        updated_at: new Date()
      }
      
      // Update primary user with merged data
      await firebaseUtils.updateUserStatus(primaryUser.id, mergedData)
      
      // Delete secondary user
      await firebaseUtils.deleteUser(secondaryUser.id)
      
      toast.success('Users merged successfully')
      
      // Update the duplicates list
      setDuplicateGroups(prev => 
        prev.map(group => {
          if (group.email === normalizeEmail(primaryUser.email)) {
            return {
              ...group,
              users: group.users.filter(u => u.id !== secondaryUser.id)
            }
          }
          return group
        }).filter(group => group.users.length > 1)
      )
    } catch (error) {
      toast.error('Failed to merge users')
      console.error(error)
    }
    setProcessing(false)
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
        <div className="flex items-center space-x-3">
          <button
            onClick={detectDuplicates}
            className="btn-secondary flex items-center space-x-2 text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Find Duplicates</span>
          </button>
        <button
          onClick={handleExportUsers}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
        </div>
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
                {safeUsers.filter(user => getUserStatus(user) === 'active').length}
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
          <div className="flex flex-wrap gap-2">
            <select
              className="input-field min-w-[140px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <select
              className="input-field min-w-[140px]"
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
              className="input-field min-w-[160px]"
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
                        <div className="text-sm text-gray-600 font-medium mt-1">
                          📞 {getUserPhone(user) || 'No phone'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const status = getUserStatus(user)
                      const label = status === 'unknown' ? (user.status || 'unknown') : status
                      const color =
                        status === 'active'
                        ? 'bg-green-100 text-green-800' 
                          : status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                      return (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
                          {label}
                    </span>
                      )
                    })()}
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
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewHistory(user)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Investment History"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleSendEmail(user.email || '')}
                        className="text-cyan-600 hover:text-cyan-900"
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => getUserStatus(user) === 'active' ? handleDeactivateUser(user.id) : handleActivateUser(user.id)}
                        className={getUserStatus(user) === 'active' ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                        title={getUserStatus(user) === 'active' ? 'Deactivate User' : 'Activate User'}
                        disabled={processing}
                      >
                        {getUserStatus(user) === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
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
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
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
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-700">
                      {selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                </div>
                <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {selectedUser.full_name || 'Unknown User'}
                    </h4>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{getUserPhone(selectedUser as any) || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      getUserStatus(selectedUser) === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {getUserStatus(selectedUser)}
                    </span>
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
                    <p className="text-sm text-gray-900">{selectedUser.referral_code || 'N/A'}</p>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Wallet Balance</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedUser.wallet_balance || 0)}</p>
              </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Joined</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
            </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Login</label>
                    <p className="text-sm text-gray-900">{selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}</p>
          </div>
                </div>

                {selectedUser.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="text-sm text-gray-900">{selectedUser.address}</p>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => {
                      setShowUserModal(false)
                      handleEditUser(selectedUser)
                    }}
                    className="btn-primary flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </button>
                  <button
                    onClick={() => {
                      setShowUserModal(false)
                      handleViewHistory(selectedUser)
                    }}
                    className="btn-secondary flex-1"
                  >
                    <History className="h-4 w-4 mr-2" />
                    View History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email (Read-only)</label>
                  <input
                    type="email"
                    className="input-field mt-1 bg-gray-100"
                    value={editForm.email}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Occupation</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={editForm.occupation}
                    onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={editForm.bank_name}
                    onChange={(e) => setEditForm({...editForm, bank_name: e.target.value})}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={handleSaveUser}
                    disabled={processing}
                    className="btn-primary flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {processing ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investment History Modal */}
      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Investment History - {selectedUser.full_name || selectedUser.email}
                </h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Total Invested</p>
                    <p className="text-xl font-bold text-blue-900">
                      {formatCurrency(getUserTotalInvestment(selectedUser.id, selectedUser.email || ''))}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Total SQM</p>
                    <p className="text-xl font-bold text-green-900">
                      {getUserPortfolioSqm(selectedUser.id, selectedUser.email || '').toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600">Investments</p>
                    <p className="text-xl font-bold text-purple-900">
                      {getUserInvestmentHistory(selectedUser.id, selectedUser.email || '').length}
                    </p>
                  </div>
                </div>

                {/* Investment List */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SQM</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getUserInvestmentHistory(selectedUser.id, selectedUser.email || '').map((inv: any, idx) => (
                        <tr key={inv.id || idx}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {inv.project_title || inv.plotName || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {formatCurrency(inv.amount_paid || inv.Amount_paid || 0)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {inv.sqm_purchased || inv.sqm || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(inv.created_at || inv.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              inv.status === 'completed' || inv.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : inv.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {inv.status || 'unknown'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {getUserInvestmentHistory(selectedUser.id, selectedUser.email || '').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No investment history found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duplicates Modal */}
      {showDuplicatesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[900px] shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Duplicate Users Detected
                  </h3>
                </div>
                <button
                  onClick={() => setShowDuplicatesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {duplicateGroups.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">No Duplicates Found</p>
                  <p className="text-gray-500">All user emails are unique.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-800">
                      <strong>Found {duplicateGroups.length} duplicate email(s).</strong> Review each group and decide which record to keep.
                      You can either delete the duplicate or merge both records into one.
                    </p>
                  </div>

                  {duplicateGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-4 py-3 border-b">
                        <h4 className="font-medium text-gray-900">
                          Email: <span className="text-blue-600">{group.email}</span>
                          <span className="ml-2 text-sm text-gray-500">({group.users.length} records)</span>
                        </h4>
                      </div>
                      
                      <div className="divide-y divide-gray-100">
                        {group.users.map((user, userIdx) => (
                          <div key={user.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium">
                                    {userIdx + 1}
                                  </span>
                                  <div>
                                    <p className="font-medium text-gray-900">{user.full_name || 'No name'}</p>
                                    <p className="text-sm text-gray-500">ID: {user.id}</p>
                                  </div>
                                </div>
                                
                                <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-500">Phone</p>
                                    <p className="text-gray-900">{getUserPhone(user) || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Status</p>
                                    <p className={`font-medium ${getUserStatus(user) === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                      {getUserStatus(user)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Portfolio</p>
                                    <p className="text-gray-900">{getUserPortfolioSqm(user.id, user.email || '').toLocaleString()} SQM</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Created</p>
                                    <p className="text-gray-900">{formatDate(getUserCreatedDate(user))}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                {group.users.length === 2 && userIdx === 1 && (
                                  <button
                                    onClick={() => handleMergeDuplicates(group.users[0], user)}
                                    disabled={processing}
                                    className="btn-secondary text-sm px-3 py-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                                    title="Merge into first record"
                                  >
                                    <Merge className="h-4 w-4 mr-1" />
                                    Merge
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteDuplicate(user.id, group.email)}
                                  disabled={processing}
                                  className="btn-secondary text-sm px-3 py-1 text-red-600 border-red-300 hover:bg-red-50"
                                  title="Delete this record"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
