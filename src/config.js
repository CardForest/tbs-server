module.exports = {
  mainStaticDir: process.env.MAIN_STATIC_DIR,
  bowerStaticDir: process.env.BOWER_STATIC_DIR,
  port: process.env.PORT || 9000,
  browserSyncProxyEnabled: !!process.env.BROWSER_SYNC_PORT,
  browserSyncProxyPort: process.env.BROWSER_SYNC_PORT
};
