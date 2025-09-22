import { useState } from 'react'
import { 
  DollarSign, 
  Search, 
  RefreshCw,
  Edit,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Building2,
  XCircle
} from 'lucide-react'
import { usePlots, usePriceUpdates } from '../hooks/useFirebase'
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
  const { data: plots, loading: plotsLoading, error: plotsError } = usePlots()
  const { data: priceUpdates, loading: updatesLoading, error: updatesError } = usePriceUpdates()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [editingPlot, setEditingPlot] = useState<string | null>(null)
  const [newPrice, setNewPrice] = useState<number>(0)
  const [bulkUpdate, setBulkUpdate] = useState(false)
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])
  const [bulkPriceChange, setBulkPriceChange] = useState<number>(0)

  // Convert plots to pricing format
  const plotPricing: PlotPricing[] = plots.map(plot => ({
    id: plot.id,
    name: plot.name,
    projectName: plot.projectName,
    currentPrice: plot.pricePerSqm,
    lastUpdated: plot.updatedAt,
    updatedBy: 'System',
    totalSqm: plot.totalSqm,
    status: plot.status
  }))

  const filteredPlots = plotPricing.filter(plot => {
    const matchesSearch = plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plot.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = filterProject === 'all' || plot.projectName === filterProject
    return matchesSearch && matchesProject
  })

  const handlePriceUpdate = async (plotId: string, newPrice: number) => {
    console.log(`Updating price for plot ${plotId} to ${newPrice}`)
    // Implement price update logic
    setEditingPlot(null)
  }

  const handleBulkPriceUpdate = async () => {
    console.log(`Bulk updating prices for plots: ${selectedPlots.join(', ')} with change: ${bulkPriceChange}%`)
    // Implement bulk update logic
    setBulkUpdate(false)
    setSelectedPlots([])
    setBulkPriceChange(0)
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

  const getPriceChangePercentage = (current: number, previous?: number) => {
    if (!previous) return 0
    return ((current - previous) / previous) * 100
  }

  // Chart data
  const priceHistoryData = priceUpdates.map(update => ({
    date: update.updatedAt ? update.updatedAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    price: update.newPrice || 0,
    plot: update.plotName || 'Unknown'
  }))

  const projectPriceData = plotPricing.reduce((acc, plot) => {
    const existing = acc.find(p => p.project === plot.projectName)
    if (existing) {
      existing.averagePrice = (existing.averagePrice + plot.currentPrice) / 2
      existing.count++
    } else {
      acc.push({
        project: plot.projectName,
        averagePrice: plot.currentPrice,
        count: 1
      })
    }
    return acc
  }, [] as any[])

  if (plotsLoading || updatesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading pricing data...</span>
      </div>
    )
  }

  if (plotsError || updatesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading pricing data</h3>
            <p className="text-sm text-red-700 mt-1">{plotsError || updatesError}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-600">Manage plot pricing and monitor price trends</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setBulkUpdate(!bulkUpdate)}
            className={`btn-secondary flex items-center space-x-2 ${bulkUpdate ? 'bg-blue-100 text-blue-700' : ''}`}
          >
            <Edit className="h-4 w-4" />
            <span>{bulkUpdate ? 'Cancel Bulk Update' : 'Bulk Update'}</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Prices</span>
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
              <p className="text-sm font-medium text-gray-600">Total Plots</p>
              <p className="text-2xl font-bold text-gray-900">{plotPricing.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Price/SQM</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(plotPricing.reduce((sum, p) => sum + p.currentPrice, 0) / plotPricing.length)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(plotPricing.map(p => p.projectName)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Price Updates</p>
              <p className="text-2xl font-bold text-gray-900">{priceUpdates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceHistoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line type="monotone" dataKey="price" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Price by Project</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectPriceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="averagePrice" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bulk Update Panel */}
      {bulkUpdate && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">Bulk Price Update</h3>
            <button
              onClick={() => setBulkUpdate(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Selected Plots ({selectedPlots.length})
              </label>
              <div className="text-sm text-blue-700">
                {selectedPlots.length === 0 ? 'No plots selected' : `${selectedPlots.length} plots selected`}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Price Change (%)
              </label>
              <input
                type="number"
                className="input-field"
                value={bulkPriceChange}
                onChange={(e) => setBulkPriceChange(Number(e.target.value))}
                placeholder="e.g., 10 for 10% increase"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleBulkPriceUpdate}
                disabled={selectedPlots.length === 0 || bulkPriceChange === 0}
                className="btn-primary w-full"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

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
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="all">All Projects</option>
              {[...new Set(plotPricing.map(p => p.projectName).filter(Boolean))].map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
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
                {bulkUpdate && (
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlots(filteredPlots.map(p => p.id))
                        } else {
                          setSelectedPlots([])
                        }
                      }}
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
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlots.map((plot) => {
                const priceChange = getPriceChangePercentage(plot.currentPrice, plot.previousPrice)
                return (
                  <tr key={plot.id} className="hover:bg-gray-50">
                    {bulkUpdate && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedPlots.includes(plot.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPlots([...selectedPlots, plot.id])
                            } else {
                              setSelectedPlots(selectedPlots.filter(id => id !== plot.id))
                            }
                          }}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plot.name}</div>
                      <div className="text-sm text-gray-500">{(plot.totalSqm || 0).toLocaleString()} SQM</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plot.projectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingPlot === plot.id ? (
                        <input
                          type="number"
                          className="w-24 input-field"
                          value={newPrice}
                          onChange={(e) => setNewPrice(Number(e.target.value))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handlePriceUpdate(plot.id, newPrice)
                            }
                          }}
                        />
                      ) : (
                        formatCurrency(plot.currentPrice)
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {priceChange !== 0 && (
                        <span className={`inline-flex items-center ${
                          priceChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {priceChange > 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(priceChange).toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(plot.lastUpdated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        plot.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : plot.status === 'popular'
                          ? 'bg-blue-100 text-blue-800'
                          : plot.status === 'low_stock'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {plot.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {editingPlot === plot.id ? (
                          <>
                            <button
                              onClick={() => handlePriceUpdate(plot.id, newPrice)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingPlot(null)
                                setNewPrice(0)
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingPlot(plot.id)
                              setNewPrice(plot.currentPrice)
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredPlots.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No plots found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No plots available in the system.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}