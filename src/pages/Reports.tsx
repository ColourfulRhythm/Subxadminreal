import { useState, useMemo } from 'react'
import { 
  Download, 
  TrendingUp,
  Users,
  DollarSign,
  Building2
} from 'lucide-react'
import { useUsers, useInvestments, useProjects, useWithdrawalRequests, useReferrals } from '../hooks/useFirebase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts'
import toast from 'react-hot-toast'

export default function Reports() {
  const { data: users } = useUsers()
  const { data: investments } = useInvestments()
  const { data: projects } = useProjects()
  const { data: withdrawals } = useWithdrawalRequests()
  const { data: referrals } = useReferrals()

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [reportType, setReportType] = useState<'overview' | 'investments' | 'users' | 'withdrawals' | 'referrals'>('overview')

  // Safe arrays
  const safeUsers = Array.isArray(users) ? users : []
  const safeInvestments = Array.isArray(investments) ? investments : []
  const safeProjects = Array.isArray(projects) ? projects : []
  const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : []
  const safeReferrals = Array.isArray(referrals) ? referrals : []

  // Helper to parse dates
  const toDate = (date: any): Date | null => {
    if (!date) return null
    if (date instanceof Date) return date
    if (date.toDate && typeof date.toDate === 'function') {
      try { return date.toDate() } catch { return null }
    }
    const parsed = new Date(date)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  // Filter data by date range
  const filterByDate = (items: any[], dateField: string) => {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    end.setHours(23, 59, 59, 999)
    
    return items.filter(item => {
      const itemDate = toDate(item[dateField] || item.createdAt || item.created_at)
      if (!itemDate) return false
      return itemDate >= start && itemDate <= end
    })
  }

  // Filtered data
  const filteredInvestments = useMemo(() => filterByDate(safeInvestments, 'created_at'), [safeInvestments, dateRange])
  const filteredUsers = useMemo(() => filterByDate(safeUsers, 'created_at'), [safeUsers, dateRange])
  const filteredWithdrawals = useMemo(() => filterByDate(safeWithdrawals, 'createdAt'), [safeWithdrawals, dateRange])
  const filteredReferrals = useMemo(() => filterByDate(safeReferrals, 'createdAt'), [safeReferrals, dateRange])

  // Calculate metrics
  const totalInvestmentAmount = filteredInvestments.reduce((sum, inv) => 
    sum + ((inv as any).amount_paid || (inv as any).Amount_paid || 0), 0)
  const totalWithdrawalAmount = filteredWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)
  const totalReferralCommission = filteredReferrals.reduce((sum, r) => 
    sum + ((r as any).commission_amount || r.commission || 0), 0)

  // Generate daily data for charts
  const generateDailyData = () => {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const days: any[] = []
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayInvestments = filteredInvestments.filter(inv => {
        const invDate = toDate(inv.created_at || inv.createdAt)
        return invDate && invDate.toISOString().split('T')[0] === dateStr
      })
      const dayUsers = filteredUsers.filter(u => {
        const uDate = toDate(u.created_at)
        return uDate && uDate.toISOString().split('T')[0] === dateStr
      })
      const dayWithdrawals = filteredWithdrawals.filter(w => {
        const wDate = toDate(w.createdAt)
        return wDate && wDate.toISOString().split('T')[0] === dateStr
      })

      days.push({
        date: dateStr,
        investments: dayInvestments.reduce((sum, inv) => sum + ((inv as any).amount_paid || (inv as any).Amount_paid || 0), 0),
        investmentCount: dayInvestments.length,
        newUsers: dayUsers.length,
        withdrawals: dayWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)
      })
    }
    return days
  }

  const dailyData = useMemo(() => generateDailyData(), [filteredInvestments, filteredUsers, filteredWithdrawals, dateRange])

  // Investment by project
  const investmentByProject = useMemo(() => {
    const projectMap = new Map()
    filteredInvestments.forEach(inv => {
      const projectId = (inv as any).project_id || (inv as any).projectId || 'Unknown'
      const project = safeProjects.find(p => p.id === projectId)
      const projectName = project?.name || 'Unknown Project'
      const amount = (inv as any).amount_paid || (inv as any).Amount_paid || 0
      projectMap.set(projectName, (projectMap.get(projectName) || 0) + amount)
    })
    return Array.from(projectMap.entries()).map(([name, value]) => ({ name, value }))
  }, [filteredInvestments, safeProjects])

  // User registration trend
  const userRegistrationTrend = useMemo(() => {
    const monthMap = new Map()
    safeUsers.forEach(user => {
      const date = toDate(user.created_at)
      if (date) {
        const month = date.toISOString().slice(0, 7)
        monthMap.set(month, (monthMap.get(month) || 0) + 1)
      }
    })
    return Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, users: count }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
  }, [safeUsers])

  // Export functions
  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h.toLowerCase().replace(/ /g, '_')] || '').join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${dateRange.start}-to-${dateRange.end}.csv`
    a.click()
    toast.success(`${filename} exported`)
  }

  const exportInvestmentsReport = () => {
    const data = filteredInvestments.map(inv => ({
      date: toDate(inv.created_at || inv.createdAt)?.toISOString().split('T')[0] || '',
      user_id: inv.userId || (inv as any).user_id || '',
      project: (inv as any).project_title || '',
      amount: (inv as any).amount_paid || (inv as any).Amount_paid || 0,
      sqm: (inv as any).sqm_purchased || inv.sqm || 0,
      status: inv.status || ''
    }))
    exportToCSV(data, 'investments-report', ['Date', 'User_ID', 'Project', 'Amount', 'SQM', 'Status'])
  }

  const exportUsersReport = () => {
    const data = filteredUsers.map(user => ({
      date: toDate(user.created_at)?.toISOString().split('T')[0] || '',
      name: user.full_name || '',
      email: user.email || '',
      status: user.status || '',
      referral_code: user.referral_code || ''
    }))
    exportToCSV(data, 'users-report', ['Date', 'Name', 'Email', 'Status', 'Referral_Code'])
  }

  const exportWithdrawalsReport = () => {
    const data = filteredWithdrawals.map(w => ({
      date: toDate(w.createdAt)?.toISOString().split('T')[0] || '',
      user: w.userName || '',
      amount: w.amount || 0,
      type: w.type || '',
      status: w.status || ''
    }))
    exportToCSV(data, 'withdrawals-report', ['Date', 'User', 'Amount', 'Type', 'Status'])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate and export detailed reports</p>
        </div>
      </div>

      {/* Date Range & Report Type Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              className="input-field"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
            >
              <option value="overview">📊 Overview</option>
              <option value="investments">💰 Investments</option>
              <option value="users">👥 Users</option>
              <option value="withdrawals">💸 Withdrawals</option>
              <option value="referrals">🔗 Referrals</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="input-field"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="input-field"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const today = new Date()
                setDateRange({
                  start: new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
                })
              }}
              className="btn-secondary text-sm"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                const today = new Date()
                setDateRange({
                  start: new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0],
                  end: new Date().toISOString().split('T')[0]
                })
              }}
              className="btn-secondary text-sm"
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Investments</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalInvestmentAmount)}</p>
              <p className="text-xs text-blue-600">{filteredInvestments.length} transactions</p>
            </div>
            <TrendingUp className="h-10 w-10 text-blue-400" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">New Users</p>
              <p className="text-2xl font-bold text-green-900">{filteredUsers.length}</p>
              <p className="text-xs text-green-600">in selected period</p>
            </div>
            <Users className="h-10 w-10 text-green-400" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Withdrawals</p>
              <p className="text-2xl font-bold text-amber-900">{formatCurrency(totalWithdrawalAmount)}</p>
              <p className="text-xs text-amber-600">{filteredWithdrawals.length} requests</p>
            </div>
            <DollarSign className="h-10 w-10 text-amber-400" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Referral Commission</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalReferralCommission)}</p>
              <p className="text-xs text-purple-600">{filteredReferrals.length} referrals</p>
            </div>
            <Building2 className="h-10 w-10 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Charts based on report type */}
      {reportType === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Daily Investment Trend</h3>
              <button onClick={exportInvestmentsReport} className="btn-secondary text-sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${(v/1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="investments" stroke="#3b82f6" fill="#93c5fd" name="Investments" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Investment by Project</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={investmentByProject}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {investmentByProject.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New Users vs Withdrawals</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="newUsers" stroke="#22c55e" name="New Users" />
                <Line yAxisId="right" type="monotone" dataKey="withdrawals" stroke="#ef4444" name="Withdrawals" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Registration Trend</h3>
              <button onClick={exportUsersReport} className="btn-secondary text-sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userRegistrationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="users" fill="#8b5cf6" name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {reportType === 'investments' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Investment Report</h3>
              <button onClick={exportInvestmentsReport} className="btn-primary">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SQM</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvestments.slice(0, 20).map((inv: any, idx) => (
                    <tr key={inv.id || idx}>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {toDate(inv.created_at || inv.createdAt)?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{inv.project_title || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(inv.amount_paid || inv.Amount_paid || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{inv.sqm_purchased || inv.sqm || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          inv.status === 'approved' ? 'bg-green-100 text-green-800' :
                          inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredInvestments.length > 20 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing 20 of {filteredInvestments.length} investments. Export to see all.
              </p>
            )}
          </div>
        </div>
      )}

      {reportType === 'users' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Registration Report</h3>
              <button onClick={exportUsersReport} className="btn-primary">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userRegistrationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#22c55e" name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.slice(0, 20).map((user: any, idx) => (
                    <tr key={user.id || idx}>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {toDate(user.created_at)?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{user.full_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'withdrawals' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Withdrawal Report</h3>
              <button onClick={exportWithdrawalsReport} className="btn-primary">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredWithdrawals.slice(0, 20).map((w: any, idx) => (
                    <tr key={w.id || idx}>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {toDate(w.createdAt)?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{w.userName || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(w.amount || 0)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{w.type || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          w.status === 'completed' ? 'bg-green-100 text-green-800' :
                          w.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {w.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'referrals' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Referral Report</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Total Referrals</p>
                <p className="text-2xl font-bold text-blue-900">{filteredReferrals.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Paid Commissions</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(filteredReferrals.filter((r: any) => r.status === 'paid').reduce((sum, r) => sum + ((r as any).commission_amount || r.commission || 0), 0))}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-amber-600">Pending Commissions</p>
                <p className="text-2xl font-bold text-amber-900">
                  {formatCurrency(filteredReferrals.filter((r: any) => r.status === 'pending').reduce((sum, r) => sum + ((r as any).commission_amount || r.commission || 0), 0))}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referred User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReferrals.slice(0, 20).map((r: any, idx) => (
                    <tr key={r.id || idx}>
                      <td className="px-4 py-3 text-sm text-gray-900">{r.referred_by || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.full_name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatCurrency(r.commission_amount || r.commission || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          r.status === 'paid' ? 'bg-green-100 text-green-800' :
                          r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {r.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

