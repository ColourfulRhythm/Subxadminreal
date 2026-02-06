import { useEffect, useState } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import SubAdminLoginForm from './SubAdminLoginForm'

interface SubAdminAuthGuardProps {
  children: React.ReactNode
}

export default function SubAdminAuthGuard({ children }: SubAdminAuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <SubAdminLoginForm />
  }

  // Prevent main admin from accessing subadmin page
  const mainAdminEmail = 'subx@focalpointdev.com'
  if (user.email?.toLowerCase() === mainAdminEmail.toLowerCase()) {
    signOut(auth)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium text-red-800 mb-2">Access Denied</h3>
            <p className="text-sm text-red-700 mb-4">
              Main admin credentials cannot access the subadmin dashboard. Please use the main admin login.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-primary text-sm"
            >
              Go to Main Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop top bar with user info and logout */}
      <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">SubAdmin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">SubAdmin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pt-0">
        {children}
      </div>
    </div>
  )
}

