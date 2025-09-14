import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { FormField } from '../../../forms/FormField';
import { Input } from '../../../forms/Input';
import { Select } from '../../../forms/Select';
import { Toggle } from '../../../forms/Toggle';
import { Alert } from '../../../ui/Alert';

const SettingsForm = ({ settings = {}, onSave }) => {
  const [formData, setFormData] = useState({
    apiUrl: settings.apiUrl || '',
    apiKey: settings.apiKey || '',
    defaultPostStatus: settings.defaultPostStatus || 'draft',
    defaultAuthor: settings.defaultAuthor || '',
    autoPublish: settings.autoPublish || false,
    enableSeoFields: settings.enableSeoFields || true,
    enableSchemaMarkup: settings.enableSchemaMarkup || true,
    enableDebugMode: settings.enableDebugMode || false,
    rateLimit: settings.rateLimit || '10',
    timeout: settings.timeout || '30',
  });

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const postStatusOptions = [
    { value: 'draft', label: __('Draft', 'synthseo-publisher') },
    { value: 'pending', label: __('Pending Review', 'synthseo-publisher') },
    { value: 'private', label: __('Private', 'synthseo-publisher') },
    { value: 'publish', label: __('Published', 'synthseo-publisher') },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.apiUrl) {
      newErrors.apiUrl = __('API URL is required', 'synthseo-publisher');
    } else if (!/^https?:\/\/.+/.test(formData.apiUrl)) {
      newErrors.apiUrl = __('Please enter a valid URL', 'synthseo-publisher');
    }

    if (!formData.apiKey) {
      newErrors.apiKey = __('API Key is required', 'synthseo-publisher');
    }

    const rateLimit = parseInt(formData.rateLimit);
    if (isNaN(rateLimit) || rateLimit < 1 || rateLimit > 100) {
      newErrors.rateLimit = __('Rate limit must be between 1 and 100', 'synthseo-publisher');
    }

    const timeout = parseInt(formData.timeout);
    if (isNaN(timeout) || timeout < 5 || timeout > 300) {
      newErrors.timeout = __('Timeout must be between 5 and 300 seconds', 'synthseo-publisher');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      if (onSave) {
        await onSave(formData);
      }
      setSaveMessage({
        type: 'success',
        text: __('Settings saved successfully!', 'synthseo-publisher'),
      });
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: __('Failed to save settings. Please try again.', 'synthseo-publisher'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card
        title={__('Plugin Settings', 'synthseo-publisher')}
        footer={
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {saveMessage && (
                <Alert 
                  type={saveMessage.type} 
                  dismissible
                  className="mb-0"
                >
                  {saveMessage.text}
                </Alert>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={saving}
            >
              {saving 
                ? __('Saving...', 'synthseo-publisher')
                : __('Save Settings', 'synthseo-publisher')}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* API Configuration */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {__('API Configuration', 'synthseo-publisher')}
            </h3>
            <div className="space-y-4">
              <FormField>
                <Input
                  label={__('API URL', 'synthseo-publisher')}
                  value={formData.apiUrl}
                  onChange={(e) => handleChange('apiUrl', e.target.value)}
                  placeholder="https://api.synthseo.com"
                  error={errors.apiUrl}
                  required
                />
              </FormField>

              <FormField>
                <Input
                  label={__('API Key', 'synthseo-publisher')}
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  error={errors.apiKey}
                  required
                />
              </FormField>
            </div>
          </div>

          {/* Publishing Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {__('Publishing Settings', 'synthseo-publisher')}
            </h3>
            <div className="space-y-4">
              <FormField>
                <Select
                  label={__('Default Post Status', 'synthseo-publisher')}
                  value={formData.defaultPostStatus}
                  onChange={(e) => handleChange('defaultPostStatus', e.target.value)}
                  options={postStatusOptions}
                />
              </FormField>

              <FormField>
                <Input
                  label={__('Default Author ID', 'synthseo-publisher')}
                  type="number"
                  value={formData.defaultAuthor}
                  onChange={(e) => handleChange('defaultAuthor', e.target.value)}
                  placeholder="1"
                  helpText={__('WordPress user ID for the default post author', 'synthseo-publisher')}
                />
              </FormField>

              <FormField>
                <Toggle
                  label={__('Auto-Publish', 'synthseo-publisher')}
                  checked={formData.autoPublish}
                  onChange={(e) => handleChange('autoPublish', e.target.checked)}
                  description={__('Automatically publish posts instead of saving as draft', 'synthseo-publisher')}
                />
              </FormField>
            </div>
          </div>

          {/* SEO Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {__('SEO Settings', 'synthseo-publisher')}
            </h3>
            <div className="space-y-4">
              <FormField>
                <Toggle
                  label={__('Enable SEO Fields', 'synthseo-publisher')}
                  checked={formData.enableSeoFields}
                  onChange={(e) => handleChange('enableSeoFields', e.target.checked)}
                  description={__('Add SEO meta fields to posts', 'synthseo-publisher')}
                />
              </FormField>

              <FormField>
                <Toggle
                  label={__('Enable Schema Markup', 'synthseo-publisher')}
                  checked={formData.enableSchemaMarkup}
                  onChange={(e) => handleChange('enableSchemaMarkup', e.target.checked)}
                  description={__('Add structured data markup to posts', 'synthseo-publisher')}
                />
              </FormField>
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {__('Advanced Settings', 'synthseo-publisher')}
            </h3>
            <div className="space-y-4">
              <FormField>
                <Input
                  label={__('Rate Limit', 'synthseo-publisher')}
                  type="number"
                  value={formData.rateLimit}
                  onChange={(e) => handleChange('rateLimit', e.target.value)}
                  error={errors.rateLimit}
                  helpText={__('Maximum API requests per minute (1-100)', 'synthseo-publisher')}
                />
              </FormField>

              <FormField>
                <Input
                  label={__('Request Timeout', 'synthseo-publisher')}
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => handleChange('timeout', e.target.value)}
                  error={errors.timeout}
                  helpText={__('API request timeout in seconds (5-300)', 'synthseo-publisher')}
                />
              </FormField>

              <FormField>
                <Toggle
                  label={__('Debug Mode', 'synthseo-publisher')}
                  checked={formData.enableDebugMode}
                  onChange={(e) => handleChange('enableDebugMode', e.target.checked)}
                  description={__('Enable detailed logging for troubleshooting', 'synthseo-publisher')}
                />
              </FormField>
            </div>
          </div>
        </div>
      </Card>
    </form>
  );
};

export default SettingsForm;