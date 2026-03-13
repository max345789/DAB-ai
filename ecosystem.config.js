module.exports = {
  apps: [
    {
      name: 'dab-ai-backend',
      script: './server/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        // Default to 5001 because macOS "ControlCe" sometimes binds 5000 locally.
        PORT: Number(process.env.BACKEND_PORT || process.env.PORT || 5001),
      },
    },
    {
      name: 'dab-ai-frontend',
      script: 'npm',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.FRONTEND_PORT || 3000,
      },
    },
  ],
};
