import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { likePost, unlikePost } from '../api/likes'
import { useNavigate } from 'react-router-dom'

interface LikeButtonProps {
  postId: number
  initialLiked: boolean
  initialCount: number
}

export default function LikeButton({ postId, initialLiked, initialCount }: LikeButtonProps) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (pending) return
    setPending(true)

    const prevLiked = liked
    const prevCount = count
    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)

    try {
      if (prevLiked) {
        const res = await unlikePost(postId)
        setCount(res.like_count)
      } else {
        const res = await likePost(postId)
        setCount(res.like_count)
      }
    } catch {
      setLiked(prevLiked)
      setCount(prevCount)
    } finally {
      setPending(false)
    }
  }

  return (
    <button onClick={handleClick} className="flex items-center gap-1 group">
      <svg
        className={`w-4 h-4 transition-colors ${
          liked ? 'fill-cinnabar text-cinnabar' : 'fill-none text-ink/25 group-hover:text-cinnabar/60'
        }`}
        stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
      <span className={liked ? 'text-cinnabar' : 'text-ink/40'}>{count}</span>
    </button>
  )
}
