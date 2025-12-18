import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import Spinner from '../components/common/Spinner'

// Force-directed graph layout constants
const REPULSION = 5000
const ATTRACTION = 0.01
const DAMPING = 0.8
const MIN_DISTANCE = 100

const RelationshipMap = () => {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nodes, setNodes] = useState([])
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [tcgFilter, setTcgFilter] = useState('all') // 'all' | 'pokemon' | 'riftbound'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/stats/relationship-map')
      if (response.data.success) {
        setData(response.data.data)
        initializeLayout(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching relationship map:', err)
      setError(language === 'es' ? 'Error al cargar el mapa' : 'Error loading map')
    } finally {
      setLoading(false)
    }
  }

  // Initialize node positions in a circular layout
  const initializeLayout = (mapData) => {
    if (!mapData?.nodes?.length) return

    const width = 800
    const height = 600
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.35

    const initialNodes = mapData.nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / mapData.nodes.length
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0
      }
    })

    setNodes(initialNodes)
    simulateForces(initialNodes, mapData.edges)
  }

  // Simple force-directed simulation
  const simulateForces = (initialNodes, edges) => {
    let currentNodes = [...initialNodes]
    const iterations = 100

    for (let iter = 0; iter < iterations; iter++) {
      currentNodes = currentNodes.map((node, i) => {
        let fx = 0
        let fy = 0

        // Repulsion from other nodes
        currentNodes.forEach((other, j) => {
          if (i === j) return
          const dx = node.x - other.x
          const dy = node.y - other.y
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DISTANCE)
          const force = REPULSION / (dist * dist)
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        })

        // Attraction along edges
        edges.forEach(edge => {
          let other = null
          if (edge.source === node.id) {
            other = currentNodes.find(n => n.id === edge.target)
          } else if (edge.target === node.id) {
            other = currentNodes.find(n => n.id === edge.source)
          }
          if (other) {
            const dx = other.x - node.x
            const dy = other.y - node.y
            fx += dx * ATTRACTION
            fy += dy * ATTRACTION
          }
        })

        // Center gravity
        fx += (400 - node.x) * 0.001
        fy += (300 - node.y) * 0.001

        return {
          ...node,
          vx: (node.vx + fx) * DAMPING,
          vy: (node.vy + fy) * DAMPING
        }
      })

      // Apply velocities
      currentNodes = currentNodes.map(node => ({
        ...node,
        x: node.x + node.vx,
        y: node.y + node.vy
      }))
    }

    setNodes(currentNodes)
  }

  // Get filtered nodes and edges based on TCG filter
  const getFilteredData = useCallback(() => {
    if (!data || !nodes.length) return { filteredNodes: [], filteredEdges: [] }

    let filteredNodes = nodes
    if (tcgFilter !== 'all') {
      filteredNodes = nodes.filter(n => n.tcgSystem === tcgFilter)
    }

    const nodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredEdges = data.edges.filter(e =>
      nodeIds.has(e.source) && nodeIds.has(e.target)
    )

    return { filteredNodes, filteredEdges }
  }, [data, nodes, tcgFilter])

  // Zoom handlers
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const scaleChange = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.2, Math.min(3, transform.scale * scaleChange))

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setTransform(prev => ({
      scale: newScale,
      x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
      y: mouseY - (mouseY - prev.y) * (newScale / prev.scale)
    }))
  }, [transform.scale])

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg' || e.target.tagName === 'rect') {
      setIsDragging(true)
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y })
      setSelectedEdge(null)
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Reset view
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 })
    setSelectedEdge(null)
  }

  // Get edge color based on mention type
  const getEdgeColor = (type) => {
    switch (type) {
      case 'attack': return '#ef4444'
      case 'ability': return '#a855f7'
      default: return '#3b82f6'
    }
  }

  // Handle edge click
  const handleEdgeClick = (e, edge) => {
    e.stopPropagation()
    setSelectedEdge(edge)
  }

  const { filteredNodes, filteredEdges } = getFilteredData()

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-gray-900">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-900 relative overflow-hidden">
      {error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-900/50 text-red-400 p-6 rounded-lg">
            {error}
          </div>
        </div>
      ) : !data?.nodes?.length ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">
              {language === 'es' ? 'Sin datos aun' : 'No data yet'}
            </h2>
            <p className="text-gray-400">
              {language === 'es'
                ? 'Comienza a comentar cartas y mencionar otras con @ para ver conexiones'
                : 'Start commenting on cards and mentioning others with @ to see connections'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Full-screen Canvas */}
          <svg
            ref={svgRef}
            className="flex-1 w-full"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {/* Background */}
            <rect width="100%" height="100%" fill="#111827" />

            {/* Grid pattern */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1f2937" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Transform group */}
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              {/* Edges */}
              {filteredEdges.map((edge, i) => {
                const sourceNode = filteredNodes.find(n => n.id === edge.source)
                const targetNode = filteredNodes.find(n => n.id === edge.target)
                if (!sourceNode || !targetNode) return null

                const isSelected = selectedEdge?.source === edge.source && selectedEdge?.target === edge.target

                return (
                  <g key={i}>
                    {/* Clickable wider line */}
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke="transparent"
                      strokeWidth={15}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => handleEdgeClick(e, edge)}
                    />
                    {/* Visible line */}
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={getEdgeColor(edge.mentionType)}
                      strokeWidth={isSelected ? 4 : 2}
                      strokeOpacity={isSelected ? 1 : 0.6}
                      style={{ pointerEvents: 'none' }}
                    />
                  </g>
                )
              })}

              {/* Nodes */}
              {filteredNodes.map(node => (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => navigate(`/card/${node.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Node circle */}
                  <circle
                    r={node.commentCount > 0 ? 25 : 20}
                    fill={node.tcgSystem === 'pokemon' ? '#f59e0b' : '#8b5cf6'}
                    stroke={hoveredNode?.id === node.id ? '#fff' : 'transparent'}
                    strokeWidth={3}
                  />
                  {node.image && (
                    <clipPath id={`clip-${node.id}`}>
                      <circle r={node.commentCount > 0 ? 22 : 17} />
                    </clipPath>
                  )}
                  {node.image && (
                    <image
                      href={node.image}
                      x={node.commentCount > 0 ? -22 : -17}
                      y={node.commentCount > 0 ? -22 : -17}
                      width={node.commentCount > 0 ? 44 : 34}
                      height={node.commentCount > 0 ? 44 : 34}
                      clipPath={`url(#clip-${node.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  )}
                  {/* Comment count badge */}
                  {node.commentCount > 0 && (
                    <>
                      <circle cx={18} cy={-18} r={10} fill="#ef4444" />
                      <text x={18} y={-14} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                        {node.commentCount}
                      </text>
                    </>
                  )}
                </g>
              ))}
            </g>
          </svg>

          {/* Floating Controls Panel - Top Left */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {/* TCG Filter Buttons */}
            <div className="bg-gray-800/90 backdrop-blur rounded-lg p-2 flex gap-2">
              <button
                onClick={() => setTcgFilter('all')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  tcgFilter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={language === 'es' ? 'Todos' : 'All'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => setTcgFilter('pokemon')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  tcgFilter === 'pokemon'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Pokemon"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                  <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </button>
              <button
                onClick={() => setTcgFilter('riftbound')}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  tcgFilter === 'riftbound'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Riftbound"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="bg-gray-800/90 backdrop-blur rounded-lg p-2 flex flex-col gap-1">
              <button
                onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
                className="w-10 h-10 rounded-lg bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
              <button
                onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.2, prev.scale * 0.8) }))}
                className="w-10 h-10 rounded-lg bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center text-xl font-bold"
              >
                −
              </button>
              <button
                onClick={resetView}
                className="w-10 h-10 rounded-lg bg-gray-700 text-white hover:bg-gray-600 flex items-center justify-center"
                title={language === 'es' ? 'Restablecer' : 'Reset'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Panel - Top Right */}
          <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur rounded-lg p-3">
            <div className="text-sm text-gray-300">
              <p><span className="text-white font-bold">{filteredNodes.length}</span> {language === 'es' ? 'cartas' : 'cards'}</p>
              <p><span className="text-white font-bold">{filteredEdges.length}</span> {language === 'es' ? 'conexiones' : 'connections'}</p>
              <p className="text-xs text-gray-500 mt-1">{Math.round(transform.scale * 100)}%</p>
            </div>
          </div>

          {/* Legend - Bottom Left */}
          <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg p-3">
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500 rounded" />
                <span className="text-gray-300">{language === 'es' ? 'Carta' : 'Card'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500 rounded" />
                <span className="text-gray-300">{language === 'es' ? 'Ataque' : 'Attack'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-purple-500 rounded" />
                <span className="text-gray-300">{language === 'es' ? 'Habilidad' : 'Ability'}</span>
              </div>
            </div>
          </div>

          {/* Hovered Node Tooltip - Bottom Center */}
          {hoveredNode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-800/95 backdrop-blur rounded-lg p-3 shadow-xl border border-gray-700">
              <div className="flex items-center gap-3">
                {hoveredNode.image && (
                  <img src={hoveredNode.image} alt={hoveredNode.name} className="w-16 h-20 object-cover rounded" />
                )}
                <div>
                  <p className="font-semibold text-white">{hoveredNode.name}</p>
                  <p className="text-xs text-gray-400">{hoveredNode.set}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      hoveredNode.tcgSystem === 'pokemon'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {hoveredNode.tcgSystem}
                    </span>
                    <span className="text-xs text-primary-400">
                      {hoveredNode.commentCount} {language === 'es' ? 'comentarios' : 'comments'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Edge Panel - Right Side */}
          {selectedEdge && (
            <div className="absolute top-1/2 right-4 -translate-y-1/2 bg-gray-800/95 backdrop-blur rounded-lg p-4 shadow-xl border border-gray-700 w-72">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">
                  {language === 'es' ? 'Conexión' : 'Connection'}
                </h3>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Source Card */}
              {(() => {
                const sourceNode = nodes.find(n => n.id === selectedEdge.source)
                const targetNode = nodes.find(n => n.id === selectedEdge.target)
                return (
                  <div className="space-y-3">
                    {/* Connection Type */}
                    <div className={`text-center py-2 rounded ${
                      selectedEdge.mentionType === 'attack'
                        ? 'bg-red-500/20 text-red-400'
                        : selectedEdge.mentionType === 'ability'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {selectedEdge.abilityName || (
                        selectedEdge.mentionType === 'attack'
                          ? (language === 'es' ? 'Ataque' : 'Attack')
                          : selectedEdge.mentionType === 'ability'
                            ? (language === 'es' ? 'Habilidad' : 'Ability')
                            : (language === 'es' ? 'Mención' : 'Mention')
                      )}
                    </div>

                    {/* From Card */}
                    <div
                      className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700"
                      onClick={() => navigate(`/card/${sourceNode?.id}`)}
                    >
                      {sourceNode?.image && (
                        <img src={sourceNode.image} alt={sourceNode.name} className="w-10 h-12 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{sourceNode?.name}</p>
                        <p className="text-xs text-gray-400">{language === 'es' ? 'Origen' : 'From'}</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>

                    {/* To Card */}
                    <div
                      className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700"
                      onClick={() => navigate(`/card/${targetNode?.id}`)}
                    >
                      {targetNode?.image && (
                        <img src={targetNode.image} alt={targetNode.name} className="w-10 h-12 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{targetNode?.name}</p>
                        <p className="text-xs text-gray-400">{language === 'es' ? 'Destino' : 'To'}</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Instructions - Bottom Right */}
          <div className="absolute bottom-4 right-4 text-xs text-gray-500">
            {language === 'es'
              ? 'Arrastra para mover • Rueda para zoom • Clic en línea para detalles'
              : 'Drag to pan • Wheel to zoom • Click line for details'}
          </div>
        </>
      )}
    </div>
  )
}

export default RelationshipMap
