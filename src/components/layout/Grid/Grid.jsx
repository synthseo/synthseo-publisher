import { createElement } from '@wordpress/element';
import classNames from 'classnames';

const Grid = ({
  children,
  cols = 1,
  gap = 4,
  responsive = true,
  className = '',
  ...props
}) => {
  const getColClasses = () => {
    if (typeof cols === 'object') {
      // Custom responsive configuration
      const classes = [];
      if (cols.default) classes.push(`grid-cols-${cols.default}`);
      if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
      if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
      if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
      if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
      if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);
      return classes.join(' ');
    }

    // Simple column count with automatic responsive behavior
    if (responsive) {
      switch (cols) {
        case 1:
          return 'grid-cols-1';
        case 2:
          return 'grid-cols-1 sm:grid-cols-2';
        case 3:
          return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        case 4:
          return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
        case 5:
          return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
        case 6:
          return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
        case 12:
          return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12';
        default:
          return `grid-cols-${cols}`;
      }
    }

    return `grid-cols-${cols}`;
  };

  const gapClasses = {
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
    12: 'gap-12',
    16: 'gap-16',
  };

  const gridClasses = classNames(
    'grid',
    getColClasses(),
    gapClasses[gap] || `gap-${gap}`,
    className
  );

  return createElement(
    'div',
    {
      className: gridClasses,
      ...props,
    },
    children
  );
};

// Grid Item component for more control
export const GridItem = ({
  children,
  colSpan = 1,
  rowSpan = 1,
  colStart,
  colEnd,
  rowStart,
  rowEnd,
  className = '',
  ...props
}) => {
  const getSpanClasses = () => {
    const classes = [];
    
    if (typeof colSpan === 'object') {
      if (colSpan.default) classes.push(`col-span-${colSpan.default}`);
      if (colSpan.sm) classes.push(`sm:col-span-${colSpan.sm}`);
      if (colSpan.md) classes.push(`md:col-span-${colSpan.md}`);
      if (colSpan.lg) classes.push(`lg:col-span-${colSpan.lg}`);
      if (colSpan.xl) classes.push(`xl:col-span-${colSpan.xl}`);
    } else {
      classes.push(`col-span-${colSpan}`);
    }
    
    if (typeof rowSpan === 'object') {
      if (rowSpan.default) classes.push(`row-span-${rowSpan.default}`);
      if (rowSpan.sm) classes.push(`sm:row-span-${rowSpan.sm}`);
      if (rowSpan.md) classes.push(`md:row-span-${rowSpan.md}`);
      if (rowSpan.lg) classes.push(`lg:row-span-${rowSpan.lg}`);
      if (rowSpan.xl) classes.push(`xl:row-span-${rowSpan.xl}`);
    } else if (rowSpan > 1) {
      classes.push(`row-span-${rowSpan}`);
    }
    
    if (colStart) classes.push(`col-start-${colStart}`);
    if (colEnd) classes.push(`col-end-${colEnd}`);
    if (rowStart) classes.push(`row-start-${rowStart}`);
    if (rowEnd) classes.push(`row-end-${rowEnd}`);
    
    return classes.join(' ');
  };

  const itemClasses = classNames(
    getSpanClasses(),
    className
  );

  return createElement(
    'div',
    {
      className: itemClasses,
      ...props,
    },
    children
  );
};

export default Grid;