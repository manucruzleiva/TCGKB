import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { DateFormatProvider } from './contexts/DateFormatContext'
import { ConnectivityProvider } from './contexts/ConnectivityContext'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import OfflineBanner from './components/common/OfflineBanner'
import InstallPrompt from './components/common/InstallPrompt'
import Home from './pages/Home'
import CardDetails from './pages/CardDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import ModDashboard from './pages/ModDashboard'
import Settings from './pages/Settings'
import Roadmap from './pages/Roadmap'
import RelationshipMap from './pages/RelationshipMap'
import Catalog from './pages/Catalog'
import UserActivity from './pages/UserActivity'
import DevDashboard from './pages/BugReports'
import DeckList from './pages/DeckList'
import DeckBuilder from './pages/DeckBuilder'
import DeckDetail from './pages/DeckDetail'
import Artists from './pages/Artists'
import ArtistDetail from './pages/ArtistDetail'
import Support from './pages/Support'
import BugReportButton from './components/common/BugReportButton'

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
                      <Route path="/user/:username" element={<UserActivity />} />
                      <Route path="/dev" element={<DevDashboard />} />
                      <Route path="/roadmap" element={<Roadmap />} />
                      <Route path="/relationship-map" element={<RelationshipMap />} />
                      <Route path="/catalog" element={<Catalog />} />
                      <Route path="/artists" element={<Artists />} />
                      <Route path="/artist/:artistName" element={<ArtistDetail />} />
                      <Route path="/decks" element={<DeckList />} />
                      <Route path="/decks/new" element={<DeckBuilder />} />
                      <Route path="/decks/:deckId" element={<DeckDetail />} />
                      <Route path="/decks/:deckId/edit" element={<DeckBuilder />} />
                      <Route path="/support" element={<Support />} />
                    </Routes>
                  </main>
                  <BugReportButton />
                  <Footer />
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
