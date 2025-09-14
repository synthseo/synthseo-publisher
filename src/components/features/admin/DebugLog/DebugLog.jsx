import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '../../../ui/Card';
import { List } from '../../../data/List';
import { Input } from '../../../forms/Input';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Select } from '../../../forms/Select';

const DebugLog = ({ maxEntries = 100 }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    // Mock log data
    const mockLogs = [
      {
        id: 1,
        timestamp: '2024-01-15 10:30:45',
        level: 'info',
        message: 'API connection established successfully',
        context: { endpoint: '/status', response_time: '245ms' },
      },
      {
        id: 2,
        timestamp: '2024-01-15 10:30:12',
        level: 'success',
        message: 'Post published: "SEO Best Practices for 2024"',
        context: { post_id: 123, author: 'api_user' },
      },
      {
        id: 3,
        timestamp: '2024-01-15 10:29:58',
        level: 'warning',
        message: 'Rate limit approaching: 85/100 requests',
        context: { remaining: 15 },
      },
      {
        id: 4,
        timestamp: '2024-01-15 10:28:34',
        level: 'error',
        message: 'Failed to upload featured image',
        context: { error: 'File size exceeds limit', file: 'hero-image.jpg' },
      },
      {
        id: 5,
        timestamp: '2024-01-15 10:27:19',
        level: 'debug',
        message: 'Cache cleared for post meta',
        context: { cache_key: 'synthseo_meta_142' },
      },
    ];
    
    setLogs(mockLogs);
    setFilteredLogs(mockLogs);
  }, []);

  useEffect(() => {
    let filtered = [...logs];
    
    // Filter by level
    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.context).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredLogs(filtered);
  }, [searchTerm, filterLevel, logs]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Simulate new log entry
        const newLog = {
          id: logs.length + 1,
          timestamp: new Date().toLocaleString(),
          level: ['info', 'success', 'warning', 'error', 'debug'][Math.floor(Math.random() * 5)],
          message: 'Auto-refresh: New activity detected',
          context: { auto: true },
        };
        setLogs(prev => [newLog, ...prev].slice(0, maxEntries));
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, logs.length, maxEntries]);

  const getLevelBadge = (level) => {
    const variants = {
      info: 'info',
      success: 'success',
      warning: 'warning',
      error: 'error',
      debug: 'default',
    };
    
    return (
      <Badge variant={variants[level] || 'default'} size="sm">
        {level.toUpperCase()}
      </Badge>
    );
  };

  const handleClearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `synthseo-debug-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const levelOptions = [
    { value: 'all', label: __('All Levels', 'synthseo-publisher') },
    { value: 'debug', label: __('Debug', 'synthseo-publisher') },
    { value: 'info', label: __('Info', 'synthseo-publisher') },
    { value: 'success', label: __('Success', 'synthseo-publisher') },
    { value: 'warning', label: __('Warning', 'synthseo-publisher') },
    { value: 'error', label: __('Error', 'synthseo-publisher') },
  ];

  const renderLogItem = (log) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getLevelBadge(log.level)}
          <span className="text-xs text-gray-500">{log.timestamp}</span>
        </div>
      </div>
      <p className="text-sm text-gray-900">{log.message}</p>
      {log.context && Object.keys(log.context).length > 0 && (
        <div className="mt-1">
          <code className="text-xs text-gray-600 bg-gray-50 p-1 rounded">
            {JSON.stringify(log.context)}
          </code>
        </div>
      )}
    </div>
  );

  return (
    <Card
      title={__('Debug Log', 'synthseo-publisher')}
      headerActions={
        <div className="flex items-center space-x-2">
          <Badge variant="default">
            {filteredLogs.length} {__('entries', 'synthseo-publisher')}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? __('Stop Auto-refresh', 'synthseo-publisher') : __('Auto-refresh', 'synthseo-publisher')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={__('Search logs...', 'synthseo-publisher')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <Select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            options={levelOptions}
            className="w-full sm:w-48"
          />
          <Button
            variant="secondary"
            onClick={handleExportLogs}
            disabled={logs.length === 0}
          >
            {__('Export', 'synthseo-publisher')}
          </Button>
          <Button
            variant="ghost"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
          >
            {__('Clear', 'synthseo-publisher')}
          </Button>
        </div>

        {/* Log List */}
        <List
          items={filteredLogs}
          renderItem={renderLogItem}
          divided
          hover
          bordered
          emptyMessage={__('No debug logs to display', 'synthseo-publisher')}
          emptyIcon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>
    </Card>
  );
};

export default DebugLog;