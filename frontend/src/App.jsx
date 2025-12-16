import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { DateFormatProvider } from './contexts/DateFormatContext'
import Header from './components/layout/Header'
import Home from './pages/Home'
import CardDetails from './pages/CardDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import ModDashboard from './pages/ModDashboard'
import Settings from './pages/Settings'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DateFormatProvider>
          <AuthProvider>
            <SocketProvider>
              <Router>
                <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
                  <Header />
                  <main className="flex-1 container mx-auto px-4 py-8">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/card/:cardId" element={<CardDetails />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/admin" element={<ModDashboard />} />
                      <Route path="/mod" element={<ModDashboard />} />
                    </Routes>                  </main>
                </div>
              </Router>
            </SocketProvider>
          </AuthProvider>
        </DateFormatProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
