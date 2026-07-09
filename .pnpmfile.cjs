const RADIX_OVERLAY_PACKAGES = new Set([
  '@radix-ui/react-dialog',
  '@radix-ui/react-popover',
]);

module.exports = {
  hooks: {
    readPackage(pkg) {
      if (RADIX_OVERLAY_PACKAGES.has(pkg.name)) {
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies['react-remove-scroll'] = pkg.dependencies['react-remove-scroll'] || '2.7.2';
      }

      return pkg;
    },
  },
};
