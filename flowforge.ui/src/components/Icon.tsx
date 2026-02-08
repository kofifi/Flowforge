type IconName =
  | 'sun'
  | 'moon'
  | 'plus'
  | 'minus'
  | 'fit'
  | 'list-bullets'
  | 'rows'
  | 'rows-wide'
  | 'gear'
  | 'chevron-down'

type IconProps = {
  name: IconName
  size?: number
  className?: string
}

function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`/icons.svg#${name}`} />
    </svg>
  )
}

export default Icon
