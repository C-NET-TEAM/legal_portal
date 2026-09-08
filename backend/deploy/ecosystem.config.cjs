module.exports = {
  apps: [
    {
      name: 'legal-portal-backend',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        UPLOAD_DIR: '/data/legal_portal/uploads'
      }
    }
  ]
};
