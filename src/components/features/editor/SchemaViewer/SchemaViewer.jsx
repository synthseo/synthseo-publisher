import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card } from '../../../ui/Card';
import { Tabs } from '../../../data/Tabs';
import { Button } from '../../../ui/Button';
import { Modal } from '../../../data/Modal';
import { Select } from '../../../forms/Select';
import { Badge } from '../../../ui/Badge';
import { Alert } from '../../../ui/Alert';

const SchemaViewer = ({ 
  postData = {},
  schemaType = 'Article',
  onSchemaUpdate 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState(schemaType);
  const [copied, setCopied] = useState(false);

  const schemaTypes = [
    { value: 'Article', label: __('Article', 'synthseo-publisher') },
    { value: 'BlogPosting', label: __('Blog Post', 'synthseo-publisher') },
    { value: 'NewsArticle', label: __('News Article', 'synthseo-publisher') },
    { value: 'Product', label: __('Product', 'synthseo-publisher') },
    { value: 'Recipe', label: __('Recipe', 'synthseo-publisher') },
    { value: 'Event', label: __('Event', 'synthseo-publisher') },
    { value: 'FAQPage', label: __('FAQ Page', 'synthseo-publisher') },
    { value: 'HowTo', label: __('How-To Guide', 'synthseo-publisher') },
  ];

  const generateSchema = (type) => {
    const baseUrl = window.location.origin;
    const currentDate = new Date().toISOString();
    
    const schemas = {
      Article: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': postData.title || 'Article Title',
        'description': postData.metaDescription || postData.excerpt || '',
        'image': postData.featuredImage || `${baseUrl}/default-image.jpg`,
        'author': {
          '@type': 'Person',
          'name': postData.author || 'Author Name',
        },
        'publisher': {
          '@type': 'Organization',
          'name': postData.siteName || 'Site Name',
          'logo': {
            '@type': 'ImageObject',
            'url': `${baseUrl}/logo.png`,
          },
        },
        'datePublished': postData.publishDate || currentDate,
        'dateModified': postData.modifiedDate || currentDate,
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': postData.url || `${baseUrl}/article`,
        },
      },
      BlogPosting: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': postData.title || 'Blog Post Title',
        'description': postData.metaDescription || postData.excerpt || '',
        'image': postData.featuredImage || `${baseUrl}/default-image.jpg`,
        'author': {
          '@type': 'Person',
          'name': postData.author || 'Author Name',
        },
        'publisher': {
          '@type': 'Organization',
          'name': postData.siteName || 'Site Name',
        },
        'datePublished': postData.publishDate || currentDate,
        'dateModified': postData.modifiedDate || currentDate,
        'articleBody': postData.content || '',
        'keywords': postData.keywords || '',
      },
      Product: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': postData.title || 'Product Name',
        'description': postData.metaDescription || '',
        'image': postData.featuredImage || `${baseUrl}/product-image.jpg`,
        'brand': {
          '@type': 'Brand',
          'name': postData.brand || 'Brand Name',
        },
        'offers': {
          '@type': 'Offer',
          'url': postData.url || `${baseUrl}/product`,
          'priceCurrency': 'USD',
          'price': postData.price || '99.99',
          'availability': 'https://schema.org/InStock',
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.5',
          'reviewCount': '24',
        },
      },
      FAQPage: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Sample question 1?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Sample answer 1',
            },
          },
          {
            '@type': 'Question',
            'name': 'Sample question 2?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Sample answer 2',
            },
          },
        ],
      },
    };

    // Return the selected schema or default to Article
    return schemas[type] || schemas.Article;
  };

  const currentSchema = generateSchema(selectedSchema);
  const schemaString = JSON.stringify(currentSchema, null, 2);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchemaTypeChange = (newType) => {
    setSelectedSchema(newType);
    if (onSchemaUpdate) {
      onSchemaUpdate(newType);
    }
  };

  const validateSchema = () => {
    // Check for required fields
    const issues = [];
    
    if (!postData.title) {
      issues.push(__('Missing headline/title', 'synthseo-publisher'));
    }
    if (!postData.metaDescription && !postData.excerpt) {
      issues.push(__('Missing description', 'synthseo-publisher'));
    }
    if (!postData.featuredImage) {
      issues.push(__('Missing featured image', 'synthseo-publisher'));
    }
    
    return issues;
  };

  const validationIssues = validateSchema();

  const tabs = [
    {
      label: __('Preview', 'synthseo-publisher'),
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Select
              value={selectedSchema}
              onChange={(e) => handleSchemaTypeChange(e.target.value)}
              options={schemaTypes}
              size="sm"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopySchema}
            >
              {copied ? __('Copied!', 'synthseo-publisher') : __('Copy Schema', 'synthseo-publisher')}
            </Button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap break-words">
              {schemaString}
            </pre>
          </div>
        </div>
      ),
    },
    {
      label: __('Validation', 'synthseo-publisher'),
      badge: validationIssues.length || null,
      content: (
        <div className="space-y-4">
          {validationIssues.length === 0 ? (
            <Alert type="success" title={__('Schema Valid', 'synthseo-publisher')}>
              {__('Your schema markup is valid and ready to use.', 'synthseo-publisher')}
            </Alert>
          ) : (
            <>
              <Alert type="warning" title={__('Schema Issues', 'synthseo-publisher')}>
                {__('The following fields are missing or incomplete:', 'synthseo-publisher')}
              </Alert>
              <ul className="space-y-2">
                {validationIssues.map((issue, index) => (
                  <li key={index} className="flex items-center">
                    <Badge variant="warning" size="sm" icon="dot">
                      {issue}
                    </Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
          
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
            >
              {__('Learn More About Schema', 'synthseo-publisher')}
            </Button>
          </div>
        </div>
      ),
    },
    {
      label: __('Settings', 'synthseo-publisher'),
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {__('Schema Type', 'synthseo-publisher')}
            </label>
            <Select
              value={selectedSchema}
              onChange={(e) => handleSchemaTypeChange(e.target.value)}
              options={schemaTypes}
            />
            <p className="mt-1 text-sm text-gray-500">
              {__('Choose the schema type that best describes your content.', 'synthseo-publisher')}
            </p>
          </div>
          
          <Alert type="info">
            {__('Schema markup helps search engines understand your content better and can improve your search appearance.', 'synthseo-publisher')}
          </Alert>
          
          <div className="pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {__('Quick Tips', 'synthseo-publisher')}
            </h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• {__('Use Article for general blog posts', 'synthseo-publisher')}</li>
              <li>• {__('Use Product for e-commerce items', 'synthseo-publisher')}</li>
              <li>• {__('Use FAQPage for Q&A content', 'synthseo-publisher')}</li>
              <li>• {__('Use HowTo for step-by-step guides', 'synthseo-publisher')}</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card
        title={__('Schema Markup', 'synthseo-publisher')}
        headerActions={
          <Badge variant={validationIssues.length > 0 ? 'warning' : 'success'}>
            {selectedSchema}
          </Badge>
        }
        collapsible
        defaultCollapsed={true}
      >
        <Tabs tabs={tabs} />
      </Card>

      {/* Info Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={__('About Schema Markup', 'synthseo-publisher')}
        size="lg"
        footer={
          <Button
            variant="primary"
            onClick={() => setShowModal(false)}
          >
            {__('Got it', 'synthseo-publisher')}
          </Button>
        }
      >
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            {__('Schema markup is code that you put on your website to help search engines return more informative results for users.', 'synthseo-publisher')}
          </p>
          <p>
            {__('By adding schema markup to your HTML, you help search engines understand your content and provide rich snippets in search results.', 'synthseo-publisher')}
          </p>
          <h4 className="font-medium text-gray-900 mt-4">
            {__('Benefits:', 'synthseo-publisher')}
          </h4>
          <ul className="list-disc list-inside space-y-1">
            <li>{__('Enhanced search result appearance', 'synthseo-publisher')}</li>
            <li>{__('Better click-through rates', 'synthseo-publisher')}</li>
            <li>{__('Improved content understanding', 'synthseo-publisher')}</li>
            <li>{__('Voice search optimization', 'synthseo-publisher')}</li>
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default SchemaViewer;