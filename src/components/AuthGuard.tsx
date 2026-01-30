import { useEffect, useState } from 'react'
import { User, onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import LoginForm from './LoginForm'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
    return <LoginForm />
  }

  // Additional security check - only allow specific admin email
  if (user.email !== 'subx@focalpointdev.com') {
    // Sign out unauthorized user
    signOut(auth)
    return <LoginForm />
  }

  // Layout handles the application chrome (sidebar/topbar). AuthGuard only gates access.
  return <>{children}</>
}
