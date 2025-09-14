import { createElement, useState } from '@wordpress/element';
import classNames from 'classnames';

const Tabs = ({
  tabs = [],
  defaultActiveTab = 0,
  activeTab: controlledActiveTab,
  onChange,
  variant = 'line',
  size = 'md',
  fullWidth = false,
  className = '',
  tabClassName = '',
  panelClassName = '',
  ...props
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultActiveTab);
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;

  const handleTabClick = (index) => {
    if (tabs[index].disabled) return;
    
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(index);
    }
    
    if (onChange) {
      onChange(index, tabs[index]);
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const variantClasses = {
    line: {
      list: 'border-b border-gray-200',
      tab: 'whitespace-nowrap py-2 px-4 border-b-2 font-medium',
      activeTab: 'border-blue-500 text-blue-600',
      inactiveTab: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
    },
    pills: {
      list: 'flex-wrap gap-2',
      tab: 'px-4 py-2 rounded-full font-medium',
      activeTab: 'bg-blue-100 text-blue-700',
      inactiveTab: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
    enclosed: {
      list: 'border-b border-gray-200',
      tab: 'whitespace-nowrap py-2 px-4 border border-b-0 rounded-t-lg font-medium -mb-px',
      activeTab: 'bg-white border-gray-200 text-blue-600',
      inactiveTab: 'border-transparent text-gray-500 hover:text-gray-700',
    },
  };

  const tabListClasses = classNames(
    'flex',
    variantClasses[variant].list,
    {
      'w-full': fullWidth,
      'overflow-x-auto': !fullWidth,
    },
    sizeClasses[size]
  );

  const getTabClasses = (index) => {
    const isActive = activeTab === index;
    const isDisabled = tabs[index].disabled;
    
    return classNames(
      variantClasses[variant].tab,
      {
        [variantClasses[variant].activeTab]: isActive,
        [variantClasses[variant].inactiveTab]: !isActive && !isDisabled,
        'opacity-50 cursor-not-allowed': isDisabled,
        'cursor-pointer transition-colors': !isDisabled,
        'flex-1': fullWidth,
      },
      tabClassName
    );
  };

  const TabIcon = ({ icon, label }) => {
    if (!icon) return null;
    
    return createElement(
      'span',
      { className: label ? 'mr-2' : '' },
      icon
    );
  };

  const TabContent = () => {
    const activeTabData = tabs[activeTab];
    if (!activeTabData) return null;

    return createElement(
      'div',
      { 
        className: classNames('mt-4', panelClassName),
        role: 'tabpanel',
        'aria-labelledby': `tab-${activeTab}`,
      },
      activeTabData.content || activeTabData.panel || null
    );
  };

  return createElement(
    'div',
    { className, ...props },
    <>
      <div className={tabListClasses} role="tablist">
        {tabs.map((tab, index) => (
          <button
            key={tab.key || index}
            id={`tab-${index}`}
            role="tab"
            type="button"
            className={getTabClasses(index)}
            onClick={() => handleTabClick(index)}
            disabled={tab.disabled}
            aria-selected={activeTab === index}
            aria-controls={`tabpanel-${index}`}
          >
            <div className="flex items-center">
              <TabIcon icon={tab.icon} label={tab.label} />
              {tab.label}
              {tab.badge && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {tab.badge}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      <TabContent />
    </>
  );
};

export default Tabs;