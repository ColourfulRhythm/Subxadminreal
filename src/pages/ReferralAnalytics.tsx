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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-x-text">Referral Analytics</h1>
          <p className="text-white/60">Track referral performance and commission payouts</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportReferrals}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Referral</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/60">Total Referrals</p>
              <p className="text-2xl font-bold text-x-text">{safeReferrals.length}</p>
              <p className="text-xs text-white/40">From referrals collection</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/60">Paid Referrals</p>
              <p className="text-2xl font-bold text-x-text">
                {safeReferrals.filter(r => r.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/60">Total Commission</p>
              <p className="text-2xl font-bold text-x-text">
                {formatCurrency(safeReferrals.reduce((sum, r) => sum + getCommissionAmount(r), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/60">Active Referrers</p>
              <p className="text-2xl font-bold text-x-text">
                {new Set(safeReferrals.map(r => r.referrerId)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Requests Analysis */}
      <div className="bg-primary-600/10 border border-primary-600/20 rounded-2xl p-4 mb-6">
        <h3 className="text-lg font-semibold text-primary-100 mb-4">Withdrawal Requests Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-x-panel/80 border border-white/10 rounded-2xl p-4">
            <p className="text-sm font-medium text-white/60">Total Withdrawal Requests</p>
            <p className="text-2xl font-bold text-x-text">{safeWithdrawalRequests.length}</p>
            <p className="text-xs text-white/40">From withdrawalRequests collection</p>
          </div>
          <div className="bg-x-panel/80 border border-white/10 rounded-2xl p-4">
            <p className="text-sm font-medium text-white/60">Referral Withdrawals</p>
            <p className="text-2xl font-bold text-green-200">
              {safeWithdrawalRequests.filter(w => w.type === 'referral').length}
            </p>
            <p className="text-xs text-white/40">Type = 'referral'</p>
          </div>
          <div className="bg-x-panel/80 border border-white/10 rounded-2xl p-4">
            <p className="text-sm font-medium text-white/60">Referral Withdrawal Amount</p>
            <p className="text-2xl font-bold text-purple-200">
              {formatCurrency(
                safeWithdrawalRequests
                  .filter(w => w.type === 'referral')
                  .reduce((sum, w) => sum + w.amount, 0)
              )}
            </p>
            <p className="text-xs text-white/40">Total withdrawn from referrals</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="referrals" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="commission" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Referrers */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-x-text">Top Referrers</h3>
          <Award className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="space-y-4">
          {topReferrers.map((referrer, index) => (
            <div key={referrer.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-x-text">{referrer.email}</p>
                  <p className="text-sm text-white/50">{referrer.totalReferrals} referrals</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-x-text">{formatCurrency(referrer.totalCommission)}</p>
                <p className="text-sm text-white/50">{referrer.conversionRate}% conversion</p>
              </div>
            </div>
          ))}
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
            <thead className="bg-white/5">
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
            <tbody className="bg-transparent divide-y divide-white/10">
              {filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-x-text">{(referral as any).referred_by || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-x-text">{(referral as any).full_name || 'N/A'}</div>
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
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-white/10 w-96 shadow-2xl rounded-2xl bg-x-panel">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-x-text">Referral Details</h3>
                <button
                  onClick={() => setShowReferrerModal(false)}
                  className="text-white/50 hover:text-white/80"
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