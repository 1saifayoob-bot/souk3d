import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// The admin panel (and its charting library) used to be imported statically,
// which meant every shopper downloaded the whole back office before a single
// product could load. It is now a separate chunk, fetched only on /admin.
const AdminApp = lazy(() => import('./admin/index.jsx'))

const isAdmin = window.location.pathname.startsWith('/admin')

const AdminLoading = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#FBF7F0', color: '#8A7A6A', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14
  }}>
    Loading admin...
  </div>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? (
      <Suspense fallback={<AdminLoading />}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
)
