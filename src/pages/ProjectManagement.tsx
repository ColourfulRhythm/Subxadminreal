import { useState } from 'react'
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Plus,
  Eye,
  Edit,
  Save,
  X,
  BarChart3,
  Users,
  Layers,
  Download,
  Play,
  Pause
} from 'lucide-react'
import { Project } from '../types'
import { useProjects, usePlots, useInvestments } from '../hooks/useFirebase'
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

export default function ProjectManagement() {
  const { data: projects, loading, error } = useProjects()
  const { data: plots } = usePlots()
  const { data: investments } = useInvestments()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'planning' | 'active' | 'completed' | 'paused'>('all')
  const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    location: '',
    totalSqm: 0,
    pricePerSqm: 0,
    developerName: '',
    startDate: '',
    expectedCompletion: '',
    status: 'planning' as 'planning' | 'active' | 'completed' | 'paused'
  })

  // Safe arrays
  const safeProjects = Array.isArray(projects) ? projects : []
  const safePlots = Array.isArray(plots) ? plots : []
  const safeInvestments = Array.isArray(investments) ? investments : []

  // Helper function to get total owners for a project from plots
  const getProjectTotalOwners = (projectId: string) => {
    return safePlots
      .filter(plot => plot.projectId === projectId)
      .reduce((sum, plot) => sum + ((plot as any).Total_owners || plot.totalOwners || 0), 0)
  }

  // Helper function to get total revenue for a project from investments
  const getProjectTotalRevenue = (projectId: string) => {
    return safeInvestments
      .filter(investment => 
        investment.plotId === projectId || 
        (investment as any).project_id === projectId ||
        (investment as any).projectId === projectId
      )
      .reduce((sum, investment) => sum + ((investment as any).amount_paid || (investment as any).Amount_paid || 0), 0)
  }

  // Get plots for a project
  const getProjectPlots = (projectId: string) => {
    return safePlots.filter(plot => plot.projectId === projectId)
  }

  // Get total SQM sold for a project
  const getProjectSoldSqm = (projectId: string) => {
    return safePlots
      .filter(plot => plot.projectId === projectId)
      .reduce((sum, plot) => sum + ((plot as any).sold_sqm || (plot.totalSqm - plot.availableSqm) || 0), 0)
  }

  const filteredProjects = safeProjects.filter(project => {
    const matchesSearch = (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.developerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    const matchesApproval = filterApproval === 'all' || 
                           (filterApproval === 'approved' && project.isApproved) ||
                           (filterApproval === 'pending' && !project.isApproved)
    
    return matchesSearch && matchesStatus && matchesApproval
  })

  // Actions
  const handleApproveProject = async (projectId: string) => {
    setProcessing(true)
    try {
      const docRef = doc(db, 'projects', projectId)
      await updateDoc(docRef, { 
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: 'admin'
      })
      toast.success('Project approved successfully')
    } catch (error) {
      toast.error('Failed to approve project')
      console.error(error)
    }
    setProcessing(false)
  }


  const handleToggleStatus = async (projectId: string, currentStatus: string) => {
    setProcessing(true)
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      const docRef = doc(db, 'projects', projectId)
      await updateDoc(docRef, { 
        status: newStatus,
        updatedAt: new Date()
      })
      toast.success(`Project ${newStatus === 'active' ? 'activated' : 'paused'}`)
    } catch (error) {
      toast.error('Failed to update project status')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleAddProject = async () => {
    if (!projectForm.name || !projectForm.location) {
      toast.error('Please fill in required fields')
      return
    }
    setProcessing(true)
    try {
      await addDoc(collection(db, 'projects'), {
        ...projectForm,
        totalSqm: Number(projectForm.totalSqm),
        pricePerSqm: Number(projectForm.pricePerSqm),
        startDate: projectForm.startDate ? new Date(projectForm.startDate) : new Date(),
        expectedCompletion: projectForm.expectedCompletion ? new Date(projectForm.expectedCompletion) : null,
        isApproved: false,
        revenue: 0,
        totalPlots: 0,
        createdAt: new Date(),
        developerId: 'admin'
      })
      toast.success('Project created successfully')
      setShowAddModal(false)
      setProjectForm({
        name: '',
        description: '',
        location: '',
        totalSqm: 0,
        pricePerSqm: 0,
        developerName: '',
        startDate: '',
        expectedCompletion: '',
        status: 'planning'
      })
    } catch (error) {
      toast.error('Failed to create project')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setProjectForm({
      name: project.name || '',
      description: project.description || '',
      location: project.location || '',
      totalSqm: project.totalSqm || 0,
      pricePerSqm: project.pricePerSqm || 0,
      developerName: project.developerName || '',
      startDate: '',
      expectedCompletion: '',
      status: project.status || 'planning'
    })
    setShowEditModal(true)
  }

  const handleSaveProject = async () => {
    if (!selectedProject) return
    setProcessing(true)
    try {
      const docRef = doc(db, 'projects', selectedProject.id)
      await updateDoc(docRef, {
        name: projectForm.name,
        description: projectForm.description,
        location: projectForm.location,
        totalSqm: Number(projectForm.totalSqm),
        pricePerSqm: Number(projectForm.pricePerSqm),
        developerName: projectForm.developerName,
        status: projectForm.status,
        updatedAt: new Date()
      })
      toast.success('Project updated successfully')
      setShowEditModal(false)
    } catch (error) {
      toast.error('Failed to update project')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleExportProjects = () => {
    const csv = [
      ['Name', 'Location', 'Developer', 'Status', 'Approved', 'Total SQM', 'Price/SQM', 'Owners', 'Revenue'].join(','),
      ...filteredProjects.map(p => [
        p.name || '',
        p.location || '',
        p.developerName || '',
        p.status || '',
        p.isApproved ? 'Yes' : 'No',
        p.totalSqm || 0,
        p.pricePerSqm || 0,
        getProjectTotalOwners(p.id),
        getProjectTotalRevenue(p.id)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `projects-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Exported to CSV')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    const dateObj = new Date(date)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    return 'Invalid Date'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'planning': return <Clock className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Chart data
  const statusDistribution = [
    { name: 'Active', value: safeProjects.filter(p => p.status === 'active').length, color: '#22c55e' },
    { name: 'Planning', value: safeProjects.filter(p => p.status === 'planning').length, color: '#3b82f6' },
    { name: 'Paused', value: safeProjects.filter(p => p.status === 'paused').length, color: '#f59e0b' },
    { name: 'Completed', value: safeProjects.filter(p => p.status === 'completed').length, color: '#6b7280' },
  ]

  const revenueByProject = safeProjects.slice(0, 5).map(p => ({
    name: p.name?.substring(0, 15) || 'Unknown',
    revenue: getProjectTotalRevenue(p.id),
    owners: getProjectTotalOwners(p.id)
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading projects...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading projects</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Monitor land development projects and manage developer applications</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleExportProjects}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
          <Plus className="h-4 w-4" />
          <span>Add Project</span>
        </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{safeProjects.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeProjects.filter(p => p.status === 'active').length}
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
                {safeProjects.reduce((sum, p) => sum + getProjectTotalOwners(p.id), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Layers className="h-6 w-6 text-cyan-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Plots</p>
              <p className="text-2xl font-bold text-gray-900">{safePlots.length}</p>
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
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(safeProjects.reduce((sum, p) => sum + getProjectTotalRevenue(p.id), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
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
          <div className="flex justify-center space-x-4 mt-2">
            {statusDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Projects by Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueByProject}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
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
                placeholder="Search projects by name, location, or developer..."
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
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
            <select
              className="input-field"
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value as any)}
            >
              <option value="all">All Approval</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="card hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {project.location}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1 capitalize">{project.status}</span>
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Developer:</span>
                <span className="font-medium text-gray-900">{project.developerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plots:</span>
                <span className="font-medium text-gray-900">{getProjectPlots(project.id).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Owners:</span>
                <span className="font-medium text-gray-900">{getProjectTotalOwners(project.id)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price/SQM:</span>
                <span className="font-medium text-gray-900">{formatCurrency(project.pricePerSqm || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-medium text-green-600">{formatCurrency(getProjectTotalRevenue(project.id))}</span>
              </div>
              </div>

            {/* Approval Badge */}
            <div className="mb-4">
              {project.isApproved ? (
                <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Approval
                </span>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedProject(project)
                    setShowProjectModal(true)
                  }}
                  className="text-blue-600 hover:text-blue-800"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditProject(project)}
                  className="text-gray-600 hover:text-gray-800"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedProject(project)
                    setShowAnalyticsModal(true)
                  }}
                  className="text-purple-600 hover:text-purple-800"
                  title="Analytics"
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex space-x-2">
                {!project.isApproved && (
                  <button
                    onClick={() => handleApproveProject(project.id)}
                    className="btn-success text-xs px-2 py-1"
                    disabled={processing}
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleToggleStatus(project.id, project.status)}
                  className={`text-xs px-2 py-1 ${project.status === 'active' ? 'btn-warning' : 'btn-primary'}`}
                  disabled={processing}
                >
                  {project.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="card text-center py-8">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding a new project.'}
          </p>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Project</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name *</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location *</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={projectForm.location}
                    onChange={(e) => setProjectForm({...projectForm, location: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="input-field mt-1"
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Developer Name</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={projectForm.developerName}
                    onChange={(e) => setProjectForm({...projectForm, developerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="input-field mt-1"
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({...projectForm, status: e.target.value as any})}
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total SQM</label>
                  <input
                    type="number"
                    className="input-field mt-1"
                    value={projectForm.totalSqm}
                    onChange={(e) => setProjectForm({...projectForm, totalSqm: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price per SQM (₦)</label>
                  <input
                    type="number"
                    className="input-field mt-1"
                    value={projectForm.pricePerSqm}
                    onChange={(e) => setProjectForm({...projectForm, pricePerSqm: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    className="input-field mt-1"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({...projectForm, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Completion</label>
                  <input
                    type="date"
                    className="input-field mt-1"
                    value={projectForm.expectedCompletion}
                    onChange={(e) => setProjectForm({...projectForm, expectedCompletion: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button onClick={handleAddProject} className="btn-primary flex-1" disabled={processing}>
                  <Plus className="h-4 w-4 mr-2" />
                  {processing ? 'Creating...' : 'Create Project'}
                </button>
                <button onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Project</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({...projectForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={projectForm.location}
                    onChange={(e) => setProjectForm({...projectForm, location: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="input-field mt-1"
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Developer Name</label>
                  <input
                    type="text"
                    className="input-field mt-1"
                    value={projectForm.developerName}
                    onChange={(e) => setProjectForm({...projectForm, developerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="input-field mt-1"
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({...projectForm, status: e.target.value as any})}
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total SQM</label>
                  <input
                    type="number"
                    className="input-field mt-1"
                    value={projectForm.totalSqm}
                    onChange={(e) => setProjectForm({...projectForm, totalSqm: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price per SQM (₦)</label>
                  <input
                    type="number"
                    className="input-field mt-1"
                    value={projectForm.pricePerSqm}
                    onChange={(e) => setProjectForm({...projectForm, pricePerSqm: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button onClick={handleSaveProject} className="btn-primary flex-1" disabled={processing}>
                  <Save className="h-4 w-4 mr-2" />
                  {processing ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Project Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900">{selectedProject.description || 'No description'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">{selectedProject.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Developer</label>
                      <p className="text-sm text-gray-900">{selectedProject.developerName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                        {getStatusIcon(selectedProject.status)}
                        <span className="ml-1 capitalize">{selectedProject.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Project Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Total Owners</p>
                      <p className="text-xl font-semibold text-gray-900">{getProjectTotalOwners(selectedProject.id)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Total Plots</p>
                      <p className="text-xl font-semibold text-gray-900">{getProjectPlots(selectedProject.id).length}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Price/SQM</p>
                      <p className="text-xl font-semibold text-gray-900">{formatCurrency(selectedProject.pricePerSqm || 0)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-xl font-semibold text-green-600">{formatCurrency(getProjectTotalRevenue(selectedProject.id))}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Timeline</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedProject.startDate)}</p>
                    </div>
                    {selectedProject.expectedCompletion && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Expected Completion</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedProject.expectedCompletion)}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Approval Status</label>
                        {selectedProject.isApproved ? (
                        <span className="inline-flex items-center text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm text-yellow-600">
                          <Clock className="h-4 w-4 mr-1" />
                          Pending Approval
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Plots in this Project</h4>
                  <div className="max-h-40 overflow-y-auto border rounded-lg">
                    {getProjectPlots(selectedProject.id).length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No plots assigned</div>
                    ) : (
                      getProjectPlots(selectedProject.id).map(plot => (
                        <div key={plot.id} className="flex justify-between p-2 border-b last:border-0">
                          <span className="text-sm">{plot.name}</span>
                          <span className="text-sm text-gray-500">{plot.availableSqm}/{plot.totalSqm} SQM</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Actions</h4>
                  <div className="space-y-2">
                    {!selectedProject.isApproved && (
                      <button
                        onClick={() => {
                          handleApproveProject(selectedProject.id)
                          setShowProjectModal(false)
                        }}
                        className="w-full btn-success"
                        disabled={processing}
                      >
                        Approve Project
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowProjectModal(false)
                        handleEditProject(selectedProject)
                      }}
                      className="w-full btn-secondary"
                    >
                      Edit Project
                    </button>
                    <button
                      onClick={() => handleToggleStatus(selectedProject.id, selectedProject.status)}
                      className={`w-full ${selectedProject.status === 'active' ? 'btn-warning' : 'btn-primary'}`}
                      disabled={processing}
                    >
                      {selectedProject.status === 'active' ? 'Pause Project' : 'Activate Project'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[700px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Analytics: {selectedProject.name}</h3>
              <button onClick={() => setShowAnalyticsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-blue-600">Total Revenue</p>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(getProjectTotalRevenue(selectedProject.id))}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-green-600">Owners</p>
                  <p className="text-xl font-bold text-green-900">{getProjectTotalOwners(selectedProject.id)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-purple-600">SQM Sold</p>
                  <p className="text-xl font-bold text-purple-900">{getProjectSoldSqm(selectedProject.id).toLocaleString()}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-amber-600">Plots</p>
                  <p className="text-xl font-bold text-amber-900">{getProjectPlots(selectedProject.id).length}</p>
                </div>
              </div>

              {/* Performance */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Sales Performance</h4>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full"
                    style={{ width: `${Math.min((getProjectSoldSqm(selectedProject.id) / (selectedProject.totalSqm || 1)) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {((getProjectSoldSqm(selectedProject.id) / (selectedProject.totalSqm || 1)) * 100).toFixed(1)}% sold
                  ({getProjectSoldSqm(selectedProject.id).toLocaleString()} / {(selectedProject.totalSqm || 0).toLocaleString()} SQM)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
