import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import Header from './components/layout/Header'
import Home from './pages/Home'
import CardDetails from './pages/CardDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/card/:cardId" element={<CardDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
