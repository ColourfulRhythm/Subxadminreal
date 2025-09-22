import { useState } from 'react'
import { 
  Users2, 
  Search, 
  Filter, 
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Eye,
  Award,
  Target,
  BarChart3,
  Download,
  Plus,
  Edit
} from 'lucide-react'
import { ReferralData } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

export default function ReferralAnalytics() {
  const [referrals, setReferrals] = useState<ReferralData[]>([
    {
      id: '1',
      referrerId: 'user1',
      referrerEmail: 'john.doe@email.com',
      referredUserId: 'user5',
      referredUserEmail: 'alice.brown@email.com',
      commission: 2500,
      status: 'paid',
      createdAt: new Date('2024-01-15'),
      paidAt: new Date('2024-01-16')
    },
    {
      id: '2',
      referrerId: 'user2',
      referrerEmail: 'jane.smith@email.com',
      referredUserId: 'user6',
      referredUserEmail: 'bob.wilson@email.com',
      commission: 3750,
      status: 'pending',
      createdAt: new Date('2024-01-18')
    },
    {
      id: '3',
      referrerId: 'user3',
      referrerEmail: 'mike.johnson@email.com',
      referredUserId: 'user7',
      referredUserEmail: 'carol.davis@email.com',
      commission: 1800,
      status: 'cancelled',
      createdAt: new Date('2024-01-12'),
      paidAt: new Date('2024-01-13')
    },
    {
      id: '4',
      referrerId: 'user1',
      referrerEmail: 'john.doe@email.com',
      referredUserId: 'user8',
      referredUserEmail: 'david.miller@email.com',
      commission: 3200,
      status: 'paid',
      createdAt: new Date('2024-01-20'),
      paidAt: new Date('2024-01-21')
    }
  ])

  const [topReferrers] = useState([
    { id: 'user1', name: 'John Doe', email: 'john.doe@email.com', totalReferrals: 15, totalCommission: 45000, conversionRate: 85 },
    { id: 'user2', name: 'Jane Smith', email: 'jane.smith@email.com', totalReferrals: 12, totalCommission: 32000, conversionRate: 78 },
    { id: 'user3', name: 'Mike Johnson', email: 'mike.johnson@email.com', totalReferrals: 8, totalCommission: 18000, conversionRate: 72 },
    { id: 'user4', name: 'Sarah Wilson', email: 'sarah.wilson@email.com', totalReferrals: 6, totalCommission: 15000, conversionRate: 68 },
    { id: 'user5', name: 'David Brown', email: 'david.brown@email.com', totalReferrals: 5, totalCommission: 12000, conversionRate: 65 }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all')
  const [selectedReferrer, setSelectedReferrer] = useState<any>(null)
  const [showReferrerModal, setShowReferrerModal] = useState(false)

  const filteredReferrals = referrals.filter(referral => {
    const matchesSearch = referral.referrerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         referral.referredUserEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || referral.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const statusDistribution = [
    { name: 'Paid', value: referrals.filter(r => r.status === 'paid').length, color: '#22c55e' },
    { name: 'Pending', value: referrals.filter(r => r.status === 'pending').length, color: '#f59e0b' },
    { name: 'Cancelled', value: referrals.filter(r => r.status === 'cancelled').length, color: '#ef4444' },
  ]

  const monthlyReferrals = [
    { month: 'Oct 2023', referrals: 12, commission: 25000 },
    { month: 'Nov 2023', referrals: 18, commission: 38000 },
    { month: 'Dec 2023', referrals: 25, commission: 52000 },
    { month: 'Jan 2024', referrals: 22, commission: 45000 },
  ]

  const conversionTrends = [
    { month: 'Oct 2023', rate: 72 },
    { month: 'Nov 2023', rate: 78 },
    { month: 'Dec 2023', rate: 82 },
    { month: 'Jan 2024', rate: 85 },
  ]

  const handleReferralAction = async (referralId: string, action: string) => {
    console.log(`Performing ${action} on referral ${referralId}`)
    
    setReferrals(prev => prev.map(r => 
      r.id === referralId 
        ? { 
            ...r, 
            status: action === 'pay' ? 'paid' : action === 'cancel' ? 'cancelled' : r.status,
            paidAt: action === 'pay' ? new Date() : r.paidAt
          }
        : r
    ))
  }

  const handleExportReferrals = () => {
    console.log('Exporting referrals to CSV')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Analytics</h1>
          <p className="text-gray-600">Track referral performance and manage referral commissions</p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Referral Code</span>
          </button>
          <button onClick={handleExportReferrals} className="btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
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
              <p className="text-sm font-medium text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{referrals.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Commission</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(referrals.reduce((sum, r) => sum + r.commission, 0))}
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
              <p className="text-sm font-medium text-gray-600">Active Referrers</p>
              <p className="text-2xl font-bold text-gray-900">{topReferrers.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(topReferrers.reduce((sum, r) => sum + r.conversionRate, 0) / topReferrers.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Referral Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyReferrals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'commission' ? formatCurrency(value as number) : value,
                  name === 'commission' ? 'Commission' : 'Referrals'
                ]}
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="referrals" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="referrals"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="commission" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="commission"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Referrers */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Referrers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referrer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Referrals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topReferrers.map((referrer, index) => (
                <tr key={referrer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index < 3 && (
                        <Award className={`h-5 w-5 mr-2 ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 
                          'text-amber-600'
                        }`} />
                      )}
                      <span className="text-sm font-medium text-gray-900">#{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{referrer.name}</div>
                      <div className="text-sm text-gray-500">{referrer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {referrer.totalReferrals}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(referrer.totalCommission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${referrer.conversionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{referrer.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedReferrer(referrer)
                        setShowReferrerModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                placeholder="Search referrals by referrer or referred user email..."
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
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral History</h3>
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{referral.referrerEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{referral.referredUserEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(referral.commission)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                      {referral.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(referral.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {referral.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReferralAction(referral.id, 'pay')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Pay
                          </button>
                          <button
                            onClick={() => handleReferralAction(referral.id, 'cancel')}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
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
      </div>

      {/* Referrer Detail Modal */}
      {showReferrerModal && selectedReferrer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Referrer Details</h3>
              <button
                onClick={() => setShowReferrerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Referrer Information */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Referrer Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedReferrer.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedReferrer.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Referrals</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedReferrer.totalReferrals}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Commission</label>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedReferrer.totalCommission)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Conversion Rate</label>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${selectedReferrer.conversionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{selectedReferrer.conversionRate}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Average Commission</label>
                      <p className="text-sm text-gray-900">
                        {formatCurrency(selectedReferrer.totalCommission / selectedReferrer.totalReferrals)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions and Analytics */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Referral Management</h4>
                  <div className="space-y-3">
                    <button className="w-full btn-primary">
                      View Referral History
                    </button>
                    <button className="w-full btn-secondary">
                      Generate Referral Code
                    </button>
                    <button className="w-full btn-secondary">
                      View Commission History
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h4>
                  <div className="space-y-3">
                    <button className="w-full btn-success">
                      Process Pending Commissions
                    </button>
                    <button className="w-full btn-secondary">
                      Export Referral Data
                    </button>
                    <button className="w-full btn-warning">
                      Adjust Commission Rate
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
