import { useState } from 'react'
import { 
  Users, 
  Building2, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  CheckCircle,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { RecentActivity } from '../types'
import { useDashboardStats, useUsers, usePlots } from '../hooks/useFirebase'
import { exportDashboardStatsToCSV } from '../utils/csvExport'

export default function Dashboard() {
  const { stats, loading, error } = useDashboardStats()
  const { data: users } = useUsers()
  const { data: plots } = usePlots()

  // Use real Firebase data if available, otherwise fallback to zero values
  const displayStats = stats || {
    totalUsers: 0,
    totalProjects: 0,
    totalPlots: 0,
    totalSqmSold: 0,
    platformRevenue: 0,
    pendingVerifications: 0,
    activeReferrals: 0,
    systemHealth: {
      firebaseStatus: 'disconnected',
      dataIntegrity: 'unknown',
      lastSync: new Date()
    }
  }

  // Use empty array for recent activity - will be populated from real data later
  const recentActivity: RecentActivity[] = []

  // Real data for charts - using actual Firebase data
  const revenueData = [
    { month: 'Current', revenue: displayStats.platformRevenue, users: displayStats.totalUsers }
  ]

  const plotStatusData = [
    { name: 'Total Plots', value: displayStats.totalPlots, color: '#3b82f6' },
    { name: 'SQM Sold', value: displayStats.totalSqmSold, color: '#10b981' },
  ]

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // The stats will be refreshed automatically by the useDashboardStats hook
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleExportDashboard = () => {
    const safeUsers = Array.isArray(users) ? users : []
    const safePlots = Array.isArray(plots) ? plots : []
    exportDashboardStatsToCSV(displayStats, safeUsers, safePlots)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
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
        <div className="flex space-x-2">
          <button
            onClick={handleExportDashboard}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
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
