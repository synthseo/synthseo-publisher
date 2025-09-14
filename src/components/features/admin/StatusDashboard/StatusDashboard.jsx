import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '../../../ui/Card';
import { Table } from '../../../data/Table';
import { Badge } from '../../../ui/Badge';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { Tabs } from '../../../data/Tabs';
import { Alert } from '../../../ui/Alert';

const StatusDashboard = ({ apiUrl = '', apiKey = '' }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedToday: 0,
    pendingReview: 0,
    failedPublish: 0,
    apiCalls: 0,
    apiLimit: 100,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [apiHealth, setApiHealth] = useState('checking');

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboard = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setStats({
          totalPosts: 142,
          publishedToday: 8,
          pendingReview: 3,
          failedPublish: 1,
          apiCalls: 47,
          apiLimit: 100,
        });
        
        setRecentActivity([
          {
            id: 1,
            title: 'SEO Best Practices for 2024',
            status: 'published',
            date: '2024-01-15 10:30',
            author: 'API',
          },
          {
            id: 2,
            title: 'Understanding Core Web Vitals',
            status: 'published',
            date: '2024-01-15 09:15',
            author: 'API',
          },
          {
            id: 3,
            title: 'Mobile-First Indexing Guide',
            status: 'pending',
            date: '2024-01-15 08:45',
            author: 'API',
          },
          {
            id: 4,
            title: 'Local SEO Strategies',
            status: 'failed',
            date: '2024-01-14 16:20',
            author: 'API',
          },
        ]);
        
        setApiHealth('healthy');
      } catch (error) {
        setApiHealth('error');
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
  }, []);

  const getStatusBadge = (status) => {
    const variants = {
      published: 'success',
      pending: 'warning',
      failed: 'error',
      draft: 'default',
    };
    
    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'title',
      label: __('Title', 'synthseo-publisher'),
      sortable: true,
    },
    {
      key: 'status',
      label: __('Status', 'synthseo-publisher'),
      render: (value) => getStatusBadge(value),
      sortable: true,
    },
    {
      key: 'date',
      label: __('Date', 'synthseo-publisher'),
      sortable: true,
    },
    {
      key: 'author',
      label: __('Source', 'synthseo-publisher'),
    },
  ];

  const StatCard = ({ label, value, change, variant = 'default' }) => {
    const variantColors = {
      default: 'text-gray-900',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
    };
    
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <dt className="text-sm font-medium text-gray-500 truncate">
          {label}
        </dt>
        <dd className={`mt-2 text-3xl font-semibold ${variantColors[variant]}`}>
          {value}
        </dd>
        {change && (
          <dd className="mt-1 text-sm text-gray-600">
            {change}
          </dd>
        )}
      </div>
    );
  };

  const tabs = [
    {
      label: __('Overview', 'synthseo-publisher'),
      content: (
        <div className="space-y-6">
          {/* Stats Grid */}
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={__('Total Posts', 'synthseo-publisher')}
              value={stats.totalPosts}
              change={__('All time', 'synthseo-publisher')}
            />
            <StatCard
              label={__('Published Today', 'synthseo-publisher')}
              value={stats.publishedToday}
              variant="success"
            />
            <StatCard
              label={__('Pending Review', 'synthseo-publisher')}
              value={stats.pendingReview}
              variant="warning"
            />
            <StatCard
              label={__('Failed Publish', 'synthseo-publisher')}
              value={stats.failedPublish}
              variant="error"
            />
          </dl>

          {/* API Usage */}
          <Card title={__('API Usage', 'synthseo-publisher')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {__('API Calls Today', 'synthseo-publisher')}
              </span>
              <span className="text-sm text-gray-500">
                {stats.apiCalls} / {stats.apiLimit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(stats.apiCalls / stats.apiLimit) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {__('Resets daily at midnight UTC', 'synthseo-publisher')}
            </p>
          </Card>
        </div>
      ),
    },
    {
      label: __('Recent Activity', 'synthseo-publisher'),
      badge: recentActivity.length,
      content: (
        <Table
          columns={columns}
          data={recentActivity}
          striped
          hover
          sortable
        />
      ),
    },
    {
      label: __('API Health', 'synthseo-publisher'),
      content: (
        <div className="space-y-4">
          {apiHealth === 'healthy' ? (
            <Alert type="success" title={__('API Connection Healthy', 'synthseo-publisher')}>
              {__('All systems are operational. Your API connection is working correctly.', 'synthseo-publisher')}
            </Alert>
          ) : apiHealth === 'error' ? (
            <Alert type="error" title={__('API Connection Error', 'synthseo-publisher')}>
              {__('Unable to connect to the API. Please check your settings.', 'synthseo-publisher')}
            </Alert>
          ) : (
            <LoadingSpinner text={__('Checking API health...', 'synthseo-publisher')} />
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {__('Endpoint', 'synthseo-publisher')}
              </h4>
              <code className="text-xs text-gray-600">{apiUrl || 'Not configured'}</code>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {__('Last Check', 'synthseo-publisher')}
              </h4>
              <p className="text-xs text-gray-600">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <LoadingSpinner text={__('Loading dashboard...', 'synthseo-publisher')} />
      </Card>
    );
  }

  return (
    <Card title={__('Status Dashboard', 'synthseo-publisher')}>
      <Tabs tabs={tabs} />
    </Card>
  );
};

export default StatusDashboard;