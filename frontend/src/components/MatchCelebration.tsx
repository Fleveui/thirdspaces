'use client'

import { useEffect } from 'react'
import { SparkleIcon } from '@/components/SparkleIcon'

interface MatchCelebrationProps {
  open: boolean
  onClose: () => void
  durationMs?: number
}

export function MatchCelebration({ open, onClose, durationMs = 2800 }: MatchCelebrationProps) {
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(onClose, durationMs)
    return () => clearTimeout(timer)
  }, [open, onClose, durationMs])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md px-6 animate-fade-in"
      role="dialog"
      aria-labelledby="match-title"
      onClick={onClose}
    >
      <div
        className="text-center max-w-sm w-full animate-pop-in motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-2 mb-5">
          <SparkleIcon size={28} className="text-primary animate-pulse" />
          <h2 id="match-title" className="text-2xl font-bold text-primary">
            It&apos;s a match!
          </h2>
          <SparkleIcon size={28} className="text-primary animate-pulse [animation-delay:150ms]" />
        </div>

        <div className="relative mx-auto w-52">
          <SparkleIcon
            size={20}
            className="absolute -top-1 left-2 text-primary animate-pulse [animation-delay:300ms]"
          />
          <SparkleIcon
            size={16}
            className="absolute top-6 -right-1 text-primary animate-pulse [animation-delay:450ms]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/illustrations/match.png"
            alt=""
            className="w-full h-auto"
            aria-hidden
          />
          <SparkleIcon
            size={18}
            className="absolute -bottom-1 right-4 text-primary animate-pulse [animation-delay:600ms]"
          />
        </div>
      </div>
    </div>
  )
}
