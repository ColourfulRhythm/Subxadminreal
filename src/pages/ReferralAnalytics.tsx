import { useState } from 'react'
import { 
  Users2, 
  Search, 
  TrendingUp,
  DollarSign,
  Eye,
  Award,
  Download,
  Plus,
  XCircle,
  CheckCircle
} from 'lucide-react'
import { useReferrals, useWithdrawalRequests } from '../hooks/useFirebase'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

export default function ReferralAnalytics() {
  const { data: referrals, loading: referralsLoading, error: referralsError } = useReferrals()
  const { data: withdrawalRequests, loading: withdrawalsLoading, error: withdrawalsError } = useWithdrawalRequests()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all')
  const [selectedReferrer, setSelectedReferrer] = useState<any>(null)
  const [showReferrerModal, setShowReferrerModal] = useState(false)

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
      }
    } else {
      referralCommissions.set(referrerId, {
        id: referrerId,
        email: email,
        totalCommission: amount,
        totalReferrals: 1,
        paidCount: referral.status === 'paid' ? 1 : 0,
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
        withdrawnAmount: 0
      }
      
      currentData.withdrawnAmount += Number(withdrawal.amount || 0)
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

  const handleReferralAction = async (referralId: string, action: string) => {
    console.log(`Performing ${action} on referral ${referralId}`)
  }

  const handleExportReferrals = () => {
    console.log('Exporting referrals to CSV')
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

  // Withdrawal requests are now shown in the analysis section below

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Referral Analytics</h1>
          <p className="page-subtitle">Track referral performance and commission payouts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportReferrals}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Referral</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue-50">
            <Users2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="stat-label">Total Referrals</p>
            <p className="stat-value">{safeReferrals.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-emerald-50">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="stat-label">Paid Referrals</p>
            <p className="stat-value">
              {safeReferrals.filter(r => r.status === 'paid').length}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-violet-50">
            <DollarSign className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <p className="stat-label">Total Commission</p>
            <p className="stat-value text-xl">
              {formatCurrency(safeReferrals.reduce((sum, r) => sum + getCommissionAmount(r), 0))}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-amber-50">
            <TrendingUp className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="stat-label">Active Referrers</p>
            <p className="stat-value">
              {new Set(safeReferrals.map(r => r.referrerId)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Withdrawal Requests Analysis */}
      <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <h3 className="chart-title text-blue-900">Withdrawal Requests Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Requests</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{safeWithdrawalRequests.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Referral Withdrawals</p>
            <p className="text-2xl font-semibold text-emerald-600 mt-1">
              {safeWithdrawalRequests.filter(w => w.type === 'referral').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Amount Withdrawn</p>
            <p className="text-2xl font-semibold text-violet-600 mt-1">
              {formatCurrency(
                safeWithdrawalRequests
                  .filter(w => w.type === 'referral')
                  .reduce((sum, w) => sum + w.amount, 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <h3 className="chart-title">Referral Status</h3>
          <ResponsiveContainer width="100%" height={280}>
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
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="chart-title">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="referrals" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} name="Referrals" />
              <Line type="monotone" dataKey="commission" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} name="Commission" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Referrers */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="chart-title mb-0">Top Referrers</h3>
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
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{referrer.email}</p>
                    <p className="text-xs text-gray-500">{referrer.totalReferrals} referrals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(referrer.totalCommission)}</p>
                  <p className="text-xs text-gray-500">{referrer.conversionRate.toFixed(0)}% conversion</p>
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
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referrer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referred User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{(referral as any).referred_by || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{(referral as any).full_name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(referral.commission_amount || referral.commission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(referral.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {referral.paidAt ? formatDate(referral.paidAt) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReferrer(referral)
                          setShowReferrerModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {referral.status === 'pending' && (
                        <button
                          onClick={() => handleReferralAction(referral.id, 'pay')}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Referral Details</h3>
                <button
                  onClick={() => setShowReferrerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Referrer</label>
                  <p className="text-sm text-gray-900">{(selectedReferrer as any).referred_by || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Referred User</label>
                  <p className="text-sm text-gray-900">{(selectedReferrer as any).full_name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Commission</label>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedReferrer.commission_amount || selectedReferrer.commission)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedReferrer.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedReferrer.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedReferrer.status}
                  </span>
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}