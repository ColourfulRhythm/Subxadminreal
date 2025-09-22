import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Search, 
  Filter, 
  RefreshCw,
  Eye,
  Edit,
  Calculator,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  XCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Plot, PlotPurchase } from '../types'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'

export default function PlotManagement() {
  const [plots, setPlots] = useState<Plot[]>([
    {
      id: '1',
      projectId: 'proj1',
      projectName: 'Green Valley Estate',
      name: 'Plot A-12',
      totalSqm: 1000,
      availableSqm: 300,
      pricePerSqm: 250,
      totalOwners: 7,
      totalRevenue: 175000,
      averageRevenue: 25000,
      status: 'popular',
      ownershipPercentage: 70,
      purchases: [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          sqm: 100,
          price: 25000,
          purchaseDate: new Date('2024-01-15'),
          status: 'completed'
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Jane Smith',
          sqm: 150,
          price: 37500,
          purchaseDate: new Date('2024-01-20'),
          status: 'completed'
        }
      ],
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '2',
      projectId: 'proj1',
      projectName: 'Green Valley Estate',
      name: 'Plot B-15',
      totalSqm: 800,
      availableSqm: 720,
      pricePerSqm: 250,
      totalOwners: 1,
      totalRevenue: 20000,
      averageRevenue: 20000,
      status: 'available',
      ownershipPercentage: 10,
      purchases: [
        {
          id: '3',
          userId: 'user3',
          userName: 'Mike Johnson',
          sqm: 80,
          price: 20000,
          purchaseDate: new Date('2024-01-18'),
          status: 'completed'
        }
      ],
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2024-01-18')
    },
    {
      id: '3',
      projectId: 'proj2',
      projectName: 'Ocean View Heights',
      name: 'Plot C-08',
      totalSqm: 1200,
      availableSqm: 120,
      pricePerSqm: 400,
      totalOwners: 9,
      totalRevenue: 432000,
      averageRevenue: 48000,
      status: 'low_stock',
      ownershipPercentage: 90,
      purchases: [
        {
          id: '4',
          userId: 'user4',
          userName: 'Sarah Wilson',
          sqm: 120,
          price: 48000,
          purchaseDate: new Date('2024-01-19'),
          status: 'completed'
        }
      ],
      createdAt: new Date('2022-01-01'),
      updatedAt: new Date('2024-01-19')
    },
    {
      id: '4',
      projectId: 'proj2',
      projectName: 'Ocean View Heights',
      name: 'Plot D-03',
      totalSqm: 900,
      availableSqm: 0,
      pricePerSqm: 400,
      totalOwners: 15,
      totalRevenue: 360000,
      averageRevenue: 24000,
      status: 'sold_out',
      ownershipPercentage: 100,
      purchases: [
        {
          id: '5',
          userId: 'user5',
          userName: 'David Brown',
          sqm: 60,
          price: 24000,
          purchaseDate: new Date('2024-01-20'),
          status: 'completed'
        }
      ],
      createdAt: new Date('2022-01-01'),
      updatedAt: new Date('2024-01-20')
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'popular' | 'low_stock' | 'sold_out'>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [showPlotModal, setShowPlotModal] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)

  const filteredPlots = plots.filter(plot => {
    const matchesSearch = plot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plot.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || plot.status === filterStatus
    const matchesProject = filterProject === 'all' || plot.projectId === filterProject
    
    return matchesSearch && matchesStatus && matchesProject
  })

  const projects = Array.from(new Set(plots.map(plot => ({ id: plot.projectId, name: plot.projectName }))))

  const statusDistribution = [
    { name: 'Available', value: plots.filter(p => p.status === 'available').length, color: '#22c55e' },
    { name: 'Popular', value: plots.filter(p => p.status === 'popular').length, color: '#3b82f6' },
    { name: 'Low Stock', value: plots.filter(p => p.status === 'low_stock').length, color: '#f59e0b' },
    { name: 'Sold Out', value: plots.filter(p => p.status === 'sold_out').length, color: '#ef4444' },
  ]

  const revenueData = plots.map(plot => ({
    name: plot.name,
    revenue: plot.totalRevenue,
    owners: plot.totalOwners
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

  const handleRecalculate = async (plotId: string) => {
    setIsRecalculating(true)
    // Simulate recalculation
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRecalculating(false)
    console.log(`Recalculating plot ${plotId}`)
  }

  const handleBulkRecalculate = async () => {
    setIsRecalculating(true)
    // Simulate bulk recalculation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRecalculating(false)
    console.log('Bulk recalculation completed')
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'available':
        return { color: 'text-green-600 bg-green-100', icon: CheckCircle, label: 'Available' }
      case 'popular':
        return { color: 'text-blue-600 bg-blue-100', icon: TrendingUp, label: 'Popular' }
      case 'low_stock':
        return { color: 'text-yellow-600 bg-yellow-100', icon: AlertTriangle, label: 'Low Stock' }
      case 'sold_out':
        return { color: 'text-red-600 bg-red-100', icon: XCircle, label: 'Sold Out' }
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: CheckCircle, label: 'Unknown' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plot Management</h1>
          <p className="text-gray-600">Real-time plot analytics and inventory management</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleBulkRecalculate}
            disabled={isRecalculating}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate All</span>
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
                {plots.reduce((sum, p) => sum + p.totalOwners, 0)}
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
                {formatCurrency(plots.reduce((sum, p) => sum + p.totalRevenue, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plot Status Distribution</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Revenue Plots</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
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
                <option key={project.id} value={project.id}>{project.name}</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ownership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owners
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlots.map((plot) => {
                const statusInfo = getStatusInfo(plot.status)
                const StatusIcon = statusInfo.icon
                
                return (
                  <tr key={plot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{plot.name}</div>
                        <div className="text-sm text-gray-500">
                          {plot.availableSqm.toLocaleString()} / {plot.totalSqm.toLocaleString()} SQM
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{plot.projectName}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(plot.pricePerSqm)}/SQM</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              plot.ownershipPercentage >= 80 ? 'bg-red-500' :
                              plot.ownershipPercentage >= 50 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${plot.ownershipPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{plot.ownershipPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(plot.totalRevenue)}</div>
                        <div className="text-sm text-gray-500">Avg: {formatCurrency(plot.averageRevenue)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {plot.totalOwners}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
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
                          onClick={() => handleRecalculate(plot.id)}
                          disabled={isRecalculating}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Calculator className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plot Detail Modal */}
      {showPlotModal && selectedPlot && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{selectedPlot.name}</h3>
              <button
                onClick={() => setShowPlotModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plot Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Plot Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Project</label>
                      <p className="text-sm text-gray-900">{selectedPlot.projectName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(selectedPlot.status).color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {getStatusInfo(selectedPlot.status).label}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total SQM</label>
                      <p className="text-sm text-gray-900">{selectedPlot.totalSqm.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Available SQM</label>
                      <p className="text-sm text-gray-900">{selectedPlot.availableSqm.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price per SQM</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedPlot.pricePerSqm)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ownership %</label>
                      <p className="text-sm text-gray-900">{selectedPlot.ownershipPercentage}%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Revenue</label>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedPlot.totalRevenue)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Average Revenue</label>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedPlot.averageRevenue)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Owners</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedPlot.totalOwners}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedPlot.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Purchase History</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedPlot.purchases.map((purchase) => (
                    <div key={purchase.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{purchase.userName}</p>
                          <p className="text-sm text-gray-600">{purchase.sqm} SQM</p>
                          <p className="text-xs text-gray-500">{formatDate(purchase.purchaseDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(purchase.price)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                            purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {purchase.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() => handleRecalculate(selectedPlot.id)}
                  disabled={isRecalculating}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Calculator className="h-4 w-4" />
                  <span>Recalculate</span>
                </button>
                <button className="btn-primary flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit Plot</span>
                </button>
                <button className="btn-success flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>View Analytics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
