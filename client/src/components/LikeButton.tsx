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
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
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
    <button onClick={handleClick} className="flex items-center gap-1 hover:text-red-500 transition-colors">
      <svg
        className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400'}`}
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className={liked ? 'text-red-500' : ''}>{count}</span>
    </button>
  )
}
