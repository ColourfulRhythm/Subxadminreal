import { useState, useEffect } from 'react'
import { testFirebaseCollections } from '../utils/firebaseTest'
import { inspectFirebaseData } from '../utils/inspectFirebaseData'
import { Loader2, Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function FirebaseTest() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runTest = async () => {
    setLoading(true)
    setError('')
    try {
      const testResults = await testFirebaseCollections()
      const dataStructure = await inspectFirebaseData()
      setResults({ ...testResults, dataStructure })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTest()
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Firebase Connection Test</h1>
        <p className="text-gray-600">Testing connection to subx-825e9 Firebase project</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-700">Testing Firebase collections...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-700 font-medium">Connection Error</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(results).map(([collectionName, result]: [string, any]) => (
              <div key={collectionName} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="font-medium text-gray-900 capitalize">
                      {collectionName.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                  </div>
                  {result.error ? (
                    <XCircle className="h-5 w-5 text-red-400" />
                  ) : result.exists ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  )}
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  {result.error ? (
                    <p className="text-red-600">Error: {result.error}</p>
                  ) : (
                    <>
                      <p><strong>Status:</strong> {result.exists ? 'Found' : 'Empty'}</p>
                      <p><strong>Documents:</strong> {result.count || 0}</p>
                    </>
                  )}
                </div>

                {result.documents && result.documents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Sample Document:</p>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.documents[0], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Summary</h3>
            <div className="text-sm text-blue-700">
              <p>✅ Collections with data: {Object.values(results).filter((r: any) => r.exists && !r.error).length}</p>
              <p>⚠️ Empty collections: {Object.values(results).filter((r: any) => !r.exists && !r.error).length}</p>
              <p>❌ Error collections: {Object.values(results).filter((r: any) => r.error).length}</p>
            </div>
          </div>

          {results.dataStructure && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-4">Actual Data Structure</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(results.dataStructure).map(([collectionName, data]: [string, any]) => (
                  <div key={collectionName} className="bg-white rounded-lg border border-green-200 p-3">
                    <h4 className="font-medium text-green-800 mb-2 capitalize">
                      {collectionName.replace('_', ' ')} ({data.count} docs)
                    </h4>
                    <div className="text-xs text-green-700 mb-2">
                      <strong>Fields:</strong> {data.fields?.join(', ') || 'No fields'}
                    </div>
                    {data.sample && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-green-600 hover:text-green-800">
                          View Sample Data
                        </summary>
                        <pre className="mt-2 bg-gray-50 p-2 rounded overflow-auto max-h-32 text-xs">
                          {JSON.stringify(data.sample, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={runTest}
          disabled={loading}
          className="btn-primary px-6 py-2"
        >
          {loading ? 'Testing...' : 'Re-test Collections'}
        </button>
      </div>
    </div>
  )
}
