'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Heart, MessageCircle, Repeat2, Share, Bookmark, MoreHorizontal, ThumbsUp, Send, Globe, Play, Pin } from 'lucide-react'

interface PlatformPreviewProps {
  platform: string
  content: string
  imageUrl?: string
  authorName?: string
  authorHandle?: string
  authorAvatar?: string
  hashtags?: string[]
}

export function PlatformPreview({
  platform,
  content,
  imageUrl,
  authorName = 'Your Brand',
  authorHandle = '@yourbrand',
  authorAvatar,
}: PlatformPreviewProps) {
  const [showFull, setShowFull] = useState(false)

  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
  }

  // Twitter/X Preview
  if (platform === 'twitter') {
    return (
      <div className="bg-black text-white rounded-xl p-4 max-w-[400px] font-sans">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px]">{authorName}</span>
              <svg viewBox="0 0 22 22" className="w-4 h-4 text-blue-400 fill-current">
                <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
              </svg>
              <span className="text-gray-500 text-[15px]">{authorHandle} · 2h</span>
            </div>
            <p className="text-[15px] mt-1 whitespace-pre-wrap leading-5">
              {showFull ? content : truncate(content, 280)}
            </p>
            {content.length > 280 && (
              <button
                onClick={() => setShowFull(!showFull)}
                className="text-blue-400 text-sm mt-1"
              >
                {showFull ? 'Show less' : 'Show more'}
              </button>
            )}
            {imageUrl && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800">
                <img src={imageUrl} alt="" className="w-full h-auto" />
              </div>
            )}
            <div className="flex justify-between mt-3 text-gray-500 max-w-[300px]">
              <button className="flex items-center gap-1 hover:text-blue-400 text-[13px]">
                <MessageCircle className="w-4 h-4" /> <span>12</span>
              </button>
              <button className="flex items-center gap-1 hover:text-green-400 text-[13px]">
                <Repeat2 className="w-4 h-4" /> <span>8</span>
              </button>
              <button className="flex items-center gap-1 hover:text-pink-400 text-[13px]">
                <Heart className="w-4 h-4" /> <span>142</span>
              </button>
              <button className="flex items-center gap-1 hover:text-blue-400 text-[13px]">
                <Bookmark className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-1 hover:text-blue-400 text-[13px]">
                <Share className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // LinkedIn Preview
  if (platform === 'linkedin') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 max-w-[400px] font-sans">
        <div className="p-4">
          <div className="flex gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden">
              {authorAvatar ? (
                <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">{authorName}</p>
              <p className="text-xs text-gray-500">Marketing & Growth</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                2h · <Globe className="w-3 h-3" />
              </p>
            </div>
            <button className="text-gray-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap leading-5">
            {showFull ? content : truncate(content, 200)}
          </p>
          {content.length > 200 && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-gray-500 text-sm font-medium mt-1"
            >
              {showFull ? '...less' : '...more'}
            </button>
          )}
        </div>
        {imageUrl && (
          <img src={imageUrl} alt="" className="w-full h-auto" />
        )}
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
          <span>142 reactions · 12 comments</span>
        </div>
        <div className="flex border-t border-gray-100">
          <button className="flex-1 flex items-center justify-center gap-1 py-3 text-gray-600 hover:bg-gray-50 text-sm">
            <ThumbsUp className="w-4 h-4" /> Like
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 py-3 text-gray-600 hover:bg-gray-50 text-sm">
            <MessageCircle className="w-4 h-4" /> Comment
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 py-3 text-gray-600 hover:bg-gray-50 text-sm">
            <Repeat2 className="w-4 h-4" /> Repost
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 py-3 text-gray-600 hover:bg-gray-50 text-sm">
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    )
  }

  // Facebook Preview
  if (platform === 'facebook') {
    return (
      <div className="bg-white rounded-lg shadow max-w-[400px] font-sans">
        <div className="p-3">
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden">
              {authorAvatar ? (
                <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-900">{authorName}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                2h · <Globe className="w-3 h-3" />
              </p>
            </div>
            <button className="text-gray-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-2 text-[15px] text-gray-900 whitespace-pre-wrap">
            {showFull ? content : truncate(content, 250)}
          </p>
          {content.length > 250 && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-blue-600 text-sm mt-1"
            >
              {showFull ? 'See less' : 'See more'}
            </button>
          )}
        </div>
        {imageUrl && (
          <img src={imageUrl} alt="" className="w-full h-auto" />
        )}
        <div className="px-3 py-2 flex justify-between text-gray-500 text-sm">
          <span>142 likes</span>
          <span>12 comments · 3 shares</span>
        </div>
        <div className="flex border-t border-gray-200">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:bg-gray-50">
            <ThumbsUp className="w-5 h-5" /> <span className="font-medium">Like</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:bg-gray-50">
            <MessageCircle className="w-5 h-5" /> <span className="font-medium">Comment</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 text-gray-600 hover:bg-gray-50">
            <Share className="w-5 h-5" /> <span className="font-medium">Share</span>
          </button>
        </div>
      </div>
    )
  }

  // Instagram Preview
  if (platform === 'instagram') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg max-w-[400px] font-sans">
        <div className="p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white p-[1px]">
              {authorAvatar ? (
                <img src={authorAvatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-purple-600" />
              )}
            </div>
          </div>
          <span className="font-semibold text-sm flex-1">{authorHandle?.replace('@', '')}</span>
          <button className="text-gray-900">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full aspect-square object-cover" />
        ) : (
          <div className="w-full aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Image Preview</span>
          </div>
        )}
        <div className="p-3">
          <div className="flex justify-between mb-2">
            <div className="flex gap-4">
              <Heart className="w-6 h-6" />
              <MessageCircle className="w-6 h-6" />
              <Send className="w-6 h-6" />
            </div>
            <Bookmark className="w-6 h-6" />
          </div>
          <p className="font-semibold text-sm">1,423 likes</p>
          <p className="text-sm mt-1">
            <span className="font-semibold">{authorHandle?.replace('@', '')}</span>{' '}
            {showFull ? content : truncate(content, 125)}
          </p>
          {content.length > 125 && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-gray-500 text-sm"
            >
              {showFull ? 'less' : 'more'}
            </button>
          )}
          <p className="text-gray-500 text-xs mt-1">View all 42 comments</p>
          <p className="text-gray-400 text-[10px] uppercase mt-1">2 hours ago</p>
        </div>
      </div>
    )
  }

  // Threads Preview
  if (platform === 'threads') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 max-w-[400px] font-sans">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-[15px]">{authorHandle?.replace('@', '')}</span>
                <svg viewBox="0 0 22 22" className="w-4 h-4 text-blue-500 fill-current">
                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                </svg>
                <span className="text-gray-500">· 2h</span>
              </div>
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-[15px] mt-1 whitespace-pre-wrap">
              {showFull ? content : truncate(content, 300)}
            </p>
            {content.length > 300 && (
              <button
                onClick={() => setShowFull(!showFull)}
                className="text-gray-500 text-sm mt-1"
              >
                {showFull ? 'Show less' : 'Show more'}
              </button>
            )}
            {imageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden">
                <img src={imageUrl} alt="" className="w-full h-auto" />
              </div>
            )}
            <div className="flex gap-4 mt-3 text-gray-500">
              <Heart className="w-5 h-5" />
              <MessageCircle className="w-5 h-5" />
              <Repeat2 className="w-5 h-5" />
              <Send className="w-5 h-5" />
            </div>
            <p className="text-gray-500 text-sm mt-2">142 likes · 12 replies</p>
          </div>
        </div>
      </div>
    )
  }

  // TikTok Preview
  if (platform === 'tiktok') {
    return (
      <div className="bg-black rounded-xl overflow-hidden max-w-[280px] font-sans relative">
        <div className="aspect-[9/16] bg-gradient-to-b from-gray-800 to-gray-900 relative">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          )}
          {/* Right sidebar */}
          <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gray-600 border-2 border-white" />
              <div className="w-5 h-5 -mt-2 rounded-full bg-pink-500 flex items-center justify-center">
                <span className="text-white text-xs">+</span>
              </div>
            </div>
            <div className="flex flex-col items-center text-white">
              <Heart className="w-7 h-7" />
              <span className="text-xs">1.4K</span>
            </div>
            <div className="flex flex-col items-center text-white">
              <MessageCircle className="w-7 h-7" />
              <span className="text-xs">142</span>
            </div>
            <div className="flex flex-col items-center text-white">
              <Bookmark className="w-7 h-7" />
              <span className="text-xs">89</span>
            </div>
            <div className="flex flex-col items-center text-white">
              <Share className="w-7 h-7" />
              <span className="text-xs">Share</span>
            </div>
          </div>
          {/* Bottom info */}
          <div className="absolute bottom-4 left-3 right-14 text-white">
            <p className="font-semibold text-sm">@{authorHandle?.replace('@', '')}</p>
            <p className="text-xs mt-1 line-clamp-2">{truncate(content, 100)}</p>
            <p className="text-xs mt-1 flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-white/30" />
              Original sound - {authorName}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // YouTube Preview
  if (platform === 'youtube') {
    return (
      <div className="bg-white rounded-xl max-w-[400px] font-sans">
        <div className="relative aspect-video bg-gray-900 rounded-t-xl overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
            0:30
          </div>
        </div>
        <div className="p-3 flex gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex-shrink-0 overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 text-gray-900">
              {truncate(content, 60)}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{authorName}</p>
            <p className="text-xs text-gray-600">1.4K views · 2 hours ago</p>
          </div>
          <button className="text-gray-600">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // Pinterest Preview
  if (platform === 'pinterest') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden max-w-[236px] shadow-lg font-sans">
        <div className="relative">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full aspect-[2/3] object-cover" />
          ) : (
            <div className="w-full aspect-[2/3] bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
              <Pin className="w-12 h-12 text-red-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors group cursor-pointer">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="bg-red-600 text-white px-4 py-2 rounded-full font-semibold text-sm">
                Save
              </button>
            </div>
          </div>
        </div>
        <div className="p-2">
          <p className="font-medium text-sm line-clamp-2">{truncate(content, 50)}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
              {authorAvatar ? (
                <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600" />
              )}
            </div>
            <span className="text-xs text-gray-600">{authorName}</span>
          </div>
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="bg-gray-100 rounded-lg p-4 max-w-[400px]">
      <p className="text-sm text-gray-600 mb-2 font-medium capitalize">{platform} Preview</p>
      <p className="text-sm">{truncate(content, 200)}</p>
      {imageUrl && (
        <img src={imageUrl} alt="" className="w-full h-auto mt-3 rounded" />
      )}
    </div>
  )
}

// Helper to get platform color
export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    twitter: 'bg-gray-900',
    linkedin: 'bg-blue-700',
    facebook: 'bg-blue-600',
    instagram: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    threads: 'bg-gray-900',
    tiktok: 'bg-black',
    youtube: 'bg-red-600',
    pinterest: 'bg-red-600',
  }
  return colors[platform] || 'bg-gray-500'
}

// Helper to get platform icon
export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    twitter: 'X',
    linkedin: 'in',
    facebook: 'f',
    instagram: 'IG',
    threads: '@',
    tiktok: 'TT',
    youtube: 'YT',
    pinterest: 'P',
  }
  return icons[platform] || platform[0].toUpperCase()
}
