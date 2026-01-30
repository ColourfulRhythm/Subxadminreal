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
  Layout as PageBuilderIcon,
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
  { name: 'Landing Page Builder', href: '/landing-pages', icon: PageBuilderIcon },
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

  const getInitials = (email?: string | null) => (email?.charAt(0).toUpperCase() || 'A')

  return (
    <div className="min-h-screen bg-x-bg text-x-text">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-x-panel/95 backdrop-blur border-b border-white/10">
        <div className="flex h-14 items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-600/40 rounded-lg p-2 -ml-2"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary-600/15 border border-primary-600/25 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-100">S</span>
            </div>
            <h1 className="text-sm font-semibold tracking-wide">SUBX ADMIN</h1>
          </div>
          <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-sm font-semibold">{getInitials(user?.email)}</span>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-x-panel border-r border-white/10 shadow-2xl">
          <div className="flex h-14 items-center justify-between px-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary-600/15 border border-primary-600/25 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-100">S</span>
              </div>
              <div>
                <p className="text-xs text-white/50 leading-none">Admin</p>
                <p className="text-sm font-semibold leading-none">Subx Console</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors border ${
                    isActive
                      ? 'bg-primary-600/15 text-primary-100 border-primary-600/25'
                      : 'text-white/80 hover:bg-white/5 border-transparent'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary-200' : 'text-white/60 group-hover:text-white/80'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/10 p-4 space-y-3">
            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-sm font-semibold">{getInitials(user.email)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.email}</p>
                  <p className="text-xs text-white/50">Administrator</p>
                </div>
              </div>
            )}
            <button className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5 rounded-xl transition-colors">
              <Settings className="mr-3 h-5 w-5 text-white/60" />
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-red-300 hover:bg-danger-600/10 rounded-xl transition-colors border border-danger-600/20"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-x-panel border-r border-white/10">
          <div className="flex h-16 items-center px-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary-600/15 border border-primary-600/25 flex items-center justify-center">
                <span className="text-sm font-bold text-primary-100">S</span>
              </div>
              <div className="leading-tight">
                <p className="text-[11px] text-white/50 tracking-wide">ADMIN</p>
                <p className="text-sm font-semibold">Subx Console</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors border ${
                    isActive
                      ? 'bg-primary-600/15 text-primary-100 border-primary-600/25'
                      : 'text-white/80 hover:bg-white/5 border-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary-200' : 'text-white/60 group-hover:text-white/80'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-white/10 p-4 space-y-3">
            {user && (
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="text-sm font-semibold">{getInitials(user.email)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{user.email}</p>
                  <p className="text-xs text-white/50">Administrator</p>
                </div>
              </div>
            )}
            <button className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5 rounded-xl transition-colors">
              <Settings className="mr-3 h-5 w-5 text-white/60" />
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2.5 text-sm font-semibold text-red-300 hover:bg-danger-600/10 rounded-xl transition-colors border border-danger-600/20"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Desktop topbar */}
        <div className="hidden lg:block sticky top-0 z-30 bg-x-bg/70 backdrop-blur border-b border-white/10">
          <div className="h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-white/70" />
              </div>
              <div className="leading-tight">
                <p className="text-xs text-white/50">Control Center</p>
                <p className="text-sm font-semibold">Operations Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user?.email && (
                <div className="hidden xl:flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <div className="h-8 w-8 rounded-xl bg-primary-600/15 border border-primary-600/25 flex items-center justify-center">
                    <span className="text-sm font-semibold">{getInitials(user.email)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate max-w-[260px]">{user.email}</p>
                    <p className="text-xs text-white/50">Admin</p>
                  </div>
                </div>
              )}
              <button className="btn-ghost flex items-center gap-2 border border-white/10">
                <Settings className="h-4 w-4 text-white/70" />
                <span className="text-sm">Settings</span>
              </button>
              <button onClick={handleLogout} className="btn-secondary flex items-center gap-2 border-danger-600/20 text-red-300">
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
        {/* Page content */}
        <main className="pt-16 lg:pt-6 p-4 sm:p-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>
    </div>
  )
}
