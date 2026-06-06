const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// ── Monorepo: @navlonix/shared kaynagini (packages/shared/src) coz ──────────
// Metro symlink workspace paketlerini varsayilan cozmez; watchFolders ile
// shared kaynagini izle, extraNodeModules ile bare import'u dizine esle,
// nodeModulesPaths ile cozumleme yollarini acikca belirt.
const workspaceRoot = path.resolve(projectRoot, '../../..');
const sharedPkg = path.resolve(workspaceRoot, 'packages', 'shared');
const sharedRoot = path.join(sharedPkg, 'src');

config.watchFolders = [...(config.watchFolders ?? []), sharedPkg];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@navlonix/shared': sharedRoot,
};

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

// '@navlonix/shared' (ve alt yollari) -> packages/shared/src dosyalarina ELLE map.
// Dev server (expo start) resolution'i extraNodeModules'u export kadar guvenilir
// cozmuyor; bare specifier'i acikca dosyaya baglamak hem dev hem export'ta calisir.
function resolveSharedFile(moduleName) {
  const sub =
    moduleName === '@navlonix/shared'
      ? 'index'
      : moduleName.slice('@navlonix/shared/'.length);
  const base = path.join(sharedRoot, sub);
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    path.join(base, 'index.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@navlonix/shared' || moduleName.startsWith('@navlonix/shared/')) {
    const filePath = resolveSharedFile(moduleName);
    if (filePath) {
      return { type: 'sourceFile', filePath };
    }
  }

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
