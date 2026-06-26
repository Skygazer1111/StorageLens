const ICON_48 = 'public/icons/icon48.png'

interface ExtensionLogoProps {
  size?: number
  className?: string
}

export function ExtensionLogo({ size = 40, className = '' }: ExtensionLogoProps) {
  const src = chrome.runtime.getURL(ICON_48)

  return (
    <img
      src={src}
      alt="StorageLens"
      width={size}
      height={size}
      className={`shrink-0 rounded-xl ${className}`}
      draggable={false}
    />
  )
}
