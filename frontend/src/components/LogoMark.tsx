type LogoVariant = 'badge' | 'mark'

interface LogoMarkProps {
  size?: number
  className?: string
  variant?: LogoVariant
}

const LOGO_SRC = '/logo-white.png'

const maskStyle = {
  WebkitMaskImage: `url('${LOGO_SRC}')`,
  maskImage: `url('${LOGO_SRC}')`,
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskMode: 'luminance',
  maskMode: 'luminance' as const,
}

export function LogoMark({ size = 120, className = '', variant = 'mark' }: LogoMarkProps) {
  if (variant === 'badge') {
    const iconSize = Math.round(size * 0.52)
    return (
      <div
        className={`rounded-full bg-primary flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {/* mix-blend-screen: white icon on purple circle, black areas show through */}
        <img
          src={LOGO_SRC}
          alt=""
          width={iconSize}
          height={iconSize}
          className="mix-blend-screen"
          aria-hidden
        />
      </div>
    )
  }

  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-primary ${className}`}
      style={{
        width: size,
        height: size,
        ...maskStyle,
      }}
    />
  )
}
