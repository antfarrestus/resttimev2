const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    util: require.resolve('util/'),
    assert: require.resolve('assert/'),
    stream: require.resolve('stream-browserify'),
    url: require.resolve('url/'),
    crypto: require.resolve('crypto-browserify'),
    zlib: require.resolve('browserify-zlib')
  };

  return config;
};