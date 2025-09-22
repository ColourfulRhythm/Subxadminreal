import { useState } from 'react'
import { 
  DollarSign, 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  CreditCard,
  Building2,
  Users,
  Download
} from 'lucide-react'
import { WithdrawalRequest } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function WithdrawalManagement() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([
    {
      id: '1',
      userId: 'user1',
      userEmail: 'john.doe@email.com',
      userName: 'John Doe',
      amount: 2500,
      type: 'referral',
      status: 'pending',
      bankDetails: {
        accountNumber: '****1234',
        bankName: 'First Bank',
        accountName: 'John Doe'
      },
      createdAt: new Date('2024-01-20T10:30:00')
    },
    {
      id: '2',
      userId: 'user2',
      userEmail: 'jane.smith@email.com',
      userName: 'Jane Smith',
      amount: 15000,
      type: 'investment_return',
      status: 'approved',
      bankDetails: {
        accountNumber: '****5678',
        bankName: 'GTBank',
        accountName: 'Jane Smith'
      },
      createdAt: new Date('2024-01-19T14:20:00'),
      processedAt: new Date('2024-01-19T16:45:00'),
      processedBy: 'admin1'
    },
    {
      id: '3',
      userId: 'user3',
      userEmail: 'mike.johnson@email.com',
      userName: 'Mike Johnson',
      amount: 5000,
      type: 'referral',
      status: 'rejected',
      bankDetails: {
        accountNumber: '****9012',
        bankName: 'Access Bank',
        accountName: 'Mike Johnson'
      },
      createdAt: new Date('2024-01-18T09:15:00'),
      processedAt: new Date('2024-01-18T11:30:00'),
      processedBy: 'admin1'
    },
    {
      id: '4',
      userId: 'user4',
      userEmail: 'sarah.wilson@email.com',
      userName: 'Sarah Wilson',
      amount: 8000,
      type: 'investment_return',
      status: 'completed',
      bankDetails: {
        accountNumber: '****3456',
        bankName: 'Zenith Bank',
        accountName: 'Sarah Wilson'
      },
      createdAt: new Date('2024-01-17T13:45:00'),
      processedAt: new Date('2024-01-17T15:20:00'),
      processedBy: 'admin2'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all')
  const [filterType, setFilterType] = useState<'all' | 'referral' | 'investment_return' | 'other'>('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [minWithdrawalLimit, setMinWithdrawalLimit] = useState(100)

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || withdrawal.status === filterStatus
    const matchesType = filterType === 'all' || withdrawal.type === filterType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const statusDistribution = [
    { name: 'Pending', value: withdrawals.filter(w => w.status === 'pending').length, color: '#f59e0b' },
    { name: 'Approved', value: withdrawals.filter(w => w.status === 'approved').length, color: '#22c55e' },
    { name: 'Rejected', value: withdrawals.filter(w => w.status === 'rejected').length, color: '#ef4444' },
    { name: 'Completed', value: withdrawals.filter(w => w.status === 'completed').length, color: '#3b82f6' },
  ]

  const typeDistribution = [
    { name: 'Referral', value: withdrawals.filter(w => w.type === 'referral').length, color: '#8b5cf6' },
    { name: 'Investment Return', value: withdrawals.filter(w => w.type === 'investment_return').length, color: '#06b6d4' },
    { name: 'Other', value: withdrawals.filter(w => w.type === 'other').length, color: '#6b7280' },
  ]

  const dailyWithdrawals = [
    { date: '2024-01-17', count: 2, amount: 13000 },
    { date: '2024-01-18', count: 1, amount: 5000 },
    { date: '2024-01-19', count: 3, amount: 28000 },
    { date: '2024-01-20', count: 1, amount: 2500 },
  ]

  const handleWithdrawalAction = async (withdrawalId: string, action: string) => {
    console.log(`Performing ${action} on withdrawal ${withdrawalId}`)
    
    setWithdrawals(prev => prev.map(w => 
      w.id === withdrawalId 
        ? { 
            ...w, 
            status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'complete' ? 'completed' : w.status,
            processedAt: new Date(),
            processedBy: 'current_admin'
          }
        : w
    ))
  }

  const handleExportWithdrawals = () => {
    console.log('Exporting withdrawals to CSV')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'referral':
        return 'bg-purple-100 text-purple-800'
      case 'investment_return':
        return 'bg-cyan-100 text-cyan-800'
      case 'other':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawal Management</h1>
          <p className="text-gray-600">Process withdrawal requests and manage referral payouts</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleExportWithdrawals} className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
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
              <p className="text-2xl font-bold text-gray-900">{withdrawals.length}</p>
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
                {withdrawals.filter(w => w.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(withdrawals.reduce((sum, w) => sum + w.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={typeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Withdrawals</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyWithdrawals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Count']} />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Financial Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Withdrawal Limit</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={minWithdrawalLimit}
                onChange={(e) => setMinWithdrawalLimit(Number(e.target.value))}
                className="input-field"
              />
              <span className="text-sm text-gray-500">USD</span>
            </div>
          </div>
          <div className="flex items-end">
            <button className="btn-secondary">
              Update Limits
            </button>
          </div>
          <div className="flex items-end">
            <button className="btn-secondary flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Bank Verification</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search withdrawals by user name or email..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
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
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{withdrawal.userName}</div>
                      <div className="text-sm text-gray-500">{withdrawal.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(withdrawal.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(withdrawal.type)}`}>
                      {withdrawal.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                      {getStatusIcon(withdrawal.status)}
                      <span className="ml-1 capitalize">{withdrawal.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{withdrawal.bankDetails.bankName}</div>
                      <div className="text-sm text-gray-500">{withdrawal.bankDetails.accountNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(withdrawal.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
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
                      {withdrawal.status === 'approved' && (
                        <button
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'complete')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Detail Modal */}
      {showWithdrawalModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Withdrawal Request Details</h3>
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Withdrawal Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Request Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User</label>
                      <p className="text-sm text-gray-900">{selectedWithdrawal.userName}</p>
                      <p className="text-sm text-gray-500">{selectedWithdrawal.userEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedWithdrawal.amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedWithdrawal.type)}`}>
                        {selectedWithdrawal.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedWithdrawal.status)}`}>
                        {getStatusIcon(selectedWithdrawal.status)}
                        <span className="ml-1 capitalize">{selectedWithdrawal.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Bank Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                      <p className="text-sm text-gray-900">{selectedWithdrawal.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Number</label>
                      <p className="text-sm text-gray-900">{selectedWithdrawal.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Name</label>
                      <p className="text-sm text-gray-900">{selectedWithdrawal.bankDetails.accountName}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline and Actions */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Timeline</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Requested</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedWithdrawal.createdAt)}</p>
                    </div>
                    {selectedWithdrawal.processedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Processed</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedWithdrawal.processedAt)}</p>
                      </div>
                    )}
                    {selectedWithdrawal.processedBy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Processed By</label>
                        <p className="text-sm text-gray-900">{selectedWithdrawal.processedBy}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Actions</h4>
                  <div className="space-y-3">
                    {selectedWithdrawal.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleWithdrawalAction(selectedWithdrawal.id, 'approve')
                            setShowWithdrawalModal(false)
                          }}
                          className="w-full btn-success"
                        >
                          Approve Withdrawal
                        </button>
                        <button
                          onClick={() => {
                            handleWithdrawalAction(selectedWithdrawal.id, 'reject')
                            setShowWithdrawalModal(false)
                          }}
                          className="w-full btn-danger"
                        >
                          Reject Withdrawal
                        </button>
                      </>
                    )}
                    {selectedWithdrawal.status === 'approved' && (
                      <button
                        onClick={() => {
                          handleWithdrawalAction(selectedWithdrawal.id, 'complete')
                          setShowWithdrawalModal(false)
                        }}
                        className="w-full btn-primary"
                      >
                        Process Payment
                      </button>
                    )}
                    <button className="w-full btn-secondary">
                      Verify Bank Account
                    </button>
                    <button className="w-full btn-secondary">
                      View Audit Trail
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
