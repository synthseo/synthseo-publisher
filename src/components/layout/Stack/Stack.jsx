import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const Stack = ({
  children,
  direction = 'vertical',
  spacing = 4,
  align = 'stretch',
  justify = 'start',
  wrap = false,
  divider = false,
  className = '',
  ...props
}) => {
  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row',
    'vertical-reverse': 'flex-col-reverse',
    'horizontal-reverse': 'flex-row-reverse',
  };

  const spacingClasses = {
    vertical: {
      0: 'space-y-0',
      1: 'space-y-1',
      2: 'space-y-2',
      3: 'space-y-3',
      4: 'space-y-4',
      5: 'space-y-5',
      6: 'space-y-6',
      8: 'space-y-8',
      10: 'space-y-10',
      12: 'space-y-12',
    },
    horizontal: {
      0: 'space-x-0',
      1: 'space-x-1',
      2: 'space-x-2',
      3: 'space-x-3',
      4: 'space-x-4',
      5: 'space-x-5',
      6: 'space-x-6',
      8: 'space-x-8',
      10: 'space-x-10',
      12: 'space-x-12',
    },
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const isVertical = direction === 'vertical' || direction === 'vertical-reverse';
  const spacingClass = isVertical 
    ? spacingClasses.vertical[spacing] 
    : spacingClasses.horizontal[spacing];

  const stackClasses = classNames(
    'flex',
    directionClasses[direction],
    spacingClass,
    alignClasses[align],
    justifyClasses[justify],
    {
      'flex-wrap': wrap,
      'divide-y divide-gray-200': divider && isVertical,
      'divide-x divide-gray-200': divider && !isVertical,
    },
    className
  );

  // If divider is enabled, we need to wrap children
  if (divider && Array.isArray(children)) {
    const wrappedChildren = children.map((child, index) => 
      createElement(
        'div',
        { 
          key: index,
          className: classNames({
            'w-full': isVertical,
            'h-full': !isVertical,
          })
        },
        child
      )
    );
    
    return createElement(
      'div',
      {
        className: stackClasses,
        ...props,
      },
      wrappedChildren
    );
  }

  return createElement(
    'div',
    {
      className: stackClasses,
      ...props,
    },
    children
  );
};

export default Stack;