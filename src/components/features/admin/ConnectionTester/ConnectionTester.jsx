import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { Badge } from '../../../ui/Badge';

const ConnectionTester = ({ apiUrl = '', apiKey = '', onTest }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      // Simulate API test - replace with actual API call
      const response = await fetch(`${apiUrl}/status`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          status: 'success',
          message: __('Connection successful!', 'synthseo-publisher'),
          details: data,
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (onTest) {
        onTest(true);
      }
    } catch (err) {
      setError(err.message);
      setTestResult({
        status: 'error',
        message: __('Connection failed', 'synthseo-publisher'),
        details: err.message,
      });
      
      if (onTest) {
        onTest(false);
      }
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = () => {
    if (!testResult) return null;
    
    return (
      <Badge
        variant={testResult.status === 'success' ? 'success' : 'error'}
        icon="dot"
      >
        {testResult.status === 'success' 
          ? __('Connected', 'synthseo-publisher')
          : __('Disconnected', 'synthseo-publisher')}
      </Badge>
    );
  };

  return (
    <Card
      title={__('API Connection Test', 'synthseo-publisher')}
      headerActions={getStatusBadge()}
      className="mb-6"
    >
      <div className="space-y-4">
        {/* Connection Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {__('API URL', 'synthseo-publisher')}
            </label>
            <code className="block p-2 bg-gray-100 rounded text-sm text-gray-800 break-all">
              {apiUrl || __('Not configured', 'synthseo-publisher')}
            </code>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {__('API Key', 'synthseo-publisher')}
            </label>
            <code className="block p-2 bg-gray-100 rounded text-sm text-gray-800">
              {apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : __('Not configured', 'synthseo-publisher')}
            </code>
          </div>
        </div>

        {/* Test Button */}
        <div className="flex items-center space-x-4">
          <Button
            variant="primary"
            onClick={handleTestConnection}
            disabled={testing || !apiUrl || !apiKey}
            loading={testing}
          >
            {testing 
              ? __('Testing Connection...', 'synthseo-publisher')
              : __('Test Connection', 'synthseo-publisher')}
          </Button>
          
          {testing && (
            <LoadingSpinner 
              size="sm" 
              inline 
              text={__('Please wait...', 'synthseo-publisher')}
            />
          )}
        </div>

        {/* Test Results */}
        {testResult && !testing && (
          <Alert
            type={testResult.status === 'success' ? 'success' : 'error'}
            title={testResult.message}
            dismissible
          >
            {testResult.status === 'success' ? (
              <div className="mt-2 text-sm">
                <p>{__('Your API connection is working correctly.', 'synthseo-publisher')}</p>
                {testResult.details && (
                  <ul className="mt-2 list-disc list-inside">
                    <li>{__('API Version:', 'synthseo-publisher')} {testResult.details.version || 'Unknown'}</li>
                    <li>{__('Status:', 'synthseo-publisher')} {testResult.details.status || 'Active'}</li>
                  </ul>
                )}
              </div>
            ) : (
              <div className="mt-2 text-sm">
                <p>{__('Unable to connect to the API. Please check your settings.', 'synthseo-publisher')}</p>
                {testResult.details && (
                  <p className="mt-1 font-mono text-xs">{testResult.details}</p>
                )}
              </div>
            )}
          </Alert>
        )}
      </div>
    </Card>
  );
};

export default ConnectionTester;