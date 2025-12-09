const Button = ({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
