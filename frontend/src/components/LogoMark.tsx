interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 120, className = '' }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="60" fill="#a166ff" />
      <path
        d="M38 72V52L60 38L82 52V72H70V58H50V72H38Z"
        stroke="white"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M72 44L76 36L84 40L80 48L72 44Z"
        fill="white"
      />
      <path
        d="M76 36L78 32L82 34L80 38L76 36Z"
        fill="white"
      />
    </svg>
  )
}
