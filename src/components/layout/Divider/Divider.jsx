import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const Divider = ({
  orientation = 'horizontal',
  variant = 'solid',
  thickness = 'default',
  color = 'gray',
  text = '',
  textAlign = 'center',
  spacing = 'md',
  className = '',
  ...props
}) => {
  const orientationClasses = {
    horizontal: 'w-full',
    vertical: 'h-full',
  };

  const thicknessClasses = {
    horizontal: {
      thin: 'border-t',
      default: 'border-t',
      thick: 'border-t-2',
    },
    vertical: {
      thin: 'border-l',
      default: 'border-l',
      thick: 'border-l-2',
    },
  };

  const variantClasses = {
    solid: '',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  const colorClasses = {
    gray: 'border-gray-200',
    light: 'border-gray-100',
    dark: 'border-gray-400',
    primary: 'border-blue-200',
    transparent: 'border-transparent',
  };

  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'my-2' : 'mx-2',
    md: orientation === 'horizontal' ? 'my-4' : 'mx-4',
    lg: orientation === 'horizontal' ? 'my-6' : 'mx-6',
    xl: orientation === 'horizontal' ? 'my-8' : 'mx-8',
  };

  const textAlignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  // Simple divider without text
  if (!text) {
    const dividerClasses = classNames(
      orientationClasses[orientation],
      thicknessClasses[orientation][thickness],
      variantClasses[variant],
      colorClasses[color],
      spacingClasses[spacing],
      className
    );

    return createElement(
      'div',
      {
        className: dividerClasses,
        role: 'separator',
        'aria-orientation': orientation,
        ...props,
      }
    );
  }

  // Divider with text (only for horizontal orientation)
  if (orientation === 'horizontal' && text) {
    const containerClasses = classNames(
      'relative flex items-center',
      spacingClasses[spacing],
      textAlignClasses[textAlign],
      className
    );

    const lineClasses = classNames(
      'flex-grow border-t',
      variantClasses[variant],
      colorClasses[color],
      thickness === 'thick' && 'border-t-2'
    );

    return createElement(
      'div',
      {
        className: containerClasses,
        role: 'separator',
        'aria-orientation': orientation,
        ...props,
      },
      <>
        {(textAlign === 'center' || textAlign === 'right') && (
          <div className={lineClasses} />
        )}
        <span className={classNames(
          'flex-shrink-0 px-3 text-sm text-gray-500',
          {
            'ml-0': textAlign === 'left',
            'mr-0': textAlign === 'right',
          }
        )}>
          {text}
        </span>
        {(textAlign === 'center' || textAlign === 'left') && (
          <div className={lineClasses} />
        )}
      </>
    );
  }

  // Fallback for vertical with text (not supported, just show divider)
  const dividerClasses = classNames(
    orientationClasses[orientation],
    thicknessClasses[orientation][thickness],
    variantClasses[variant],
    colorClasses[color],
    spacingClasses[spacing],
    className
  );

  return createElement(
    'div',
    {
      className: dividerClasses,
      role: 'separator',
      'aria-orientation': orientation,
      ...props,
    }
  );
};

export default Divider;