import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import ProjectManagement from './pages/ProjectManagement'
import PlotManagement from './pages/PlotManagement'
import InvestmentRequests from './pages/InvestmentRequests'
import WithdrawalManagement from './pages/WithdrawalManagement'
import ReferralAnalytics from './pages/ReferralAnalytics'
import PricingManagement from './pages/PricingManagement'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/projects" element={<ProjectManagement />} />
            <Route path="/plots" element={<PlotManagement />} />
            <Route path="/investments" element={<InvestmentRequests />} />
            <Route path="/withdrawals" element={<WithdrawalManagement />} />
            <Route path="/referrals" element={<ReferralAnalytics />} />
            <Route path="/pricing" element={<PricingManagement />} />
          </Routes>
        </Layout>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
