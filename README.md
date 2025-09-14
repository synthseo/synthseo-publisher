=== SynthSEO Publisher ===
Contributors: lecole
Tags: seo, content, publishing, api, automation
Requires at least: 5.0
Tested up to: 6.8
Stable tag: 2.0.2
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Secure REST API bridge for automated SEO-optimized content publishing from SynthSEO platform to WordPress.

== Description ==

SynthSEO Publisher is a WordPress plugin that acts as a secure bridge between your WordPress site and the SynthSEO content generation platform. It provides a REST API interface for automated content publishing with full SEO metadata support.

= ✨ Key Features =

* **🔒 Secure REST API** - API key authentication for secure content delivery
* **📈 SEO Metadata Support** - Full support for meta descriptions, keywords, Open Graph, and Twitter Cards
* **🖼️ Media Handling** - Automatic featured image upload and optimization
* **📦 Batch Publishing** - Publish multiple articles in a single request
* **🛡️ Rate Limiting** - Built-in protection against API abuse
* **⚛️ Modern Admin Interface** - React-based settings panel with real-time connection testing
* **🔧 WordPress Integration** - Seamless integration with WordPress post types and taxonomies
* **🎯 Debug Mode** - Comprehensive debugging tools for troubleshooting

= 🚀 What's New in Version 2.0.0 =

* Complete React 18 migration (removed all jQuery dependencies)
* Modern tabbed interface for better organization
* Real-time connection testing
* Enhanced debug mode with post data inspection
* Performance improvements with optimized production builds
* Support for all post statuses (draft, published, pending, etc.)

= 🔌 API Endpoints =

* `GET /wp-json/synthseo/v2/status` - Check connection and plugin status
* `POST /wp-json/synthseo/v2/publish` - Publish single article
* `POST /wp-json/synthseo/v2/batch` - Batch publish multiple articles
* `PUT /wp-json/synthseo/v2/update/{id}` - Update existing post
* `DELETE /wp-json/synthseo/v2/delete/{id}` - Delete post
* `GET /wp-json/synthseo/v2/schema` - Get available fields schema

= Requirements =

* WordPress 5.0 or higher
* PHP 7.4 or higher
* MySQL 5.6 or higher
* HTTPS recommended for API security

== Installation ==

= WordPress Admin Installation =

1. Download the latest release ZIP file
2. Go to WordPress Admin → Plugins → Add New
3. Click "Upload Plugin" and select the ZIP file
4. Click "Install Now" then "Activate"

= Manual Installation =

1. Upload the plugin files to `/wp-content/plugins/synthseo/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to Settings → SynthSEO to configure

= Configuration =

After activation:

1. Go to **Settings → SynthSEO Publisher**
2. Copy the **API Base URL** (your WordPress site URL)
3. Copy the **API Key** (automatically generated)
4. Enter these credentials in your SynthSEO platform
5. Set your preferred **Rate Limit** (requests per minute)
6. Enable **Debug Logging** if troubleshooting
7. Click **Test Connection** to verify setup

== Frequently Asked Questions ==

= Is this plugin secure? =

Yes. The plugin uses API key authentication, rate limiting, and WordPress nonces for security. All requests are validated and sanitized.

= Can I use this with other SEO plugins? =

Yes. SynthSEO Publisher is designed to work alongside popular SEO plugins like Yoast SEO, RankMath, and All in One SEO.

= What happens to my content if I deactivate the plugin? =

Your content remains intact. The plugin only handles the publishing interface - all content is stored as regular WordPress posts.

= Can I customize which post types to use? =

Currently, the plugin publishes to the standard WordPress 'post' type. Custom post type support is planned for future releases.

= How do I troubleshoot connection issues? =

1. Enable Debug Logging in settings
2. Check the Status tab for connection test
3. Navigate to Debug tab to inspect post data
4. Verify your API key is correctly configured
5. Ensure your WordPress REST API is accessible
6. Check your server's error logs

= What post statuses are supported? =

The plugin supports all WordPress post statuses including draft, publish, pending, private, future (scheduled), and trash.

== Screenshots ==

1. Main settings page with API configuration
2. Connection status and testing interface
3. API documentation tab with endpoint details
4. Debug panel showing complete post data structure

== Changelog ==

= 2.0.2 =
* Fixed: WordPress Plugin Review compliance issues
* Fixed: Text domain changed to match plugin slug 'synthseo'
* Fixed: PHP syntax error in inline styles (escaped quotes)
* Fixed: Added proper nonce verification to media uploads
* Fixed: Escaped all output including PHP_VERSION
* Fixed: Moved inline styles to wp_add_inline_style()
* Fixed: Added conditional checks for WordPress core scripts
* Added: Source code documentation and build instructions
* Updated: Contributors list to match WordPress.org username

= 2.0.0 =
* Major update: Complete React 18 migration for admin interface
* Removed all jQuery dependencies
* Added tabbed interface for better organization
* Improved connection testing with real-time feedback
* Enhanced API documentation in admin
* Added comprehensive debug mode for troubleshooting
* Performance improvements with production builds
* Better error handling and user feedback
* Support for all post statuses (draft, publish, etc.)
* Modern UI with TailwindCSS v4.1

= 1.0.0 =
* Initial release
* Basic API endpoints for content publishing
* jQuery-based admin interface
* API key authentication
* Rate limiting functionality

== Build from Source ==

The production files in `/build/` are compiled from the source files in `/src/`.

= Source Code Structure =
* `/src/admin/` - React admin interface source code
* `/src/editor/` - Post editor enhancements source
* `/src/components/` - Reusable React components
* `/src/hooks/` - Custom React hooks
* `/src/utils/` - Utility functions
* `/src/styles/` - CSS source files

= Build Instructions =
1. Install dependencies: `npm install`
2. Development build: `npm run dev`
3. Production build: `npm run build`

The source code is also available on GitHub:
[https://github.com/lecole/synthseo-publisher](https://github.com/synthseo/synthseo-publisher)

== Upgrade Notice ==

= 2.0.0 =
Major update with new React-based admin interface. Backup recommended before upgrading. All jQuery dependencies removed.

== API Documentation ==

= Authentication =

All API requests must include the `X-API-Key` header:

`X-API-Key: YOUR_API_KEY_HERE`

= Example Request =

`
POST /wp-json/synthseo/v2/publish
Content-Type: application/json
X-API-Key: YOUR_API_KEY_HERE

{
  "title": "Article Title",
  "content": "Article content with HTML markup...",
  "excerpt": "Brief article summary",
  "meta_description": "SEO meta description",
  "keywords": ["keyword1", "keyword2"],
  "author": "Author Name",
  "featured_image": "https://example.com/image.jpg",
  "categories": ["Technology", "WordPress"],
  "tags": ["api", "automation"]
}
`

= Response Format =

`
{
  "success": true,
  "data": {
    "id": 123,
    "link": "https://yoursite.com/article-title/",
    "status": "publish"
  }
}
`

== Development ==

= Build from Source =

The plugin uses modern JavaScript tooling with React 18 and Webpack 5.

**Requirements:**
* Node.js 18+
* npm or yarn
* WordPress 5.0+
* PHP 7.4+

**Available Scripts:**
* `npm run start` - Development build with watch
* `npm run build` - Production build
* `npm run build:dev` - Development build
* `npm run clean` - Clean build artifacts
* `npm run release` - Create release package
* `npm run lint:js` - Run linting
* `npm run format` - Format code

= Project Structure =

* `/build/` - Compiled assets
* `/includes/` - PHP classes
* `/src/` - React source files
* `/src/components/` - React components
* `/src/contexts/` - React contexts
* `/src/hooks/` - Custom hooks
* `/src/styles/` - CSS/Tailwind styles
* `/src/admin.js` - Admin interface entry
* `/src/editor.js` - Post editor entry

== Debug Mode ==

The plugin includes a comprehensive debug mode for development:

**To enable the Debug tab:**

Add these constants to your `wp-config.php`:
```php
define('WP_DEBUG', true);
define('SYNTHSEO_DEVELOPMENT', true);
```

**Note:** The Debug tab is only available in development environments and will not appear in production releases.

When enabled, the Debug tab shows:
* Complete post data structure
* All metadata fields
* Post status breakdown
* API configuration
* WordPress dependencies status

== Support ==

For support, feature requests, or bug reports:

* Documentation: Available in plugin's Documentation tab
* GitHub: [https://github.com/synthseo/publisher](https://github.com/synthseo/synthseo-publisher)
* Support: https://www.synthseo.ai/support

== Privacy Policy ==

This plugin does not collect any personal data. It only processes content submitted through the API for publishing on your WordPress site.

= Third Party Services =

This plugin communicates with the SynthSEO platform (https://www.synthseo.ai) to receive content for publishing. By using this plugin, you agree to SynthSEO's terms of service and privacy policy.

Data sent to SynthSEO:
* Publishing status and confirmation
* Error messages (for debugging)

Data received from SynthSEO:
* Post content and metadata
* SEO optimization data
* Media files for upload

== License ==

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program; if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.

== Credits ==

* SynthSEO Development Team
* WordPress Community
* React and WordPress Packages Contributors

---

For more information, visit [SynthSEO.ai](https://www.synthseo.ai)
## Development

### Building from Source

The plugin includes all source files for transparency and contribution.

1. Install dependencies: `npm install`
2. Development build: `npm run dev`
3. Production build: `npm run build`

### Contributing

We welcome contributions! Please visit our [GitHub repository](https://github.com/synthseo/synthseo-publisher) to submit issues or pull requests.

### Support

For support, please visit [SynthSEO.ai](https://www.synthseo.ai) or create an issue on GitHub.
