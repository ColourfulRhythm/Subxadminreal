import { useState } from 'react'
import { 
  TrendingUp, 
  Search, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react'
import { InvestmentRequest } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useInvestmentRequests, firebaseUtils } from '../hooks/useFirebase'

export default function InvestmentRequests() {
  const { data: firebaseRequests, loading, error } = useInvestmentRequests()
  const [requests, setRequests] = useState<InvestmentRequest[]>([
    {
      id: '1',
      userId: 'user1',
      userEmail: 'john.doe@email.com',
      userName: 'John Doe',
      plotId: 'plot1',
      plotName: 'Plot A-12',
      sqm: 100,
      pricePerSqm: 250,
      totalAmount: 25000,
      status: 'pending',
      createdAt: new Date('2024-01-20T10:30:00'),
      referralCode: 'REF123',
      referralCommission: 2500,
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'pending'
    },
    {
      id: '2',
      userId: 'user2',
      userEmail: 'jane.smith@email.com',
      userName: 'Jane Smith',
      plotId: 'plot2',
      plotName: 'Plot B-15',
      sqm: 150,
      pricePerSqm: 250,
      totalAmount: 37500,
      status: 'approved',
      createdAt: new Date('2024-01-19T14:20:00'),
      processedAt: new Date('2024-01-19T16:45:00'),
      referralCode: 'REF456',
      referralCommission: 3750,
      paymentMethod: 'Credit Card',
      paymentStatus: 'verified'
    },
    {
      id: '3',
      userId: 'user3',
      userEmail: 'mike.johnson@email.com',
      userName: 'Mike Johnson',
      plotId: 'plot3',
      plotName: 'Plot C-08',
      sqm: 80,
      pricePerSqm: 400,
      totalAmount: 32000,
      status: 'rejected',
      createdAt: new Date('2024-01-18T09:15:00'),
      processedAt: new Date('2024-01-18T11:30:00'),
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'failed'
    },
    {
      id: '4',
      userId: 'user4',
      userEmail: 'sarah.wilson@email.com',
      userName: 'Sarah Wilson',
      plotId: 'plot4',
      plotName: 'Plot D-03',
      sqm: 120,
      pricePerSqm: 400,
      totalAmount: 48000,
      status: 'completed',
      createdAt: new Date('2024-01-17T13:45:00'),
      processedAt: new Date('2024-01-17T15:20:00'),
      referralCode: 'REF789',
      referralCommission: 4800,
      paymentMethod: 'Credit Card',
      paymentStatus: 'verified'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all')
  const [filterPayment, setFilterPayment] = useState<'all' | 'pending' | 'verified' | 'failed'>('all')
  const [selectedRequest, setSelectedRequest] = useState<InvestmentRequest | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'disconnected' | 'error'>('connected')

  // Use real Firebase data if available, otherwise fallback to mock data
  const displayRequests = firebaseRequests.length > 0 ? firebaseRequests : requests
  
  const filteredRequests = displayRequests.filter(request => {
    const matchesSearch = request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.plotName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus
    const matchesPayment = filterPayment === 'all' || request.paymentStatus === filterPayment
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const statusDistribution = [
    { name: 'Pending', value: requests.filter(r => r.status === 'pending').length, color: '#f59e0b' },
    { name: 'Approved', value: requests.filter(r => r.status === 'approved').length, color: '#22c55e' },
    { name: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: '#ef4444' },
    { name: 'Completed', value: requests.filter(r => r.status === 'completed').length, color: '#3b82f6' },
  ]

  const paymentStatusDistribution = [
    { name: 'Pending', value: requests.filter(r => r.paymentStatus === 'pending').length, color: '#f59e0b' },
    { name: 'Verified', value: requests.filter(r => r.paymentStatus === 'verified').length, color: '#22c55e' },
    { name: 'Failed', value: requests.filter(r => r.paymentStatus === 'failed').length, color: '#ef4444' },
  ]

  const dailyRequests = [
    { date: '2024-01-17', requests: 3, amount: 125000 },
    { date: '2024-01-18', requests: 2, amount: 80000 },
    { date: '2024-01-19', requests: 4, amount: 180000 },
    { date: '2024-01-20', requests: 1, amount: 25000 },
  ]

  const handleRequestAction = async (requestId: string, action: string) => {
    console.log(`Performing ${action} on request ${requestId}`)
    
    // Simulate API call
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : req.status,
            processedAt: new Date()
          }
        : req
    ))
  }

  const handleMoveToInvestments = async (requestId: string) => {
    console.log(`Moving request ${requestId} to investments collection`)
    // This would move the approved request to the investments collection
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'completed' }
        : req
    ))
  }

  const testFirebaseConnection = async () => {
    setFirebaseStatus('connected')
    try {
      const result = await firebaseUtils.testConnection()
      setFirebaseStatus(result.connected ? 'connected' : 'error')
    } catch (error) {
      setFirebaseStatus('error')
    }
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
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
          <h1 className="text-2xl font-bold text-gray-900">Investment Requests</h1>
          <p className="text-gray-600">Manage investment requests and process approvals</p>
          {firebaseRequests.length > 0 && (
            <p className="text-sm text-green-600 mt-1">
              🔗 Connected to Firebase - {firebaseRequests.length} real requests loaded
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-1">
              ❌ Firebase Error: {error}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={testFirebaseConnection}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
              firebaseStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : firebaseStatus === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {firebaseStatus === 'connected' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>Firebase: {firebaseStatus}</span>
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
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? 'Loading...' : displayRequests.length}
              </p>
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
                {requests.filter(r => r.status === 'pending').length}
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
                {formatCurrency(requests.reduce((sum, r) => sum + r.totalAmount, 0))}
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
              <p className="text-sm font-medium text-gray-600">Referral Commission</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(requests.reduce((sum, r) => sum + (r.referralCommission || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Status</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={paymentStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Requests</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyRequests}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Requests']} />
              <Bar dataKey="requests" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Debug Tools */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Debug Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={testFirebaseConnection}
            className="btn-secondary flex items-center justify-center space-x-2"
          >
            <Wifi className="h-4 w-4" />
            <span>Test Firebase Connection</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Validate Request Data</span>
          </button>
          <button className="btn-secondary flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Manual Refresh</span>
          </button>
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
                placeholder="Search requests by user, email, or plot..."
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
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as any)}
            >
              <option value="all">All Payment</option>
              <option value="pending">Payment Pending</option>
              <option value="verified">Payment Verified</option>
              <option value="failed">Payment Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referral
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
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.userName}</div>
                      <div className="text-sm text-gray-500">{request.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{request.plotName}</div>
                      <div className="text-sm text-gray-500">{request.sqm} SQM</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(request.totalAmount)}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(request.pricePerSqm)}/SQM</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(request.paymentStatus)}`}>
                        {request.paymentStatus}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{request.paymentMethod}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {request.referralCode ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{request.referralCode}</div>
                          <div className="text-sm text-gray-500">{formatCurrency(request.referralCommission || 0)}</div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No referral</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setShowRequestModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleRequestAction(request.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRequestAction(request.id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <button
                          onClick={() => handleMoveToInvestments(request.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <ArrowRight className="h-4 w-4" />
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

      {/* Request Detail Modal */}
      {showRequestModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Investment Request Details</h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Request Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Request Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User</label>
                      <p className="text-sm text-gray-900">{selectedRequest.userName}</p>
                      <p className="text-sm text-gray-500">{selectedRequest.userEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Plot</label>
                      <p className="text-sm text-gray-900">{selectedRequest.plotName}</p>
                      <p className="text-sm text-gray-500">{selectedRequest.sqm} SQM</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedRequest.totalAmount)}</p>
                      <p className="text-sm text-gray-500">{formatCurrency(selectedRequest.pricePerSqm)}/SQM</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusIcon(selectedRequest.status)}
                        <span className="ml-1 capitalize">{selectedRequest.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Payment Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <p className="text-sm text-gray-900">{selectedRequest.paymentMethod}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedRequest.paymentStatus)}`}>
                        {selectedRequest.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral and Timeline */}
              <div className="space-y-6">
                {selectedRequest.referralCode && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Referral Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Referral Code</label>
                        <p className="text-sm text-gray-900">{selectedRequest.referralCode}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Commission</label>
                        <p className="text-sm text-gray-900">{formatCurrency(selectedRequest.referralCommission || 0)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Timeline</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Created</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                    {selectedRequest.processedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Processed</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRequest.processedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Actions</h4>
                  <div className="space-y-3">
                    {selectedRequest.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            handleRequestAction(selectedRequest.id, 'approve')
                            setShowRequestModal(false)
                          }}
                          className="w-full btn-success"
                        >
                          Approve Request
                        </button>
                        <button
                          onClick={() => {
                            handleRequestAction(selectedRequest.id, 'reject')
                            setShowRequestModal(false)
                          }}
                          className="w-full btn-danger"
                        >
                          Reject Request
                        </button>
                      </>
                    )}
                    {selectedRequest.status === 'approved' && (
                      <button
                        onClick={() => {
                          handleMoveToInvestments(selectedRequest.id)
                          setShowRequestModal(false)
                        }}
                        className="w-full btn-primary"
                      >
                        Move to Investments
                      </button>
                    )}
                    <button className="w-full btn-secondary">
                      View Payment Details
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
