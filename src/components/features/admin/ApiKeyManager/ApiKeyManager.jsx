import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Badge } from '../../../ui/Badge';
import { Input } from '../../../forms/Input';
import { Modal } from '../../../data/Modal';
import { Alert } from '../../../ui/Alert';

const ApiKeyManager = ({ currentKey = '', onKeyChange, onSave }) => {
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerateKey = () => {
    // Generate a random 32-character API key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewKey(key);
  };

  const handleSaveKey = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      if (onSave) {
        await onSave(newKey);
      }
      if (onKeyChange) {
        onKeyChange(newKey);
      }
      setSaveMessage({
        type: 'success',
        text: __('API key updated successfully!', 'synthseo-publisher'),
      });
      setTimeout(() => {
        setShowModal(false);
        setSaveMessage(null);
        setNewKey('');
      }, 2000);
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: __('Failed to save API key. Please try again.', 'synthseo-publisher'),
      });
    } finally {
      setSaving(false);
    }
  };

  const maskKey = (key) => {
    if (!key) return '';
    return `${key.substring(0, 8)}${'•'.repeat(20)}${key.substring(key.length - 4)}`;
  };

  const handleCopyToClipboard = async () => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentKey);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = currentKey;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
          } else {
            throw new Error('Copy command failed');
          }
        } catch (err) {
          console.error('Failed to copy:', err);
          // Could show error message
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Could show error notification
    }
  };

  return (
    <>
      <Card
        title={__('API Key Management', 'synthseo-publisher')}
        headerActions={
          currentKey && (
            <Badge variant="success" icon="dot">
              {__('Active', 'synthseo-publisher')}
            </Badge>
          )
        }
        className="mb-6"
      >
        <div className="space-y-4">
          {/* Current Key Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {__('Current API Key', 'synthseo-publisher')}
            </label>
            <div className="flex items-center space-x-2">
              <code className="flex-1 p-3 bg-gray-100 rounded text-sm font-mono">
                {currentKey ? (
                  showKey ? currentKey : maskKey(currentKey)
                ) : (
                  <span className="text-gray-500">
                    {__('No API key configured', 'synthseo-publisher')}
                  </span>
                )}
              </code>
              {currentKey && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? __('Hide', 'synthseo-publisher') : __('Show', 'synthseo-publisher')}
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              onClick={() => setShowModal(true)}
            >
              {currentKey 
                ? __('Regenerate API Key', 'synthseo-publisher')
                : __('Generate API Key', 'synthseo-publisher')}
            </Button>
            
            {currentKey && (
              <Button
                variant={copySuccess ? 'success' : 'ghost'}
                onClick={handleCopyToClipboard}
              >
                {copySuccess 
                  ? __('Copied!', 'synthseo-publisher')
                  : __('Copy to Clipboard', 'synthseo-publisher')}
              </Button>
            )}
          </div>

          {/* Warning */}
          {currentKey && (
            <Alert type="warning">
              {__('Keep your API key secure. Do not share it publicly or commit it to version control.', 'synthseo-publisher')}
            </Alert>
          )}
        </div>
      </Card>

      {/* Generate/Regenerate Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setNewKey('');
          setSaveMessage(null);
        }}
        title={currentKey 
          ? __('Regenerate API Key', 'synthseo-publisher')
          : __('Generate New API Key', 'synthseo-publisher')}
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                setNewKey('');
                setSaveMessage(null);
              }}
              disabled={saving}
            >
              {__('Cancel', 'synthseo-publisher')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveKey}
              disabled={!newKey || saving}
              loading={saving}
            >
              {__('Save API Key', 'synthseo-publisher')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {currentKey && (
            <Alert type="warning" title={__('Warning', 'synthseo-publisher')}>
              {__('Regenerating your API key will invalidate the current key. Any applications using the current key will need to be updated.', 'synthseo-publisher')}
            </Alert>
          )}

          <div>
            <Input
              label={__('New API Key', 'synthseo-publisher')}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder={__('Click generate to create a new key', 'synthseo-publisher')}
              readOnly
              helpText={__('This key will be used to authenticate API requests.', 'synthseo-publisher')}
            />
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={handleGenerateKey}
              disabled={saving}
            >
              {__('Generate Random Key', 'synthseo-publisher')}
            </Button>
          </div>

          {saveMessage && (
            <Alert type={saveMessage.type} dismissible>
              {saveMessage.text}
            </Alert>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ApiKeyManager;