import { useState } from 'react'
import { 
  Users, 
  Building2, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  Activity,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { DashboardStats, RecentActivity } from '../types'
import { useDashboardStats } from '../hooks/useFirebase'

export default function Dashboard() {
  const { stats, loading, error } = useDashboardStats()
  const [localStats] = useState<DashboardStats>({
    totalUsers: 1247,
    totalProjects: 15,
    totalPlots: 234,
    totalSqmSold: 45670,
    platformRevenue: 2850000,
    pendingVerifications: 23,
    activeReferrals: 89,
    systemHealth: {
      firebaseStatus: 'connected',
      dataIntegrity: 'healthy',
      lastSync: new Date()
    }
  })

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'user_registration',
      description: 'New user registered: john.doe@email.com',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      userId: 'user123'
    },
    {
      id: '2',
      type: 'investment',
      description: 'Investment completed: $25,000 in Plot A-12',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      userId: 'user456',
      amount: 25000
    },
    {
      id: '3',
      type: 'withdrawal',
      description: 'Withdrawal request: $5,000 referral commission',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      userId: 'user789',
      amount: 5000
    },
    {
      id: '4',
      type: 'system_notification',
      description: 'System maintenance completed successfully',
      timestamp: new Date(Date.now() - 45 * 60 * 1000)
    }
  ])

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 240000, users: 850 },
    { month: 'Feb', revenue: 280000, users: 920 },
    { month: 'Mar', revenue: 320000, users: 1050 },
    { month: 'Apr', revenue: 380000, users: 1180 },
    { month: 'May', revenue: 420000, users: 1247 },
  ]

  const plotStatusData = [
    { name: 'Available', value: 45, color: '#22c55e' },
    { name: 'Popular', value: 30, color: '#3b82f6' },
    { name: 'Low Stock', value: 15, color: '#f59e0b' },
    { name: 'Sold Out', value: 10, color: '#ef4444' },
  ]

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // The stats will be refreshed automatically by the useDashboardStats hook
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  // Use real Firebase data if available, otherwise fallback to local stats
  const displayStats = stats || localStats

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'investment':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'withdrawal':
        return <DollarSign className="h-4 w-4 text-orange-500" />
      case 'system_notification':
        return <Activity className="h-4 w-4 text-purple-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Real-time platform statistics and system monitoring</p>
          {stats && (
            <p className="text-sm text-green-600 mt-1">
              🔗 Connected to Firebase - Live data from subx-825e9
            </p>
          )}
          {loading && (
            <p className="text-sm text-yellow-600 mt-1">
              ⏳ Loading data from Firebase...
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-1">
              ❌ Firebase Error: {error}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? 'Loading...' : formatNumber(displayStats.totalUsers)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{displayStats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Plots</p>
              <p className="text-2xl font-bold text-gray-900">{displayStats.totalPlots}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(displayStats.platformRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Health & Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Firebase Connection</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 capitalize">{displayStats.systemHealth.firebaseStatus}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Integrity</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 capitalize">{displayStats.systemHealth.dataIntegrity.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Sync</span>
              <span className="text-sm text-gray-900">
                {displayStats.systemHealth.lastSync.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SQM Sold</span>
              <span className="text-sm font-medium text-gray-900">{formatNumber(displayStats.totalSqmSold)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Verifications</span>
              <span className="text-sm font-medium text-yellow-600">{displayStats.pendingVerifications}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Referrals</span>
              <span className="text-sm font-medium text-blue-600">{displayStats.activeReferrals}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plot Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={plotStatusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {plotStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value as number) : value,
                  name === 'revenue' ? 'Revenue' : 'Users'
                ]}
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="revenue"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="users" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              {getActivityIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">
                  {activity.timestamp.toLocaleString()}
                </p>
              </div>
              {activity.amount && (
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(activity.amount)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
