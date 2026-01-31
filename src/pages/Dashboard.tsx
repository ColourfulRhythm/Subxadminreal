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
  Download,
  Clock,
  Zap
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts'
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

  // Enhanced chart data
  const revenueData = [
    { month: 'Jan', revenue: displayStats.platformRevenue * 0.6, users: Math.floor(displayStats.totalUsers * 0.5) },
    { month: 'Feb', revenue: displayStats.platformRevenue * 0.7, users: Math.floor(displayStats.totalUsers * 0.6) },
    { month: 'Mar', revenue: displayStats.platformRevenue * 0.75, users: Math.floor(displayStats.totalUsers * 0.7) },
    { month: 'Apr', revenue: displayStats.platformRevenue * 0.85, users: Math.floor(displayStats.totalUsers * 0.8) },
    { month: 'May', revenue: displayStats.platformRevenue * 0.9, users: Math.floor(displayStats.totalUsers * 0.9) },
    { month: 'Current', revenue: displayStats.platformRevenue, users: displayStats.totalUsers }
  ]

  const plotStatusData = [
    { name: 'Available', value: Math.max(displayStats.totalPlots - Math.floor(displayStats.totalSqmSold / 100), 0), color: '#3b82f6' },
    { name: 'Sold', value: Math.floor(displayStats.totalSqmSold / 100), color: '#10b981' },
    { name: 'Reserved', value: Math.floor(displayStats.totalPlots * 0.1), color: '#f59e0b' },
  ]

  const performanceData = [
    { name: 'Week 1', investments: 45, withdrawals: 12 },
    { name: 'Week 2', investments: 52, withdrawals: 18 },
    { name: 'Week 3', investments: 48, withdrawals: 15 },
    { name: 'Week 4', investments: 61, withdrawals: 22 },
  ]

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time platform statistics and system monitoring</p>
          {stats && (
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Connected to Firebase — Live data
            </p>
          )}
          {loading && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Loading data...
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 mt-2">
              ❌ Error: {error}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportDashboard}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue-50">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="stat-label">Total Users</p>
            <p className="stat-value">
              {loading ? '—' : formatNumber(displayStats.totalUsers)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-emerald-50">
            <Building2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="stat-label">Active Projects</p>
            <p className="stat-value">{displayStats.totalProjects}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-violet-50">
            <MapPin className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <p className="stat-label">Total Plots</p>
            <p className="stat-value">{displayStats.totalPlots}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-amber-50">
            <DollarSign className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="stat-label">Platform Revenue</p>
            <p className="stat-value text-xl">{formatCurrency(displayStats.platformRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="content-grid">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="chart-title mb-0">System Health</h3>
            <Zap className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Firebase</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-sm font-medium text-emerald-600 capitalize">{displayStats.systemHealth.firebaseStatus}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Data Integrity</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-gray-900 capitalize">{displayStats.systemHealth.dataIntegrity.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Last Sync</span>
              <span className="text-sm font-medium text-gray-900">
                {displayStats.systemHealth.lastSync.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="chart-title mb-0">Quick Stats</h3>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">SQM Sold</span>
              <span className="text-sm font-semibold text-gray-900">{formatNumber(displayStats.totalSqmSold)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">Pending Verifications</span>
              <span className="text-sm font-semibold text-amber-600">{displayStats.pendingVerifications}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Active Referrals</span>
              <span className="text-sm font-semibold text-blue-600">{displayStats.activeReferrals}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="chart-title">Plot Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={plotStatusData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
              >
                {plotStatusData.map((entry, index) => (
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
            {plotStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <h3 className="chart-title">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
                tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="chart-title">Weekly Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={performanceData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
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
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="investments" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Investments" />
              <Bar dataKey="withdrawals" fill="#10b981" radius={[4, 4, 0, 0]} name="Withdrawals" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Growth Chart */}
      <div className="card">
        <h3 className="chart-title">User Growth & Revenue Correlation</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              yAxisId="left" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip 
              formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(value as number) : formatNumber(value as number),
                name === 'revenue' ? 'Revenue' : 'Users'
              ]}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
              iconSize={8}
            />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
              name="Revenue"
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="users" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
              name="Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="chart-title mb-0">Recent Activity</h3>
          <Clock className="h-4 w-4 text-gray-400" />
        </div>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No recent activity to display</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
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
        )}
      </div>
    </div>
  )
}
