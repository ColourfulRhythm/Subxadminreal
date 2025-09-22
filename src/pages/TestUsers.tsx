import { useState } from 'react'

export default function TestUsers() {
  const [testData] = useState([
    { id: '1', name: 'Test User 1', email: 'test1@example.com' },
    { id: '2', name: 'Test User 2', email: 'test2@example.com' }
  ])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Users Page</h1>
      <p className="mb-4">This is a simple test to see if routing works.</p>
      
      <div className="space-y-2">
        {testData.map(user => (
          <div key={user.id} className="p-3 bg-gray-100 rounded">
            <strong>{user.name}</strong> - {user.email}
          </div>
        ))}
      </div>
      
      <p className="mt-4 text-sm text-gray-600">
        If you can see this, the routing is working. The issue is likely in the UserManagement component.
      </p>
    </div>
  )
}
