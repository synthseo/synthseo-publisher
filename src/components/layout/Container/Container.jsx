import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const Container = ({
  children,
  maxWidth = 'lg',
  padding = true,
  centered = false,
  className = '',
  ...props
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
    prose: 'max-w-prose',
    screen: 'max-w-screen-xl',
  };

  const containerClasses = classNames(
    'w-full',
    maxWidthClasses[maxWidth],
    {
      'mx-auto': centered,
      'px-4 sm:px-6 lg:px-8': padding,
    },
    className
  );

  return createElement(
    'div',
    {
      className: containerClasses,
      ...props,
    },
    children
  );
};

export default Container;