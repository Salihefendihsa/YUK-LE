const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

const signalrBrowser = path.join(
  projectRoot,
  'node_modules',
  '@microsoft',
  'signalr',
  'dist',
  'browser',
  'signalr.js',
);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === '@microsoft/signalr') {
    return { type: 'sourceFile', filePath: signalrBrowser };
  }

  if (
    moduleName.startsWith('.') &&
    context.originModulePath?.includes(`${path.sep}@microsoft${path.sep}signalr${path.sep}`)
  ) {
    const dir = path.dirname(context.originModulePath);
    for (const ext of ['.js', '.mjs', '.cjs']) {
      const candidate = path.join(dir, `${moduleName}${ext}`);
      if (fs.existsSync(candidate)) {
        return { type: 'sourceFile', filePath: candidate };
      }
    }
  }

  if (
    moduleName === 'zustand' ||
    (moduleName.startsWith('zustand/') && !moduleName.endsWith('.js'))
  ) {
    const cjsModule = moduleName === 'zustand' ? 'zustand/index.js' : `${moduleName}.js`;
    return originalResolveRequest
      ? originalResolveRequest(context, cjsModule, platform)
      : context.resolveRequest(context, cjsModule, platform);
  }

  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
