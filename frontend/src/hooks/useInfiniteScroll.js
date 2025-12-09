import { useEffect, useRef } from 'react'

export const useInfiniteScroll = (callback, hasMore, loading) => {
  const observer = useRef()
  const lastElementRef = useRef()

  useEffect(() => {
    if (loading) return

    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        callback()
      }
    })

    if (lastElementRef.current) {
      observer.current.observe(lastElementRef.current)
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [loading, hasMore, callback])

  return lastElementRef
}
