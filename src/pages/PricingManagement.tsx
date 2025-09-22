import { useState } from 'react'
import { 
  DollarSign, 
  Search, 
  Filter, 
  RefreshCw,
  Edit,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Building2
} from 'lucide-react'
import { PriceUpdate } from '../types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface PlotPricing {
  id: string
  name: string
  projectName: string
  currentPrice: number
  previousPrice?: number
  lastUpdated: Date
  updatedBy: string
  totalSqm: number
  status: 'available' | 'popular' | 'low_stock' | 'sold_out'
}

export default function PricingManagement() {
  const [plots, setPlots] = useState<PlotPricing[]>([
    {
      id: '1',
      name: 'Plot A-12',
      projectName: 'Green Valley Estate',
      currentPrice: 250,
      previousPrice: 230,
      lastUpdated: new Date('2024-01-15'),
      updatedBy: 'admin1',
      totalSqm: 1000,
      status: 'popular'
    },
    {
      id: '2',
      name: 'Plot B-15',
      projectName: 'Green Valley Estate',
      currentPrice: 250,
      lastUpdated: new Date('2024-01-10'),
      updatedBy: 'admin2',
      totalSqm: 800,
      status: 'available'
    },
    {
      id: '3',
      name: 'Plot C-08',
      projectName: 'Ocean View Heights',
      currentPrice: 400,
      previousPrice: 380,
      lastUpdated: new Date('2024-01-18'),
      updatedBy: 'admin1',
      totalSqm: 1200,
      status: 'low_stock'
    },
    {
      id: '4',
      name: 'Plot D-03',
      projectName: 'Ocean View Heights',
      currentPrice: 400,
      lastUpdated: new Date('2024-01-12'),
      updatedBy: 'admin2',
      totalSqm: 900,
      status: 'sold_out'
    }
  ])

  const [priceHistory] = useState<PriceUpdate[]>([
    {
      id: '1',
      plotId: '1',
      plotName: 'Plot A-12',
      oldPrice: 230,
      newPrice: 250,
      updatedBy: 'admin1',
      updatedAt: new Date('2024-01-15'),
      reason: 'Market demand increase'
    },
    {
      id: '2',
      plotId: '3',
      plotName: 'Plot C-08',
      oldPrice: 380,
      newPrice: 400,
      updatedBy: 'admin1',
      updatedAt: new Date('2024-01-18'),
      reason: 'Location premium adjustment'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'popular' | 'low_stock' | 'sold_out'>('all')
  const [editingPlot, setEditingPlot] = useState<PlotPricing | null>(null)
  const [newPrice, setNewPrice] = useState('')
  const [updateReason, setUpdateReason] = useState('')
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false)
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  const [bulkPriceIncrease, setBulkPriceIncrease] = useState('')

  const projects = Array.from(new Set(plots.map(plot => ({ id: plot.projectName, name: plot.projectName }))))

  const filteredPlots = plots.filter(plot => {
    const matchesSearch = plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plot.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProject = filterProject === 'all' || plot.projectName === filterProject
    const matchesStatus = filterStatus === 'all' || plot.status === filterStatus
    
    return matchesSearch && matchesProject && matchesStatus
  })

  const priceTrends = [
    { month: 'Oct 2023', avgPrice: 220 },
    { month: 'Nov 2023', avgPrice: 235 },
    { month: 'Dec 2023', avgPrice: 245 },
    { month: 'Jan 2024', avgPrice: 260 },
  ]

  const projectPricing = plots.reduce((acc, plot) => {
    if (!acc[plot.projectName]) {
      acc[plot.projectName] = { totalPlots: 0, avgPrice: 0, totalValue: 0 }
    }
    acc[plot.projectName].totalPlots += 1
    acc[plot.projectName].avgPrice += plot.currentPrice
    acc[plot.projectName].totalValue += plot.currentPrice * plot.totalSqm
    return acc
  }, {} as Record<string, { totalPlots: number, avgPrice: number, totalValue: number }>)

  Object.keys(projectPricing).forEach(project => {
    projectPricing[project].avgPrice = Math.round(projectPricing[project].avgPrice / projectPricing[project].totalPlots)
  })

  const handlePriceUpdate = async (plotId: string, newPriceValue: number, reason: string) => {
    const plot = plots.find(p => p.id === plotId)
    if (!plot) return

    const priceUpdate: PriceUpdate = {
      id: Date.now().toString(),
      plotId,
      plotName: plot.name,
      oldPrice: plot.currentPrice,
      newPrice: newPriceValue,
      updatedBy: 'current_admin',
      updatedAt: new Date(),
      reason
    }

    setPlots(prev => prev.map(p => 
      p.id === plotId 
        ? { 
            ...p, 
            currentPrice: newPriceValue,
            previousPrice: p.currentPrice,
            lastUpdated: new Date(),
            updatedBy: 'current_admin'
          }
        : p
    ))

    // Add to price history
    console.log('Price update:', priceUpdate)
    
    setEditingPlot(null)
    setNewPrice('')
    setUpdateReason('')
  }

  const handleBulkPriceUpdate = async () => {
    if (selectedPlots.length === 0 || !bulkPriceIncrease) return

    const increasePercent = parseFloat(bulkPriceIncrease)
    if (isNaN(increasePercent)) return

    setPlots(prev => prev.map(plot => 
      selectedPlots.includes(plot.id)
        ? {
            ...plot,
            currentPrice: Math.round(plot.currentPrice * (1 + increasePercent / 100)),
            previousPrice: plot.currentPrice,
            lastUpdated: new Date(),
            updatedBy: 'current_admin'
          }
        : plot
    ))

    setSelectedPlots([])
    setBulkPriceIncrease('')
    setBulkUpdateMode(false)
  }

  const handleSelectPlot = (plotId: string) => {
    setSelectedPlots(prev => 
      prev.includes(plotId) 
        ? prev.filter(id => id !== plotId)
        : [...prev, plotId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPlots.length === filteredPlots.length) {
      setSelectedPlots([])
    } else {
      setSelectedPlots(filteredPlots.map(p => p.id))
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'popular':
        return 'bg-blue-100 text-blue-800'
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold_out':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriceChangeIcon = (plot: PlotPricing) => {
    if (!plot.previousPrice) return null
    return plot.currentPrice > plot.previousPrice ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getPriceChangePercent = (plot: PlotPricing) => {
    if (!plot.previousPrice) return 0
    return ((plot.currentPrice - plot.previousPrice) / plot.previousPrice) * 100
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-600">Update plot prices in real-time and manage pricing strategies</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
            className={`flex items-center space-x-2 ${bulkUpdateMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>{bulkUpdateMode ? 'Exit Bulk Mode' : 'Bulk Update'}</span>
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
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Price/SQM</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(plots.reduce((sum, p) => sum + p.currentPrice, 0) / plots.length)}
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
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(plots.reduce((sum, p) => sum + (p.currentPrice * p.totalSqm), 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Building2 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Avg Price/SQM']} />
              <Line type="monotone" dataKey="avgPrice" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Pricing Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(projectPricing).map(([name, data]) => ({ name, avgPrice: data.avgPrice }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Avg Price/SQM']} />
              <Bar dataKey="avgPrice" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bulk Update Controls */}
      {bulkUpdateMode && (
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Price Update</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Increase %</label>
              <input
                type="number"
                value={bulkPriceIncrease}
                onChange={(e) => setBulkPriceIncrease(e.target.value)}
                className="input-field"
                placeholder="Enter percentage"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBulkPriceUpdate}
                disabled={selectedPlots.length === 0 || !bulkPriceIncrease}
                className="btn-primary"
              >
                Apply to {selectedPlots.length} plots
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSelectAll}
                className="btn-secondary"
              >
                {selectedPlots.length === filteredPlots.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.name}>{project.name}</option>
              ))}
            </select>
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
          </div>
        </div>
      </div>

      {/* Plots Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {bulkUpdateMode && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPlots.length === filteredPlots.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlots.map((plot) => (
                <tr key={plot.id} className="hover:bg-gray-50">
                  {bulkUpdateMode && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedPlots.includes(plot.id)}
                        onChange={() => handleSelectPlot(plot.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{plot.name}</div>
                      <div className="text-sm text-gray-500">{plot.totalSqm.toLocaleString()} SQM</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{plot.projectName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(plot.currentPrice)}/SQM
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {plot.previousPrice && (
                      <div className="flex items-center space-x-1">
                        {getPriceChangeIcon(plot)}
                        <span className={`text-sm font-medium ${
                          plot.currentPrice > plot.previousPrice ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {getPriceChangePercent(plot).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plot.status)}`}>
                      {plot.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(plot.lastUpdated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setEditingPlot(plot)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Update Modal */}
      {editingPlot && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Update Price - {editingPlot.name}</h3>
              <button
                onClick={() => setEditingPlot(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Current Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Price</label>
                    <p className="text-sm text-gray-900">{formatCurrency(editingPlot.currentPrice)}/SQM</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total SQM</label>
                    <p className="text-sm text-gray-900">{editingPlot.totalSqm.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project</label>
                    <p className="text-sm text-gray-900">{editingPlot.projectName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(editingPlot.status)}`}>
                      {editingPlot.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Price Update</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Price per SQM</label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Enter new price"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Update</label>
                    <textarea
                      value={updateReason}
                      onChange={(e) => setUpdateReason(e.target.value)}
                      className="input-field"
                      rows={3}
                      placeholder="Enter reason for price update..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setEditingPlot(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const newPriceValue = parseFloat(newPrice)
                    if (newPriceValue > 0 && updateReason.trim()) {
                      handlePriceUpdate(editingPlot.id, newPriceValue, updateReason)
                    }
                  }}
                  disabled={!newPrice || !updateReason.trim()}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Price</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
