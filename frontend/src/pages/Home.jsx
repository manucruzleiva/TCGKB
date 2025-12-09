import { useState } from 'react'
import CardSearch from '../components/cards/CardSearch'
import CardGrid from '../components/cards/CardGrid'

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (term) => {
    setSearchTerm(term)
    setIsSearching(true)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pokemon TCG Knowledge Base</h1>
        <p className="text-gray-600">
          Busca, explora y comenta sobre tus cartas favoritas de Pokemon TCG
        </p>
      </div>

      <CardSearch onSearch={handleSearch} loading={isSearching} />

      <CardGrid searchTerm={searchTerm} />
    </div>
  )
}

export default Home
