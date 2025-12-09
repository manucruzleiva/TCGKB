import { useState } from 'react'
import Input from '../common/Input'

const CardSearch = ({ onSearch, loading }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  const handleChange = (e) => {
    setSearchTerm(e.target.value)
  }

  return (
    <form onSubmit={handleSearch} className="mb-8">
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            type="text"
            name="search"
            value={searchTerm}
            onChange={handleChange}
            placeholder="Buscar cartas por nombre... (ej: Pikachu, Charizard)"
            className="mb-0"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-8"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        {searchTerm ? `Buscando: "${searchTerm}"` : 'Mostrando las cartas más recientes'}
      </p>
    </form>
  )
}

export default CardSearch
