import { useState } from 'react'
import { 
  DollarSign, 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Building2,
  Download
} from 'lucide-react'
import { WithdrawalRequest } from '../types'
import { useWithdrawalRequests } from '../hooks/useFirebase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function WithdrawalManagement() {
  const { data: withdrawals, loading, error } = useWithdrawalRequests()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all')
  const [filterType, setFilterType] = useState<'all' | 'referral' | 'investment_return' | 'other'>('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)

  // Ensure withdrawals is an array
  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : []

  const filteredWithdrawals = safeWithdrawals.filter(withdrawal => {
    const userName = withdrawal.userName || ''
    const userEmail = withdrawal.userEmail || ''
    
    const matchesSearch = (userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (userEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || withdrawal.status === filterStatus
    const matchesType = filterType === 'all' || withdrawal.type === filterType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock }
      case 'approved':
        return { color: 'bg-blue-100 text-blue-800', label: 'Approved', icon: CheckCircle }
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'Unknown', icon: Clock }
    }
  }

  const handleWithdrawalAction = async (withdrawalId: string, action: string) => {
    console.log(`Performing ${action} on withdrawal ${withdrawalId}`)
  }

  const handleExportWithdrawals = () => {
    console.log('Exporting withdrawals to CSV')
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Chart data
  const statusChartData = [
    { name: 'Pending', value: safeWithdrawals.filter(w => w.status === 'pending').length, color: '#F59E0B' },
    { name: 'Approved', value: safeWithdrawals.filter(w => w.status === 'approved').length, color: '#3B82F6' },
    { name: 'Completed', value: safeWithdrawals.filter(w => w.status === 'completed').length, color: '#10B981' },
    { name: 'Rejected', value: safeWithdrawals.filter(w => w.status === 'rejected').length, color: '#EF4444' },
  ]

  const typeChartData = [
    { name: 'Referral', value: safeWithdrawals.filter(w => w.type === 'referral').length, color: '#8B5CF6' },
    { name: 'Investment Return', value: safeWithdrawals.filter(w => w.type === 'investment_return').length, color: '#06B6D4' },
    { name: 'Other', value: safeWithdrawals.filter(w => w.type === 'other').length, color: '#F97316' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading withdrawals...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading withdrawals</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Management</h1>
          <p className="text-gray-600">Process and monitor user withdrawal requests</p>
        </div>
        <button
          onClick={handleExportWithdrawals}
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
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{safeWithdrawals.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeWithdrawals.filter(w => w.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeWithdrawals.filter(w => w.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(safeWithdrawals.reduce((sum, w) => sum + w.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Status</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
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
                placeholder="Search by user name or email..."
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
            <select
              className="input-field"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">All Types</option>
              <option value="referral">Referral</option>
              <option value="investment_return">Investment Return</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => {
                const StatusIcon = getStatusInfo(withdrawal.status).icon
                return (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{withdrawal.userName || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{withdrawal.userEmail || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {withdrawal.type ? withdrawal.type.replace('_', ' ') : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(withdrawal.status).color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {getStatusInfo(withdrawal.status).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{withdrawal.bankDetails?.accountNumber || 'N/A'}</div>
                        <div className="text-gray-500">{withdrawal.bankDetails?.bankName || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal)
                            setShowWithdrawalModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredWithdrawals.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No withdrawals found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No withdrawal requests available.'}
            </p>
          </div>
        )}
      </div>

      {/* Withdrawal Detail Modal */}
      {showWithdrawalModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Withdrawal Details</h3>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedWithdrawal.userName}</p>
                  <p className="text-sm text-gray-500">{selectedWithdrawal.userEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="text-sm text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedWithdrawal.type ? selectedWithdrawal.type.replace('_', ' ') : 'Unknown'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(selectedWithdrawal.status).color}`}>
                    {getStatusInfo(selectedWithdrawal.status).label}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Details</label>
                  <div className="text-sm text-gray-900">
                    <p>Account: {selectedWithdrawal.bankDetails?.accountNumber || 'N/A'}</p>
                    <p>Bank: {selectedWithdrawal.bankDetails?.bankName || 'N/A'}</p>
                    <p>Account Name: {selectedWithdrawal.bankDetails?.accountName || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedWithdrawal.createdAt)}</p>
                </div>
                {selectedWithdrawal.processedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Processed</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedWithdrawal.processedAt)}</p>
                    <p className="text-sm text-gray-500">By: {selectedWithdrawal.processedBy}</p>
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