import { useState, useEffect } from 'react'
import { 
  Settings as SettingsIcon,
  Save,
  Users,
  Shield,
  DollarSign,
  Percent,
  Clock,
  FileText,
  Plus,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import toast from 'react-hot-toast'

interface PlatformSettings {
  commissionRate: number
  minInvestment: number
  maxInvestment: number
  referralBonusRate: number
  withdrawalMinimum: number
  withdrawalProcessingDays: number
  maintenanceMode: boolean
  allowNewRegistrations: boolean
}

interface AdminUser {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'moderator'
  createdAt: Date
  lastLogin?: Date
  isActive: boolean
}

interface AuditLog {
  id: string
  action: string
  userId: string
  userName: string
  details: string
  timestamp: Date
  ipAddress?: string
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'platform' | 'admins' | 'audit'>('platform')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Platform Settings
  const [settings, setSettings] = useState<PlatformSettings>({
    commissionRate: 5,
    minInvestment: 10000,
    maxInvestment: 100000000,
    referralBonusRate: 5,
    withdrawalMinimum: 5000,
    withdrawalProcessingDays: 3,
    maintenanceMode: false,
    allowNewRegistrations: true
  })

  // Admin Users
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [adminForm, setAdminForm] = useState({
    email: '',
    name: '',
    role: 'admin' as 'super_admin' | 'admin' | 'moderator',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditFilter, setAuditFilter] = useState<'all' | 'user' | 'investment' | 'withdrawal' | 'settings'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load platform settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'platform'))
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as PlatformSettings)
      }

      // Load admin users
      const adminsSnapshot = await getDocs(collection(db, 'admin_users'))
      const admins: AdminUser[] = []
      adminsSnapshot.forEach(doc => {
        admins.push({ id: doc.id, ...doc.data() } as AdminUser)
      })
      setAdminUsers(admins)

      // Load audit logs
      const logsSnapshot = await getDocs(collection(db, 'audit_logs'))
      const logs: AuditLog[] = []
      logsSnapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() } as AuditLog)
      })
      setAuditLogs(logs.sort((a, b) => {
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date((a.timestamp as any)?.toDate?.() || a.timestamp)
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date((b.timestamp as any)?.toDate?.() || b.timestamp)
        return dateB.getTime() - dateA.getTime()
      }))
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    }
    setLoading(false)
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'platform'), {
        ...settings,
        updatedAt: new Date(),
        updatedBy: 'admin'
      })

      // Log the action
      await addDoc(collection(db, 'audit_logs'), {
        action: 'settings_update',
        userId: 'admin',
        userName: 'Admin',
        details: 'Platform settings updated',
        timestamp: new Date()
      })

      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
      console.error(error)
    }
    setSaving(false)
  }

  const handleAddAdmin = async () => {
    if (!adminForm.email || !adminForm.name) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, 'admin_users'), {
        email: adminForm.email,
        name: adminForm.name,
        role: adminForm.role,
        createdAt: new Date(),
        isActive: true
      })

      // Log the action
      await addDoc(collection(db, 'audit_logs'), {
        action: 'admin_added',
        userId: 'admin',
        userName: 'Admin',
        details: `Added new admin: ${adminForm.email}`,
        timestamp: new Date()
      })

      toast.success('Admin user added')
      setShowAddAdminModal(false)
      setAdminForm({ email: '', name: '', role: 'admin', password: '' })
      loadData()
    } catch (error) {
      toast.error('Failed to add admin')
      console.error(error)
    }
    setSaving(false)
  }

  const handleToggleAdmin = async (adminId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, 'admin_users', adminId), {
        isActive: !isActive,
        updatedAt: new Date()
      })
      toast.success(isActive ? 'Admin deactivated' : 'Admin activated')
      loadData()
    } catch (error) {
      toast.error('Failed to update admin')
      console.error(error)
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return

    try {
      await deleteDoc(doc(db, 'admin_users', adminId))
      toast.success('Admin deleted')
      loadData()
    } catch (error) {
      toast.error('Failed to delete admin')
      console.error(error)
    }
  }

  const formatDate = (date: any) => {
    if (!date) return 'N/A'
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    const dateObj = new Date(date)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    return 'Invalid Date'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-blue-100 text-blue-800'
      case 'moderator': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <Users className="h-4 w-4" />
    if (action.includes('investment')) return <DollarSign className="h-4 w-4" />
    if (action.includes('withdrawal')) return <DollarSign className="h-4 w-4" />
    if (action.includes('settings')) return <SettingsIcon className="h-4 w-4" />
    if (action.includes('admin')) return <Shield className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure platform settings and manage admin users</p>
        </div>
        <button
          onClick={loadData}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('platform')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'platform'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SettingsIcon className="h-4 w-4 inline mr-2" />
            Platform Settings
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'admins'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Admin Users
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Audit Log
          </button>
        </nav>
      </div>

      {/* Platform Settings Tab */}
      {activeTab === 'platform' && (
        <div className="space-y-6">
          {/* Status Toggles */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {settings.maintenanceMode ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Maintenance Mode</p>
                    <p className="text-sm text-gray-500">Disable user access temporarily</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">New Registrations</p>
                    <p className="text-sm text-gray-500">Allow new user signups</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.allowNewRegistrations}
                    onChange={(e) => setSettings({...settings, allowNewRegistrations: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Investment Settings */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Investment Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Platform Commission Rate (%)</label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    className="input-field pr-10"
                    value={settings.commissionRate}
                    onChange={(e) => setSettings({...settings, commissionRate: Number(e.target.value)})}
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Referral Bonus Rate (%)</label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    className="input-field pr-10"
                    value={settings.referralBonusRate}
                    onChange={(e) => setSettings({...settings, referralBonusRate: Number(e.target.value)})}
                  />
                  <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Investment (₦)</label>
                <input
                  type="number"
                  className="input-field mt-1"
                  value={settings.minInvestment}
                  onChange={(e) => setSettings({...settings, minInvestment: Number(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(settings.minInvestment)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Investment (₦)</label>
                <input
                  type="number"
                  className="input-field mt-1"
                  value={settings.maxInvestment}
                  onChange={(e) => setSettings({...settings, maxInvestment: Number(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(settings.maxInvestment)}</p>
              </div>
            </div>
          </div>

          {/* Withdrawal Settings */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Withdrawal Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Withdrawal (₦)</label>
                <input
                  type="number"
                  className="input-field mt-1"
                  value={settings.withdrawalMinimum}
                  onChange={(e) => setSettings({...settings, withdrawalMinimum: Number(e.target.value)})}
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(settings.withdrawalMinimum)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Processing Time (Days)</label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    className="input-field pr-10"
                    value={settings.withdrawalProcessingDays}
                    onChange={(e) => setSettings({...settings, withdrawalProcessingDays: Number(e.target.value)})}
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="btn-primary flex items-center space-x-2"
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Users Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Admin Users</h3>
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Admin</span>
            </button>
          </div>

          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminUsers.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(admin.role)}`}>
                          {admin.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(admin.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {admin.lastLogin ? formatDate(admin.lastLogin) : 'Never'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleAdmin(admin.id, admin.isActive)}
                            className={admin.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}
                            title={admin.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {admin.isActive ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {adminUsers.length === 0 && (
              <div className="text-center py-8">
                <Shield className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No admin users</h3>
                <p className="mt-1 text-sm text-gray-500">Add your first admin user to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Audit Log</h3>
            <select
              className="input-field w-40"
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value as any)}
            >
              <option value="all">All Actions</option>
              <option value="user">User Actions</option>
              <option value="investment">Investments</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          <div className="card">
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {auditLogs
                .filter(log => auditFilter === 'all' || log.action.includes(auditFilter))
                .map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                      <p className="text-xs text-gray-400 mt-1">By: {log.userName}</p>
                    </div>
                  </div>
                ))}
            </div>

            {auditLogs.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs</h3>
                <p className="mt-1 text-sm text-gray-500">Actions will be logged here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[450px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Admin User</h3>
              <button onClick={() => setShowAddAdminModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  className="input-field mt-1"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  className="input-field mt-1"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  className="input-field mt-1"
                  value={adminForm.role}
                  onChange={(e) => setAdminForm({...adminForm, role: e.target.value as any})}
                >
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-10"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={handleAddAdmin}
                  className="btn-primary flex-1"
                  disabled={saving}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {saving ? 'Adding...' : 'Add Admin'}
                </button>
                <button
                  onClick={() => setShowAddAdminModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

