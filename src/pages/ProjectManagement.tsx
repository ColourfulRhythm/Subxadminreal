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
  Edit
} from 'lucide-react'
import { Project } from '../types'

export default function ProjectManagement() {
  const [projects] = useState<Project[]>([
    {
      id: '1',
      name: 'Green Valley Estate',
      description: 'Premium residential development with modern amenities',
      location: 'Lagos, Nigeria',
      totalPlots: 150,
      totalSqm: 45000,
      pricePerSqm: 250,
      status: 'active',
      startDate: new Date('2023-06-01'),
      expectedCompletion: new Date('2025-12-31'),
      developerId: 'dev1',
      developerName: 'Prime Developers Ltd',
      revenue: 875000,
      isApproved: true
    },
    {
      id: '2',
      name: 'Sunset Gardens',
      description: 'Luxury villa community with golf course',
      location: 'Abuja, Nigeria',
      totalPlots: 75,
      totalSqm: 22500,
      pricePerSqm: 350,
      status: 'planning',
      startDate: new Date('2024-03-01'),
      expectedCompletion: new Date('2026-06-30'),
      developerId: 'dev2',
      developerName: 'Elite Properties',
      revenue: 0,
      isApproved: false
    },
    {
      id: '3',
      name: 'Ocean View Heights',
      description: 'Beachfront residential development',
      location: 'Calabar, Nigeria',
      totalPlots: 200,
      totalSqm: 60000,
      pricePerSqm: 400,
      status: 'completed',
      startDate: new Date('2022-01-01'),
      expectedCompletion: new Date('2024-01-01'),
      developerId: 'dev3',
      developerName: 'Coastal Developments',
      revenue: 2400000,
      isApproved: true
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'planning' | 'active' | 'completed' | 'paused'>('all')
  const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showProjectModal, setShowProjectModal] = useState(false)

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.developerName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus
    const matchesApproval = filterApproval === 'all' || 
                           (filterApproval === 'approved' && project.isApproved) ||
                           (filterApproval === 'pending' && !project.isApproved)
    
    return matchesSearch && matchesStatus && matchesApproval
  })

  const handleProjectAction = async (projectId: string, action: string) => {
    console.log(`Performing ${action} on project ${projectId}`)
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
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'planning':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'paused':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
          <p className="text-gray-600">Monitor land development projects and manage developer applications</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.status === 'active').length}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {projects.reduce((sum, p) => sum + p.totalPlots, 0)}
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
                {formatCurrency(projects.reduce((sum, p) => sum + p.revenue, 0))}
              </p>
            </div>
          </div>
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
                <p className="text-sm text-gray-600">{project.location}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusIcon(project.status)}
                  <span className="ml-1 capitalize">{project.status}</span>
                </span>
                {project.isApproved ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Developer:</span>
                <span className="font-medium text-gray-900">{project.developerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Plots:</span>
                <span className="font-medium text-gray-900">{project.totalPlots}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price/SQM:</span>
                <span className="font-medium text-gray-900">{formatCurrency(project.pricePerSqm)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Revenue:</span>
                <span className="font-medium text-gray-900">{formatCurrency(project.revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium text-gray-900">{formatDate(project.startDate)}</span>
              </div>
              {project.expectedCompletion && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expected Completion:</span>
                  <span className="font-medium text-gray-900">{formatDate(project.expectedCompletion)}</span>
                </div>
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
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleProjectAction(project.id, 'edit')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              <div className="flex space-x-2">
                {!project.isApproved && (
                  <button
                    onClick={() => handleProjectAction(project.id, 'approve')}
                    className="btn-success text-xs px-3 py-1"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleProjectAction(project.id, 'reject')}
                  className="btn-danger text-xs px-3 py-1"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">{selectedProject.name}</h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Project Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900">{selectedProject.description}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">{selectedProject.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Developer</label>
                      <p className="text-sm text-gray-900">{selectedProject.developerName}</p>
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Plots</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedProject.totalPlots}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total SQM</label>
                      <p className="text-lg font-semibold text-gray-900">{selectedProject.totalSqm.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price per SQM</label>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedProject.pricePerSqm)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Revenue</label>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedProject.revenue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline and Actions */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Project Timeline</h4>
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
                      <div className="flex items-center space-x-2">
                        {selectedProject.isApproved ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">Approved</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-yellow-600">Pending Approval</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Project Actions</h4>
                  <div className="space-y-3">
                    {!selectedProject.isApproved && (
                      <button
                        onClick={() => handleProjectAction(selectedProject.id, 'approve')}
                        className="w-full btn-success"
                      >
                        Approve Project
                      </button>
                    )}
                    <button
                      onClick={() => handleProjectAction(selectedProject.id, 'edit')}
                      className="w-full btn-secondary"
                    >
                      Edit Project
                    </button>
                    <button
                      onClick={() => handleProjectAction(selectedProject.id, 'view_plots')}
                      className="w-full btn-primary"
                    >
                      View Plots
                    </button>
                    {selectedProject.status !== 'completed' && (
                      <button
                        onClick={() => handleProjectAction(selectedProject.id, selectedProject.status === 'active' ? 'pause' : 'activate')}
                        className={`w-full ${selectedProject.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                      >
                        {selectedProject.status === 'active' ? 'Pause Project' : 'Activate Project'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
