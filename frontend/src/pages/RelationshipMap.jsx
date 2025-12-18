import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const [selectedNode, setSelectedNode] = useState(null)

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

    // Run force simulation
    simulateForces(initialNodes, mapData.edges)
  }

  // Simple force-directed simulation
  const simulateForces = (initialNodes, edges) => {
    let currentNodes = [...initialNodes]
    const iterations = 100

    for (let iter = 0; iter < iterations; iter++) {
      // Calculate forces
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
            const dist = Math.sqrt(dx * dx + dy * dy)
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

  // Zoom handlers
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const scaleChange = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.2, Math.min(3, transform.scale * scaleChange))

    // Zoom towards cursor
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
  }

  // Get edge color based on mention type
  const getEdgeColor = (type) => {
    switch (type) {
      case 'attack': return '#ef4444' // red
      case 'ability': return '#a855f7' // purple
      default: return '#3b82f6' // blue
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/"
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm mb-4 inline-block"
        >
          {language === 'es' ? 'Volver al inicio' : 'Back to home'}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {language === 'es' ? 'Mapa de Relaciones' : 'Relationship Map'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {language === 'es'
                ? 'Visualiza las conexiones entre cartas basadas en menciones en comentarios'
                : 'Visualize connections between cards based on comment mentions'}
            </p>
          </div>
          {data?.stats && (
            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
              <p>{data.stats.totalNodes} {language === 'es' ? 'cartas' : 'cards'}</p>
              <p>{data.stats.totalEdges} {language === 'es' ? 'conexiones' : 'connections'}</p>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      ) : !data?.nodes?.length ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {language === 'es' ? 'Sin datos aun' : 'No data yet'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {language === 'es'
              ? 'Comienza a comentar cartas y mencionar otras con @ para ver conexiones'
              : 'Start commenting on cards and mentioning others with @ to see connections'}
          </p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              +
            </button>
            <button
              onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.2, prev.scale * 0.8) }))}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              -
            </button>
            <button
              onClick={resetView}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              {language === 'es' ? 'Restablecer' : 'Reset'}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              {Math.round(transform.scale * 100)}%
            </span>
            <div className="flex-1" />
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-blue-500" />
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Carta' : 'Card'}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-red-500" />
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Ataque' : 'Attack'}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-purple-500" />
                <span className="text-gray-500 dark:text-gray-400">{language === 'es' ? 'Habilidad' : 'Ability'}</span>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={containerRef}
            className="relative bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ height: '600px' }}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {/* Background */}
              <rect width="100%" height="100%" fill="transparent" />

              {/* Transform group */}
              <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                {/* Edges */}
                {data.edges.map((edge, i) => {
                  const sourceNode = nodes.find(n => n.id === edge.source)
                  const targetNode = nodes.find(n => n.id === edge.target)
                  if (!sourceNode || !targetNode) return null

                  return (
                    <line
                      key={i}
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={getEdgeColor(edge.mentionType)}
                      strokeWidth={2}
                      strokeOpacity={0.6}
                    />
                  )
                })}

                {/* Nodes */}
                {nodes.map(node => (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onClick={() => navigate(`/card/${node.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Node circle/image */}
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
                        <text
                          x={18}
                          y={-14}
                          textAnchor="middle"
                          fill="white"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {node.commentCount}
                        </text>
                      </>
                    )}
                  </g>
                ))}
              </g>
            </svg>

            {/* Hover tooltip */}
            {hoveredNode && (
              <div
                className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 pointer-events-none z-10 border border-gray-200 dark:border-gray-700"
                style={{
                  left: '50%',
                  bottom: '16px',
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="flex items-center gap-3">
                  {hoveredNode.image && (
                    <img src={hoveredNode.image} alt={hoveredNode.name} className="w-16 h-20 object-cover rounded" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{hoveredNode.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{hoveredNode.set}</p>
                    <p className="text-xs text-primary-500 mt-1">
                      {hoveredNode.commentCount} {language === 'es' ? 'comentarios' : 'comments'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            {language === 'es'
              ? 'Arrastra para mover, usa la rueda del raton para zoom, haz clic en una carta para verla'
              : 'Drag to pan, use mouse wheel to zoom, click a card to view it'}
          </p>
        </>
      )}
    </div>
  )
}

export default RelationshipMap
