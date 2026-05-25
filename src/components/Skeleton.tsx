'use client'

import clsx from 'clsx'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-lg bg-police-green-800/30',
        className
      )}
      aria-hidden
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(0,10,5,0.8)', border: '1px solid rgba(189,255,223,0.12)' }}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
