const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  ...defaultConfig,
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  entry: {
    admin: path.resolve(__dirname, 'src/admin.js'),
    editor: path.resolve(__dirname, 'src/editor.js'),
  },
  output: {
    ...defaultConfig.output,
    path: path.resolve(__dirname, 'build'),
    filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
    clean: true,
  },
  optimization: {
    minimize: isProduction,
    minimizer: isProduction ? [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console logs in production
            drop_debugger: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ] : [],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        wordpress: {
          test: /[\\/]node_modules[\\/]@wordpress[\\/]/,
          name: 'wordpress-vendor',
          priority: 10,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 5,
        },
      },
    },
  },
  module: {
    ...defaultConfig.module,
    rules: [
      ...defaultConfig.module.rules.filter(rule => {
        // Remove default CSS handling to use our PostCSS setup
        if (rule.test && rule.test.toString().includes('css')) {
          return false;
        }
        return true;
      }),
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@wordpress/babel-preset-default'
            ]
          }
        }
      }
    ]
  },
  resolve: {
    ...defaultConfig.resolve,
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      ...defaultConfig.resolve.alias,
      '@components': path.resolve(__dirname, 'src/components'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@store': path.resolve(__dirname, 'src/store'),
    }
  },
  performance: {
    hints: isProduction ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  stats: {
    modules: false,
    chunks: false,
    children: false,
  }
};