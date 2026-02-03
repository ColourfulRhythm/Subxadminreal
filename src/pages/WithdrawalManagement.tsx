import { useState } from 'react'
import { 
  DollarSign, 
  Search, 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Building2,
  Download,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  X,
  Send,
  Copy
} from 'lucide-react'
import { WithdrawalRequest } from '../types'
import { useWithdrawalRequests, firebaseUtils } from '../hooks/useFirebase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

export default function WithdrawalManagement() {
  const { data: withdrawals, loading, error } = useWithdrawalRequests()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all')
  const [filterType, setFilterType] = useState<'all' | 'referral' | 'investment_return' | 'other'>('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)
  const [processForm, setProcessForm] = useState({
    bankReference: '',
    notes: ''
  })

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

  const pendingWithdrawals = safeWithdrawals.filter(w => w.status === 'pending')
  const approvedWithdrawals = safeWithdrawals.filter(w => w.status === 'approved')
  const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock }
      case 'approved':
        return { color: 'bg-blue-100 text-blue-800', label: 'Approved', icon: CheckCircle }
      case 'processing':
        return { color: 'bg-purple-100 text-purple-800', label: 'Processing', icon: RefreshCw }
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle }
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'Unknown', icon: Clock }
    }
  }

  const handleApprove = async (withdrawalId: string) => {
    setProcessing(true)
    try {
      await firebaseUtils.approveWithdrawal(withdrawalId)
      toast.success('Withdrawal approved successfully')
    } catch (error) {
      toast.error('Failed to approve withdrawal')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleReject = async (withdrawalId: string) => {
    setProcessing(true)
    try {
      await firebaseUtils.rejectWithdrawal(withdrawalId)
      toast.success('Withdrawal rejected')
    } catch (error) {
      toast.error('Failed to reject withdrawal')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleComplete = async (withdrawalId: string) => {
    setProcessing(true)
    try {
      await firebaseUtils.completeWithdrawal(withdrawalId)
      toast.success('Withdrawal marked as completed')
      setShowProcessModal(false)
      setProcessForm({ bankReference: '', notes: '' })
    } catch (error) {
      toast.error('Failed to complete withdrawal')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleBulkApprove = async () => {
    setProcessing(true)
    let successCount = 0
    for (const id of selectedIds) {
      try {
        await firebaseUtils.approveWithdrawal(id)
        successCount++
      } catch (error) {
        console.error(`Failed to approve ${id}:`, error)
      }
    }
    toast.success(`${successCount} withdrawals approved`)
    setSelectedIds([])
    setShowBulkModal(false)
    setProcessing(false)
  }

  const handleBulkComplete = async () => {
    setProcessing(true)
    let successCount = 0
    for (const id of selectedIds) {
      try {
        await firebaseUtils.completeWithdrawal(id)
        successCount++
      } catch (error) {
        console.error(`Failed to complete ${id}:`, error)
      }
    }
    toast.success(`${successCount} withdrawals completed`)
    setSelectedIds([])
    setShowBulkModal(false)
    setProcessing(false)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredWithdrawals.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredWithdrawals.map(w => w.id))
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const handleExportWithdrawals = () => {
    const csv = [
      ['User', 'Email', 'Amount', 'Type', 'Status', 'Bank', 'Account', 'Account Name', 'Date'].join(','),
      ...filteredWithdrawals.map(w => [
        w.userName || '',
        w.userEmail || '',
        w.amount || 0,
        w.type || '',
        w.status || '',
        w.bankDetails?.bankName || '',
        w.bankDetails?.accountNumber || '',
        w.bankDetails?.accountName || '',
        formatDate(w.createdAt)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `withdrawals-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Exported to CSV')
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '₦0'
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    
    // Handle Firebase timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    if (date instanceof Date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    }
    
    const dateObj = new Date(date)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return 'Invalid Date'
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
        <div className="flex space-x-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Bulk Actions ({selectedIds.length})</span>
            </button>
          )}
        <button
          onClick={handleExportWithdrawals}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>
      </div>

      {/* Alert for pending withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                {pendingWithdrawals.length} Pending Withdrawal{pendingWithdrawals.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-yellow-700">
                Total pending amount: {formatCurrency(totalPendingAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <p className="text-2xl font-bold text-gray-900">{pendingWithdrawals.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRight className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{approvedWithdrawals.length}</p>
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
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(safeWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
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
          <div className="flex justify-center space-x-4 mt-2">
            {statusChartData.map((item, idx) => (
              <div key={idx} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Types</h3>
          <ResponsiveContainer width="100%" height={250}>
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
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredWithdrawals.length && filteredWithdrawals.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => {
                const StatusIcon = getStatusInfo(withdrawal.status).icon
                return (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(withdrawal.id)}
                        onChange={() => toggleSelect(withdrawal.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{withdrawal.userName || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{withdrawal.userEmail || 'No email'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {withdrawal.type ? withdrawal.type.replace('_', ' ') : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(withdrawal.status).color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {getStatusInfo(withdrawal.status).label}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                      <div>
                          <div className="font-medium">{withdrawal.bankDetails?.accountNumber || 'N/A'}</div>
                          <div className="text-gray-500 text-xs">{withdrawal.bankDetails?.bankName || 'N/A'}</div>
                        </div>
                        {withdrawal.bankDetails?.accountNumber && (
                          <button
                            onClick={() => copyToClipboard(withdrawal.bankDetails?.accountNumber || '')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal)
                            setShowWithdrawalModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(withdrawal.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                              disabled={processing}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(withdrawal.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                              disabled={processing}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'approved' && (
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal)
                              setShowProcessModal(true)
                            }}
                            className="text-purple-600 hover:text-purple-900"
                            title="Process & Complete"
                          >
                            <Send className="h-4 w-4" />
                          </button>
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
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Withdrawal Details</h3>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getStatusInfo(selectedWithdrawal.status).color}`}>
                      {getStatusInfo(selectedWithdrawal.status).label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="text-sm text-gray-900">{selectedWithdrawal.userName}</p>
                  <p className="text-sm text-gray-500">{selectedWithdrawal.userEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900">{selectedWithdrawal.type ? selectedWithdrawal.type.replace('_', ' ') : 'Unknown'}</p>
                </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Details</label>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Bank:</span>
                      <span className="text-sm font-medium">{selectedWithdrawal.bankDetails?.bankName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Account Number:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{selectedWithdrawal.bankDetails?.accountNumber || 'N/A'}</span>
                        {selectedWithdrawal.bankDetails?.accountNumber && (
                          <button
                            onClick={() => copyToClipboard(selectedWithdrawal.bankDetails?.accountNumber || '')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Account Name:</span>
                      <span className="text-sm font-medium">{selectedWithdrawal.bankDetails?.accountName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Requested</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedWithdrawal.createdAt)}</p>
                </div>
                {selectedWithdrawal.processedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Processed</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedWithdrawal.processedAt)}</p>
                      {selectedWithdrawal.processedBy && (
                    <p className="text-sm text-gray-500">By: {selectedWithdrawal.processedBy}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4 border-t">
                  {selectedWithdrawal.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(selectedWithdrawal.id)
                          setShowWithdrawalModal(false)
                        }}
                        className="btn-primary flex-1"
                        disabled={processing}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedWithdrawal.id)
                          setShowWithdrawalModal(false)
                        }}
                        className="btn-danger flex-1"
                        disabled={processing}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </>
                  )}
                  {selectedWithdrawal.status === 'approved' && (
                    <button
                      onClick={() => {
                        setShowWithdrawalModal(false)
                        setShowProcessModal(true)
                      }}
                      className="btn-primary flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Process Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Payment Modal */}
      {showProcessModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Process Payment</h3>
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Transfer Amount</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(selectedWithdrawal.amount)}</p>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>To: {selectedWithdrawal.bankDetails?.accountName}</p>
                    <p>{selectedWithdrawal.bankDetails?.bankName} - {selectedWithdrawal.bankDetails?.accountNumber}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Bank Transfer Reference</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    placeholder="Enter bank transfer reference number"
                    value={processForm.bankReference}
                    onChange={(e) => setProcessForm({...processForm, bankReference: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea
                    className="input-field mt-1"
                    rows={3}
                    placeholder="Add any notes about this payment..."
                    value={processForm.notes}
                    onChange={(e) => setProcessForm({...processForm, notes: e.target.value})}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={() => handleComplete(selectedWithdrawal.id)}
                    className="btn-primary flex-1"
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {processing ? 'Processing...' : 'Mark as Completed'}
                  </button>
                  <button
                    onClick={() => setShowProcessModal(false)}
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

      {/* Bulk Actions Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[400px] shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bulk Actions</h3>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Selected {selectedIds.length} withdrawal{selectedIds.length > 1 ? 's' : ''}
                </p>

                <div className="space-y-2">
                  <button
                    onClick={handleBulkApprove}
                    className="w-full btn-primary"
                    disabled={processing}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve All Selected
                  </button>
                  <button
                    onClick={handleBulkComplete}
                    className="w-full btn-secondary"
                    disabled={processing}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Mark All as Completed
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedIds([])
                    setShowBulkModal(false)
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
