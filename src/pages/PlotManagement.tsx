import { useState } from 'react'
import { 
  MapPin, 
  Search, 
  RefreshCw,
  Eye,
  Edit,
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Download
} from 'lucide-react'
import { Plot } from '../types'
import { usePlots } from '../hooks/useFirebase'
import { exportPlotsToCSV } from '../utils/csvExport'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function PlotManagement() {
  const { data: plots, loading, error } = usePlots()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'popular' | 'low_stock' | 'sold_out'>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [showPlotModal, setShowPlotModal] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)

  // Firestore data can be inconsistent (missing fields / different casing). Keep filtering crash-proof.
  const filteredPlots = plots.filter((plot: any) => {
    const plotName = String(plot?.name ?? '')
    const projectName = String(plot?.projectName ?? plot?.project_name ?? '')

    const matchesSearch =
      plotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projectName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || plot?.status === filterStatus
    const matchesProject = filterProject === 'all' || plot?.projectId === filterProject
    
    return matchesSearch && matchesStatus && matchesProject
  })

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'available':
        return { color: 'bg-green-100 text-green-800', label: 'Available' }
      case 'popular':
        return { color: 'bg-blue-100 text-blue-800', label: 'Popular' }
      case 'low_stock':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' }
      case 'sold_out':
        return { color: 'bg-red-100 text-red-800', label: 'Sold Out' }
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'Unknown' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4" />
      case 'popular':
        return <TrendingUp className="h-4 w-4" />
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4" />
      case 'sold_out':
        return <XCircle className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  const handleRecalculateMetrics = async () => {
    setIsRecalculating(true)
    // Implement recalculation logic
    setTimeout(() => setIsRecalculating(false), 2000)
  }

  const handleExportPlots = () => {
    exportPlotsToCSV(filteredPlots)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }


  // Chart data
  const statusChartData = [
    { name: 'Available', value: plots.filter(p => p.status === 'available').length, color: '#10B981' },
    { name: 'Popular', value: plots.filter(p => p.status === 'popular').length, color: '#3B82F6' },
    { name: 'Low Stock', value: plots.filter(p => p.status === 'low_stock').length, color: '#F59E0B' },
    { name: 'Sold Out', value: plots.filter(p => p.status === 'sold_out').length, color: '#EF4444' },
  ]

  const revenueChartData = plots.map(plot => ({
    name: (plot as any)?.name || 'Unnamed',
    revenue: Number((plot as any)?.totalRevenue ?? 0)
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading plots...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading plots</h3>
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
          <h1 className="text-2xl font-bold text-x-text">Plot Management</h1>
          <p className="text-white/60">Monitor plot availability, pricing, and ownership</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportPlots}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleRecalculateMetrics}
            disabled={isRecalculating}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Recalculating...' : 'Recalculate Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Plots</p>
              <p className="text-2xl font-bold text-gray-900">{plots.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {plots.filter(p => p.status === 'available').length}
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
              <p className="text-sm font-medium text-gray-600">Total Owners</p>
              <p className="text-2xl font-bold text-gray-900">
                {plots.reduce((sum, p) => sum + (p.totalOwners || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(plots.reduce((sum, p) => sum + (p.totalRevenue || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plot Status Distribution</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plot</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="revenue" fill="#3B82F6" />
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
                placeholder="Search plots by name or project..."
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
              <option value="available">Available</option>
              <option value="popular">Popular</option>
              <option value="low_stock">Low Stock</option>
              <option value="sold_out">Sold Out</option>
            </select>
            <select
              className="input-field"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {[...new Set(plots.map(p => p.projectId).filter(Boolean))].map(projectId => (
                <option key={projectId} value={projectId}>
                  {plots.find(p => p.projectId === projectId)?.projectName || projectId}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Plots Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SQM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price/SQM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owners
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-white/10">
              {filteredPlots.map((plot) => (
                <tr key={plot.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-x-text">{plot.name}</div>
                      <div className="text-sm text-white/50">{plot.projectName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(plot.status).color}`}>
                      {getStatusIcon(plot.status)}
                      <span className="ml-1">{getStatusInfo(plot.status).label}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {((plot as any).available_sqm || plot.availableSqm || 0).toLocaleString()} / {((plot as any).total_sqm || plot.totalSqm || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(plot.pricePerSqm)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {plot.totalOwners || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(plot.totalRevenue || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPlot(plot)
                          setShowPlotModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-white/70 hover:text-white"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-green-300 hover:text-green-200"
                      >
                        <Calculator className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPlots.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No plots found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No plots available in the system.'}
            </p>
          </div>
        )}
      </div>

      {/* Plot Detail Modal */}
      {showPlotModal && selectedPlot && (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-white/10 w-96 shadow-2xl rounded-2xl bg-x-panel">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-x-text">Plot Details</h3>
                <button
                  onClick={() => setShowPlotModal(false)}
                  className="text-white/50 hover:text-white/80"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plot Name</label>
                  <p className="text-sm text-x-text">{selectedPlot.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project</label>
                  <p className="text-sm text-x-text">{selectedPlot.projectName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(selectedPlot.status).color}`}>
                    {getStatusIcon(selectedPlot.status)}
                    <span className="ml-1">{getStatusInfo(selectedPlot.status).label}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available SQM</label>
                  <p className="text-sm text-x-text">{((selectedPlot as any).available_sqm || selectedPlot.availableSqm || 0).toLocaleString()} / {((selectedPlot as any).total_sqm || selectedPlot.totalSqm || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price per SQM</label>
                  <p className="text-sm text-x-text">{formatCurrency(selectedPlot.pricePerSqm)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Owners</label>
                  <p className="text-sm text-x-text">{selectedPlot.totalOwners}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Revenue</label>
                  <p className="text-sm text-x-text">{formatCurrency(selectedPlot.totalRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}