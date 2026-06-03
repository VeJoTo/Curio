const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules/.pnpm/node_modules'),
];

// TypeScript workspace packages use `.js` extensions in import paths (ESM convention),
// but Metro needs to find the actual `.ts` source files.  When a request ends in `.js`
// and comes from inside the workspace, retry it with a `.ts` extension instead.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.js')) {
    const tsName = `${moduleName.slice(0, -3)}.ts`;
    try {
      return context.resolveRequest(context, tsName, platform);
    } catch (_) {
      // fall through to original resolution
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
