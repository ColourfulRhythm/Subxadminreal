import { useState } from 'react'
import { 
  Users2, 
  Search, 
  TrendingUp,
  DollarSign,
  Eye,
  Award,
  Download,
  XCircle,
  CheckCircle,
  Send,
  Link2,
  Settings,
  X,
  Percent
} from 'lucide-react'
import { useReferrals, useWithdrawalRequests, firebaseUtils } from '../hooks/useFirebase'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import toast from 'react-hot-toast'

export default function ReferralAnalytics() {
  const { data: referrals, loading: referralsLoading, error: referralsError } = useReferrals()
  const { data: withdrawalRequests, loading: withdrawalsLoading, error: withdrawalsError } = useWithdrawalRequests()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all')
  const [selectedReferrer, setSelectedReferrer] = useState<any>(null)
  const [showReferrerModal, setShowReferrerModal] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showBulkPayoutModal, setShowBulkPayoutModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [commissionSettings, setCommissionSettings] = useState({
    defaultRate: 5,
    tierRates: [
      { minReferrals: 0, rate: 5 },
      { minReferrals: 10, rate: 7 },
      { minReferrals: 25, rate: 10 }
    ]
  })
  const [payoutForm, setPayoutForm] = useState({
    amount: 0,
    bankReference: '',
    notes: ''
  })

  // Ensure data is arrays
  const safeReferrals = Array.isArray(referrals) ? referrals : []
  const safeWithdrawalRequests = Array.isArray(withdrawalRequests) ? withdrawalRequests : []

  // Firestore commonly returns Timestamp objects; normalize to JS Date to avoid tab-crashing runtime errors.
  const toDateSafe = (value: any): Date | null => {
    if (!value) return null
    if (value instanceof Date) return value
    if (typeof value === 'object' && typeof value.toDate === 'function') {
      try {
        return value.toDate()
      } catch {
        return null
      }
    }
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  const getCommissionAmount = (referral: any): number => {
    const amount = referral?.commission_amount ?? referral?.commission ?? 0
    const n = Number(amount)
    return Number.isFinite(n) ? n : 0
  }

  // Combined data analysis - referrals and withdrawals
  const filteredReferrals = safeReferrals.filter(referral => {
    const matchesSearch = ((referral as any).referred_by || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ((referral as any).full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || referral.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  // Enhanced calculations including withdrawal request data
  const allReferralUsers = new Set()
  const referralCommissions = new Map()

  // Process referrals collection data
  safeReferrals.forEach(referral => {
    const referrerId = referral.referrerId
    const amount = getCommissionAmount(referral)
    const email = (referral as any).referred_by
    
    allReferralUsers.add(referrerId)
    
    if (referralCommissions.has(referrerId)) {
      const existing = referralCommissions.get(referrerId)
      existing.totalCommission += amount
      existing.totalReferrals++
      if (referral.status === 'paid') {
        existing.paidCount++
        existing.paidAmount += amount
      } else if (referral.status === 'pending') {
        existing.pendingAmount += amount
      }
    } else {
      referralCommissions.set(referrerId, {
        id: referrerId,
        email: email,
        totalCommission: amount,
        totalReferrals: 1,
        paidCount: referral.status === 'paid' ? 1 : 0,
        paidAmount: referral.status === 'paid' ? amount : 0,
        pendingAmount: referral.status === 'pending' ? amount : 0,
        withdrawnAmount: 0
      })
    }
  })

  // Process withdrawal requests to find referral withdrawals
  safeWithdrawalRequests.forEach(withdrawal => {
    if (withdrawal.type === 'referral' && (withdrawal.referrer_code || withdrawal.referrerId)) {
      const referrerId = withdrawal.referrer_code || withdrawal.referrerId
      allReferralUsers.add(referrerId)
      
      const currentData = referralCommissions.get(referrerId) || {
        id: referrerId,
        email: withdrawal.userEmail || 'Unknown',
        totalCommission: 0,
        totalReferrals: 0,
        paidCount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        withdrawnAmount: 0
      }
      
      if (withdrawal.status === 'completed') {
        currentData.withdrawnAmount += Number(withdrawal.amount || 0)
      }
      referralCommissions.set(referrerId, currentData)
    }
  })

  // Convert to array and sort
  const topReferrers = Array.from(referralCommissions.values())
    .map(item => ({
      ...item,
      conversionRate: item.totalCommission > 0 ? (item.paidCount / (item.totalReferrals || 1)) * 100 : 0,
      pendingWithdrawal: (item.totalCommission - item.withdrawnAmount) > 0 ? 
        (item.totalCommission - item.withdrawnAmount) : 0
    }))
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 10)

  // Calculate totals
  const totalPendingCommission = safeReferrals
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + getCommissionAmount(r), 0)

  const totalPaidCommission = safeReferrals
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + getCommissionAmount(r), 0)

  // Handlers
  const handlePayCommission = async (referralId: string) => {
    setProcessing(true)
    try {
      await firebaseUtils.processReferralCommission(referralId, 'pay')
      toast.success('Commission marked as paid')
      setShowPayoutModal(false)
    } catch (error) {
      toast.error('Failed to process commission')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleCancelCommission = async (referralId: string) => {
    setProcessing(true)
    try {
      await firebaseUtils.processReferralCommission(referralId, 'cancel')
      toast.success('Commission cancelled')
    } catch (error) {
      toast.error('Failed to cancel commission')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleBulkPayout = async () => {
    setProcessing(true)
    let successCount = 0
    for (const id of selectedIds) {
      try {
        await firebaseUtils.processReferralCommission(id, 'pay')
        successCount++
      } catch (error) {
        console.error(`Failed to pay ${id}:`, error)
      }
    }
    toast.success(`${successCount} commissions paid`)
    setSelectedIds([])
    setShowBulkPayoutModal(false)
    setProcessing(false)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAllPending = () => {
    const pendingIds = filteredReferrals.filter(r => r.status === 'pending').map(r => r.id)
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendingIds)
    }
  }

  const generateReferralLink = (code: string) => {
    const link = `https://subx.ng/register?ref=${code}`
    navigator.clipboard.writeText(link)
    toast.success('Referral link copied!')
  }

  const handleExportReferrals = () => {
    const csv = [
      ['Referrer', 'Referred User', 'Commission', 'Status', 'Created', 'Paid Date'].join(','),
      ...filteredReferrals.map(r => [
        (r as any).referred_by || '',
        (r as any).full_name || '',
        getCommissionAmount(r),
        r.status || '',
        formatDate(r.createdAt),
        r.paidAt ? formatDate(r.paidAt) : ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `referrals-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Exported to CSV')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | undefined) => {
    const safe = toDateSafe(date) ?? toDateSafe(date as any)
    if (!safe) return 'N/A'
    return safe.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Loading and error states
  const loading = referralsLoading || withdrawalsLoading
  const error = referralsError || withdrawalsError

  // Enhanced Chart data using both collections
  const statusChartData = [
    { name: 'Paid', value: safeReferrals.filter(r => r.status === 'paid').length, color: '#10B981' },
    { name: 'Pending', value: safeReferrals.filter(r => r.status === 'pending').length, color: '#F59E0B' },
    { name: 'Cancelled', value: safeReferrals.filter(r => r.status === 'cancelled').length, color: '#EF4444' },
  ]

  const monthlyData = safeReferrals.reduce((acc, referral) => {
    const month = (toDateSafe((referral as any).createdAt) ?? new Date()).toISOString().slice(0, 7)
    const existing = acc.find(item => item.month === month)
    if (existing) {
      existing.referrals++
      existing.commission += getCommissionAmount(referral)
    } else {
      acc.push({
        month,
        referrals: 1,
        commission: getCommissionAmount(referral)
      })
    }
    return acc
  }, [] as any[]).sort((a, b) => a.month.localeCompare(b.month))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading referrals and withdrawal requests...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading referrals</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Analytics</h1>
          <p className="text-gray-600">Track referral performance and commission payouts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Commission Rates</span>
          </button>
          <button
            onClick={handleExportReferrals}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkPayoutModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>Pay Selected ({selectedIds.length})</span>
          </button>
          )}
        </div>
      </div>

      {/* Pending Payout Alert */}
      {totalPendingCommission > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-amber-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  Pending Commission Payouts
                </h3>
                <p className="text-sm text-amber-700">
                  {safeReferrals.filter(r => r.status === 'pending').length} referrals awaiting payment totaling {formatCurrency(totalPendingCommission)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const pendingIds = safeReferrals.filter(r => r.status === 'pending').map(r => r.id)
                setSelectedIds(pendingIds)
                setShowBulkPayoutModal(true)
              }}
              className="btn-primary text-sm"
            >
              Pay All Pending
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{safeReferrals.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeReferrals.filter(r => r.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-xl font-bold text-amber-600">
                {formatCurrency(totalPendingCommission)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Send className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Paid</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(totalPaidCommission)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Referrers</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(safeReferrals.map(r => r.referrerId)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="referrals" stroke="#3B82F6" strokeWidth={2} name="Referrals" />
              <Line type="monotone" dataKey="commission" stroke="#10B981" strokeWidth={2} name="Commission" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Referrers */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Top Referrers</h3>
          <Award className="h-5 w-5 text-amber-500" />
        </div>
        <div className="space-y-3">
          {topReferrers.length === 0 ? (
            <div className="text-center py-8">
              <Users2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No referrers data available</p>
            </div>
          ) : (
            topReferrers.map((referrer, index) => (
              <div key={referrer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    index === 0 ? 'bg-amber-100 text-amber-600' :
                    index === 1 ? 'bg-gray-200 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                  {index + 1}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-900">{referrer.email || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{referrer.totalReferrals} referrals • {referrer.conversionRate.toFixed(0)}% paid</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(referrer.totalCommission)}</p>
                  {referrer.pendingAmount > 0 && (
                    <p className="text-xs text-amber-600">Pending: {formatCurrency(referrer.pendingAmount)}</p>
                  )}
                </div>
              </div>
            ))
          )}
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
                placeholder="Search by referrer or referred user email..."
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
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {filteredReferrals.filter(r => r.status === 'pending').length > 0 && (
              <button
                onClick={toggleSelectAllPending}
                className="btn-secondary text-sm"
              >
                {selectedIds.length > 0 ? 'Clear' : 'Select All Pending'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredReferrals.filter(r => r.status === 'pending').length}
                    onChange={toggleSelectAllPending}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referrer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referred User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    {referral.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(referral.id)}
                        onChange={() => toggleSelect(referral.id)}
                        className="rounded border-gray-300"
                      />
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{(referral as any).referred_by || 'N/A'}</span>
                      {(referral as any).referred_by && (
                        <button
                          onClick={() => generateReferralLink((referral as any).referred_by)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Copy referral link"
                        >
                          <Link2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{(referral as any).full_name || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(referral.commission_amount || referral.commission)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      referral.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : referral.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {referral.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(referral.createdAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {referral.paidAt ? formatDate(referral.paidAt) : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReferrer(referral)
                          setShowReferrerModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {referral.status === 'pending' && (
                        <>
                        <button
                            onClick={() => {
                              setSelectedReferrer(referral)
                              setPayoutForm({ amount: getCommissionAmount(referral), bankReference: '', notes: '' })
                              setShowPayoutModal(true)
                            }}
                          className="text-green-600 hover:text-green-900"
                            title="Pay Commission"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancelCommission(referral.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                            disabled={processing}
                          >
                            <XCircle className="h-4 w-4" />
                        </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReferrals.length === 0 && (
          <div className="text-center py-8">
            <Users2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No referrals available in the system.'}
            </p>
          </div>
        )}
      </div>

      {/* Referrer Detail Modal */}
      {showReferrerModal && selectedReferrer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[450px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Referral Details</h3>
                <button
                  onClick={() => setShowReferrerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Commission Amount</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(selectedReferrer.commission_amount || selectedReferrer.commission)}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                    selectedReferrer.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedReferrer.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedReferrer.status}
                  </span>
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Referrer</label>
                    <p className="text-sm text-gray-900">{(selectedReferrer as any).referred_by || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Referred User</label>
                    <p className="text-sm text-gray-900">{(selectedReferrer as any).full_name || 'N/A'}</p>
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedReferrer.createdAt)}</p>
                </div>
                {selectedReferrer.paidAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paid Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedReferrer.paidAt)}</p>
                  </div>
                )}
                </div>

                {selectedReferrer.status === 'pending' && (
                  <div className="flex space-x-2 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowReferrerModal(false)
                        setPayoutForm({ amount: getCommissionAmount(selectedReferrer), bankReference: '', notes: '' })
                        setShowPayoutModal(true)
                      }}
                      className="btn-primary flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Pay Commission
                    </button>
                    <button
                      onClick={() => {
                        handleCancelCommission(selectedReferrer.id)
                        setShowReferrerModal(false)
                      }}
                      className="btn-danger flex-1"
                      disabled={processing}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && selectedReferrer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[450px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Process Commission Payout</h3>
                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Payout Amount</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(payoutForm.amount)}</p>
                  <p className="text-sm text-green-700 mt-1">To: {(selectedReferrer as any).referred_by}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Transfer Reference</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    placeholder="Enter transfer reference"
                    value={payoutForm.bankReference}
                    onChange={(e) => setPayoutForm({...payoutForm, bankReference: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea
                    className="input-field mt-1"
                    rows={2}
                    placeholder="Add notes..."
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({...payoutForm, notes: e.target.value})}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => handlePayCommission(selectedReferrer.id)}
                    className="btn-primary flex-1"
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processing ? 'Processing...' : 'Confirm Payout'}
                  </button>
                  <button
                    onClick={() => setShowPayoutModal(false)}
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

      {/* Bulk Payout Modal */}
      {showBulkPayoutModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[450px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bulk Commission Payout</h3>
                <button
                  onClick={() => setShowBulkPayoutModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">Total Payout</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(
                      safeReferrals
                        .filter(r => selectedIds.includes(r.id))
                        .reduce((sum, r) => sum + getCommissionAmount(r), 0)
                    )}
                  </p>
                  <p className="text-sm text-green-700 mt-1">{selectedIds.length} referral{selectedIds.length > 1 ? 's' : ''} selected</p>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded-lg">
                  {safeReferrals
                    .filter(r => selectedIds.includes(r.id))
                    .map(r => (
                      <div key={r.id} className="flex justify-between p-2 border-b last:border-0">
                        <span className="text-sm text-gray-600">{(r as any).referred_by}</span>
                        <span className="text-sm font-medium">{formatCurrency(getCommissionAmount(r))}</span>
                      </div>
                    ))
                  }
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={handleBulkPayout}
                    className="btn-primary flex-1"
                    disabled={processing}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {processing ? 'Processing...' : 'Pay All Selected'}
                  </button>
                  <button
                    onClick={() => setShowBulkPayoutModal(false)}
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

      {/* Commission Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Commission Rate Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Commission Rate</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="input-field w-24"
                      value={commissionSettings.defaultRate}
                      onChange={(e) => setCommissionSettings({...commissionSettings, defaultRate: Number(e.target.value)})}
                    />
                    <Percent className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiered Commission Rates</label>
                  <div className="space-y-2">
                    {commissionSettings.tierRates.map((tier, idx) => (
                      <div key={idx} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 w-24">{tier.minReferrals}+ referrals:</span>
                        <input
                          type="number"
                          className="input-field w-20"
                          value={tier.rate}
                          onChange={(e) => {
                            const newTiers = [...commissionSettings.tierRates]
                            newTiers[idx].rate = Number(e.target.value)
                            setCommissionSettings({...commissionSettings, tierRates: newTiers})
                          }}
                        />
                        <Percent className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> These settings will apply to new referrals. Existing commissions will not be affected.
                  </p>
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => {
                      toast.success('Commission rates saved')
                      setShowSettingsModal(false)
                    }}
                    className="btn-primary flex-1"
                  >
                    Save Settings
                  </button>
                  <button
                    onClick={() => setShowSettingsModal(false)}
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
    </div>
  )
}
