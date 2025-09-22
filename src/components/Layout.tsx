import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  MapPin, 
  TrendingUp, 
  DollarSign, 
  Users2, 
  DollarSign as PricingIcon,
  X,
  LogOut,
  Settings,
  Database,
  Menu
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard Overview', href: '/', icon: LayoutDashboard },
  { name: 'User Management', href: '/users', icon: Users },
  { name: 'Project Management', href: '/projects', icon: Building2 },
  { name: 'Plot Management', href: '/plots', icon: MapPin },
  { name: 'Investment Requests', href: '/investments', icon: TrendingUp },
  { name: 'Withdrawal Management', href: '/withdrawals', icon: DollarSign },
  { name: 'Referral Analytics', href: '/referrals', icon: Users2 },
  { name: 'Pricing Management', href: '/pricing', icon: PricingIcon },
  { name: 'Firebase Test', href: '/firebase-test', icon: Database },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const location = useLocation()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setSidebarOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header with hamburger menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Subx Admin</h1>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Subx Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            {/* User info */}
            {user && (
              <div className="flex items-center mb-4 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              </div>
            )}
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white shadow-lg">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Subx Admin</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="mr-3 h-5 w-5" />
              Settings
            </button>
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2">
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Page content */}
        <main className="pt-16 lg:pt-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
