import { useState } from 'react'
import { 
  Bell, 
  Send, 
  Users, 
  Mail,
  MessageSquare,
  Plus,
  X,
  Search,
  Clock,
  Megaphone,
  Trash2,
  Eye
} from 'lucide-react'
import { useUsers, useNotifications } from '../hooks/useFirebase'
import { addDoc, collection, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: 'announcement' | 'system' | 'promotion' | 'alert'
  targetAudience: 'all' | 'active' | 'investors' | 'specific'
  targetUserIds?: string[]
  status: 'draft' | 'sent' | 'scheduled'
  sentAt?: Date
  scheduledFor?: Date
  createdAt: Date
  createdBy: string
  readCount?: number
}

export default function Notifications() {
  const { data: users } = useUsers()
  const { data: notifications, loading } = useNotifications()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'announcement' | 'system' | 'promotion' | 'alert'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'scheduled'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [processing, setProcessing] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'announcement' as 'announcement' | 'system' | 'promotion' | 'alert',
    targetAudience: 'all' as 'all' | 'active' | 'investors' | 'specific',
    scheduledFor: ''
  })

  const safeUsers = Array.isArray(users) ? users : []
  const safeNotifications = Array.isArray(notifications) ? notifications : []

  const filteredNotifications = safeNotifications.filter((notif: any) => {
    const matchesSearch = (notif.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (notif.message || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || notif.type === filterType
    const matchesStatus = filterStatus === 'all' || notif.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'announcement': return 'bg-blue-100 text-blue-800'
      case 'system': return 'bg-gray-100 text-gray-800'
      case 'promotion': return 'bg-green-100 text-green-800'
      case 'alert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'sent': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateNotification = async (sendNow: boolean = false) => {
    if (!notificationForm.title || !notificationForm.message) {
      toast.error('Please fill in title and message')
      return
    }
    
    setProcessing(true)
    try {
      const notificationData: any = {
        title: notificationForm.title,
        message: notificationForm.message,
        type: notificationForm.type,
        targetAudience: notificationForm.targetAudience,
        targetUserIds: notificationForm.targetAudience === 'specific' ? selectedUsers : [],
        status: sendNow ? 'sent' : (notificationForm.scheduledFor ? 'scheduled' : 'draft'),
        createdAt: new Date(),
        createdBy: 'admin',
        readCount: 0
      }

      if (sendNow) {
        notificationData.sentAt = new Date()
      }

      if (notificationForm.scheduledFor) {
        notificationData.scheduledFor = new Date(notificationForm.scheduledFor)
      }

      await addDoc(collection(db, 'notifications'), notificationData)
      toast.success(sendNow ? 'Notification sent!' : 'Notification saved')
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      toast.error('Failed to create notification')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleSendNotification = async (notificationId: string) => {
    setProcessing(true)
    try {
      const docRef = doc(db, 'notifications', notificationId)
      await updateDoc(docRef, {
        status: 'sent',
        sentAt: new Date()
      })
      toast.success('Notification sent!')
    } catch (error) {
      toast.error('Failed to send notification')
      console.error(error)
    }
    setProcessing(false)
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return
    
    setProcessing(true)
    try {
      await deleteDoc(doc(db, 'notifications', notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
      console.error(error)
    }
    setProcessing(false)
  }

  const resetForm = () => {
    setNotificationForm({
      title: '',
      message: '',
      type: 'announcement',
      targetAudience: 'all',
      scheduledFor: ''
    })
    setSelectedUsers([])
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

  const getTargetCount = (audience: string, userIds?: string[]) => {
    switch (audience) {
      case 'all': return safeUsers.length
      case 'active': return safeUsers.filter((u: any) => u.status === 'active').length
      case 'investors': return safeUsers.filter((u: any) => (u as any).totalInvestments > 0).length
      case 'specific': return userIds?.length || 0
      default: return 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading notifications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Send notifications and announcements to users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Notification</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{safeNotifications.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeNotifications.filter((n: any) => n.status === 'sent').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeNotifications.filter((n: any) => n.status === 'draft').length}
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
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{safeUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setNotificationForm({
              ...notificationForm,
              type: 'announcement',
              title: 'New Announcement',
              message: ''
            })
            setShowCreateModal(true)
          }}
          className="card hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Megaphone className="h-8 w-8 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Send Announcement</p>
              <p className="text-sm text-gray-500">Broadcast to all users</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setNotificationForm({
              ...notificationForm,
              type: 'promotion',
              title: 'Special Offer',
              message: ''
            })
            setShowCreateModal(true)
          }}
          className="card hover:bg-green-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Promotional Message</p>
              <p className="text-sm text-gray-500">Send offers & promotions</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setNotificationForm({
              ...notificationForm,
              type: 'alert',
              title: 'Important Alert',
              message: ''
            })
            setShowCreateModal(true)
          }}
          className="card hover:bg-red-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-8 w-8 text-red-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">System Alert</p>
              <p className="text-sm text-gray-500">Urgent notifications</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select
              className="input-field"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">All Types</option>
              <option value="announcement">Announcements</option>
              <option value="system">System</option>
              <option value="promotion">Promotions</option>
              <option value="alert">Alerts</option>
            </select>
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="draft">Drafts</option>
              <option value="sent">Sent</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNotifications.map((notif: any) => (
                <tr key={notif.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{notif.message}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(notif.type)}`}>
                      {notif.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {notif.targetAudience === 'all' ? 'All Users' :
                     notif.targetAudience === 'active' ? 'Active Users' :
                     notif.targetAudience === 'investors' ? 'Investors' :
                     `${notif.targetUserIds?.length || 0} Users`}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(notif.status)}`}>
                      {notif.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {formatDate(notif.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedNotification(notif)
                          setShowPreviewModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {notif.status === 'draft' && (
                        <button
                          onClick={() => handleSendNotification(notif.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Send Now"
                          disabled={processing}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notif.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                        disabled={processing}
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

        {filteredNotifications.length === 0 && (
          <div className="text-center py-8">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first notification to get started.</p>
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Notification</h3>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Notification Type</label>
                <select
                  className="input-field mt-1"
                  value={notificationForm.type}
                  onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value as any})}
                >
                  <option value="announcement">📢 Announcement</option>
                  <option value="promotion">🎁 Promotion</option>
                  <option value="system">⚙️ System</option>
                  <option value="alert">🚨 Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input
                  type="text"
                  className="input-field mt-1"
                  placeholder="Notification title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Message *</label>
                <textarea
                  className="input-field mt-1"
                  rows={4}
                  placeholder="Write your notification message..."
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                <select
                  className="input-field mt-1"
                  value={notificationForm.targetAudience}
                  onChange={(e) => setNotificationForm({...notificationForm, targetAudience: e.target.value as any})}
                >
                  <option value="all">All Users ({safeUsers.length})</option>
                  <option value="active">Active Users Only</option>
                  <option value="investors">Investors Only</option>
                  <option value="specific">Specific Users</option>
                </select>
              </div>

              {notificationForm.targetAudience === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Users</label>
                  <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg">
                    {safeUsers.map((user: any) => (
                      <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 mr-2"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id])
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                            }
                          }}
                        />
                        <span className="text-sm">{user.full_name || user.email}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{selectedUsers.length} users selected</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  className="input-field mt-1"
                  value={notificationForm.scheduledFor}
                  onChange={(e) => setNotificationForm({...notificationForm, scheduledFor: e.target.value})}
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  This notification will be sent to <strong>{getTargetCount(notificationForm.targetAudience, selectedUsers)}</strong> users.
                </p>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={() => handleCreateNotification(true)}
                  className="btn-primary flex-1"
                  disabled={processing}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {processing ? 'Sending...' : 'Send Now'}
                </button>
                <button
                  onClick={() => handleCreateNotification(false)}
                  className="btn-secondary flex-1"
                  disabled={processing}
                >
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[450px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notification Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedNotification.type === 'announcement' ? 'bg-blue-100' :
                    selectedNotification.type === 'promotion' ? 'bg-green-100' :
                    selectedNotification.type === 'alert' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}>
                    <Bell className={`h-5 w-5 ${
                      selectedNotification.type === 'announcement' ? 'text-blue-600' :
                      selectedNotification.type === 'promotion' ? 'text-green-600' :
                      selectedNotification.type === 'alert' ? 'text-red-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedNotification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{selectedNotification.message}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(selectedNotification.type)}`}>
                    {selectedNotification.type}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedNotification.status)}`}>
                    {selectedNotification.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500">Target</p>
                  <p className="font-medium">{selectedNotification.targetAudience}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(selectedNotification.createdAt)}</p>
                </div>
              </div>

              {selectedNotification.status === 'draft' && (
                <button
                  onClick={() => {
                    handleSendNotification(selectedNotification.id)
                    setShowPreviewModal(false)
                  }}
                  className="w-full btn-primary"
                  disabled={processing}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

