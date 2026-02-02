import { useState } from 'react'
import { 
  MapPin, 
  Search, 
  RefreshCw,
  Eye,
  Edit,
  TrendingUp,
  Users,
  DollarSign,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Download,
  Plus,
  Percent,
  Save,
  X
} from 'lucide-react'
import { Plot } from '../types'
import { usePlots, firebaseUtils } from '../hooks/useFirebase'
import { exportPlotsToCSV } from '../utils/csvExport'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import toast from 'react-hot-toast'

export default function PlotManagement() {
  const { data: plots, loading, error } = usePlots()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'popular' | 'low_stock' | 'sold_out'>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [showPlotModal, setShowPlotModal] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)
  
  // New state for modals
  const [showAddPlotModal, setShowAddPlotModal] = useState(false)
  const [showEditPriceModal, setShowEditPriceModal] = useState(false)
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false)
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state for new plot
  const [newPlot, setNewPlot] = useState({
    name: '',
    projectId: '',
    projectName: '',
    totalSqm: '',
    availableSqm: '',
    pricePerSqm: '',
    status: 'available' as 'available' | 'popular' | 'low_stock' | 'sold_out'
  })
  
  // Form state for price edit
  const [newPrice, setNewPrice] = useState('')
  const [priceChangeReason, setPriceChangeReason] = useState('')
  
  // Form state for bulk price increase
  const [bulkIncreasePercent, setBulkIncreasePercent] = useState('')
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([])

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
    setTimeout(() => setIsRecalculating(false), 2000)
  }

  const handleExportPlots = () => {
    exportPlotsToCSV(filteredPlots)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Add new plot
  const handleAddPlot = async () => {
    if (!newPlot.name || !newPlot.pricePerSqm || !newPlot.totalSqm) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, 'plots'), {
        name: newPlot.name,
        projectId: newPlot.projectId || 'default',
        projectName: newPlot.projectName || 'Default Project',
        totalSqm: Number(newPlot.totalSqm),
        total_sqm: Number(newPlot.totalSqm),
        availableSqm: Number(newPlot.availableSqm) || Number(newPlot.totalSqm),
        available_sqm: Number(newPlot.availableSqm) || Number(newPlot.totalSqm),
        pricePerSqm: Number(newPlot.pricePerSqm),
        price_per_sqm: Number(newPlot.pricePerSqm),
        status: newPlot.status,
        totalOwners: 0,
        totalRevenue: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      toast.success('Plot added successfully!')
      setShowAddPlotModal(false)
      setNewPlot({
        name: '',
        projectId: '',
        projectName: '',
        totalSqm: '',
        availableSqm: '',
        pricePerSqm: '',
        status: 'available'
      })
    } catch (err) {
      console.error('Error adding plot:', err)
      toast.error('Failed to add plot')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit plot price
  const handleEditPrice = async () => {
    if (!editingPlot || !newPrice) {
      toast.error('Please enter a new price')
      return
    }
    
    setIsSubmitting(true)
    try {
      await firebaseUtils.updatePlotPrice(
        editingPlot.id,
        Number(newPrice),
        priceChangeReason || 'Price update'
      )
      
      toast.success('Price updated successfully!')
      setShowEditPriceModal(false)
      setEditingPlot(null)
      setNewPrice('')
      setPriceChangeReason('')
    } catch (err) {
      console.error('Error updating price:', err)
      toast.error('Failed to update price')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Bulk price increase
  const handleBulkPriceIncrease = async () => {
    if (!bulkIncreasePercent || selectedPlotIds.length === 0) {
      toast.error('Please select plots and enter a percentage')
      return
    }
    
    setIsSubmitting(true)
    try {
      await firebaseUtils.bulkUpdatePlotPrices(
        selectedPlotIds,
        Number(bulkIncreasePercent)
      )
      
      toast.success(`Prices increased by ${bulkIncreasePercent}% for ${selectedPlotIds.length} plots!`)
      setShowBulkPriceModal(false)
      setBulkIncreasePercent('')
      setSelectedPlotIds([])
    } catch (err) {
      console.error('Error bulk updating prices:', err)
      toast.error('Failed to update prices')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle plot selection for bulk operations
  const togglePlotSelection = (plotId: string) => {
    setSelectedPlotIds(prev => 
      prev.includes(plotId) 
        ? prev.filter(id => id !== plotId)
        : [...prev, plotId]
    )
  }

  // Select all plots
  const selectAllPlots = () => {
    if (selectedPlotIds.length === filteredPlots.length) {
      setSelectedPlotIds([])
    } else {
      setSelectedPlotIds(filteredPlots.map(p => p.id))
    }
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Plot Management</h1>
          <p className="page-subtitle">Monitor plot availability, pricing, and ownership</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddPlotModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Plot</span>
          </button>
          <button
            onClick={() => setShowBulkPriceModal(true)}
            disabled={selectedPlotIds.length === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Percent className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk Price</span>
            {selectedPlotIds.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                {selectedPlotIds.length}
              </span>
            )}
          </button>
          <button
            onClick={handleExportPlots}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleRecalculateMetrics}
            disabled={isRecalculating}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue-50">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="stat-label">Total Plots</p>
            <p className="stat-value">{plots.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-emerald-50">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="stat-label">Available</p>
            <p className="stat-value">
              {plots.filter(p => p.status === 'available').length}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-violet-50">
            <Users className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <p className="stat-label">Total Owners</p>
            <p className="stat-value">
              {plots.reduce((sum, p) => sum + (p.totalOwners || 0), 0)}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-amber-50">
            <DollarSign className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value text-xl">
              {formatCurrency(plots.reduce((sum, p) => sum + (p.totalRevenue || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <h3 className="chart-title">Plot Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
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
            {statusChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span className="text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="chart-title">Revenue by Plot</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
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
          <div className="flex gap-2">
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
      <div className="card p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="table-header">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPlotIds.length === filteredPlots.length && filteredPlots.length > 0}
                    onChange={selectAllPlots}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th>Plot</th>
                <th>Status</th>
                <th>SQM</th>
                <th>Price/SQM</th>
                <th>Owners</th>
                <th>Revenue</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlots.map((plot) => (
                <tr key={plot.id} className="table-row">
                  <td className="px-4">
                    <input
                      type="checkbox"
                      checked={selectedPlotIds.includes(plot.id)}
                      onChange={() => togglePlotSelection(plot.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">{plot.name}</div>
                      <div className="text-xs text-gray-500">{plot.projectName}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(plot.status).color}`}>
                      {getStatusIcon(plot.status)}
                      {getStatusInfo(plot.status).label}
                    </span>
                  </td>
                  <td className="text-gray-900">
                    {((plot as any).available_sqm || plot.availableSqm || 0).toLocaleString()} / {((plot as any).total_sqm || plot.totalSqm || 0).toLocaleString()}
                  </td>
                  <td className="font-medium text-gray-900">
                    {formatCurrency(plot.pricePerSqm || 0)}
                  </td>
                  <td className="text-gray-900">
                    {plot.totalOwners || 0}
                  </td>
                  <td className="text-gray-900">
                    {formatCurrency(plot.totalRevenue || 0)}
                  </td>
                  <td className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedPlot(plot)
                          setShowPlotModal(true)
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingPlot(plot)
                          setNewPrice(String(plot.pricePerSqm || 0))
                          setShowEditPriceModal(true)
                        }}
                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Price"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPlots.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">No plots found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding a new plot.'}
            </p>
            <button
              onClick={() => setShowAddPlotModal(true)}
              className="mt-4 btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Plot
            </button>
          </div>
        )}
      </div>

      {/* Add Plot Modal */}
      {showAddPlotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Add New Plot</h3>
              <button
                onClick={() => setShowAddPlotModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plot Name *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Plot A1"
                  value={newPlot.name}
                  onChange={(e) => setNewPlot({ ...newPlot, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="project-123"
                    value={newPlot.projectId}
                    onChange={(e) => setNewPlot({ ...newPlot, projectId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Estate Name"
                    value={newPlot.projectName}
                    onChange={(e) => setNewPlot({ ...newPlot, projectName: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total SQM *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="1000"
                    value={newPlot.totalSqm}
                    onChange={(e) => setNewPlot({ ...newPlot, totalSqm: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available SQM</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="1000"
                    value={newPlot.availableSqm}
                    onChange={(e) => setNewPlot({ ...newPlot, availableSqm: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per SQM (₦) *</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="25000"
                    value={newPlot.pricePerSqm}
                    onChange={(e) => setNewPlot({ ...newPlot, pricePerSqm: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="input-field"
                    value={newPlot.status}
                    onChange={(e) => setNewPlot({ ...newPlot, status: e.target.value as any })}
                  >
                    <option value="available">Available</option>
                    <option value="popular">Popular</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowAddPlotModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlot}
                disabled={isSubmitting}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Add Plot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {showEditPriceModal && editingPlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Edit Price</h3>
              <button
                onClick={() => {
                  setShowEditPriceModal(false)
                  setEditingPlot(null)
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Plot</p>
                <p className="font-medium text-gray-900">{editingPlot.name}</p>
                <p className="text-sm text-gray-500 mt-1">Current Price: {formatCurrency(editingPlot.pricePerSqm || 0)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Price per SQM (₦)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Enter new price"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Market adjustment"
                  value={priceChangeReason}
                  onChange={(e) => setPriceChangeReason(e.target.value)}
                />
              </div>
              
              {newPrice && editingPlot.pricePerSqm && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    Price change: {((Number(newPrice) - editingPlot.pricePerSqm) / editingPlot.pricePerSqm * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setShowEditPriceModal(false)
                  setEditingPlot(null)
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPrice}
                disabled={isSubmitting}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Price Increase Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Price Increase</h3>
              <button
                onClick={() => setShowBulkPriceModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>{selectedPlotIds.length}</strong> plots selected
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Increase Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="input-field pr-10"
                    placeholder="e.g., 10"
                    value={bulkIncreasePercent}
                    onChange={(e) => setBulkIncreasePercent(e.target.value)}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              {bulkIncreasePercent && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-sm text-amber-700">
                    All selected plots will increase by <strong>{bulkIncreasePercent}%</strong>
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowBulkPriceModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPriceIncrease}
                disabled={isSubmitting || !bulkIncreasePercent}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
                Apply Increase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plot Detail Modal */}
      {showPlotModal && selectedPlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Plot Details</h3>
              <button
                onClick={() => setShowPlotModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Plot Name</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPlot.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Project</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPlot.projectName}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Status</label>
                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(selectedPlot.status).color}`}>
                  {getStatusIcon(selectedPlot.status)}
                  {getStatusInfo(selectedPlot.status).label}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Available SQM</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {((selectedPlot as any).available_sqm || selectedPlot.availableSqm || 0).toLocaleString()} / {((selectedPlot as any).total_sqm || selectedPlot.totalSqm || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Price per SQM</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(selectedPlot.pricePerSqm || 0)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Total Owners</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedPlot.totalOwners || 0}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase">Total Revenue</label>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(selectedPlot.totalRevenue || 0)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowPlotModal(false)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPlotModal(false)
                  setEditingPlot(selectedPlot)
                  setNewPrice(String(selectedPlot.pricePerSqm || 0))
                  setShowEditPriceModal(true)
                }}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
