// PM2 ecosystem file for CitrineOS core Server
// Runs the built Server app (./Server/dist/index.js) in cluster mode across CPUs.
module.exports = {
  apps: [
    {
      name: 'citrineos-server',
      script: './Server/dist/index.js',
      // Use the 'cluster' mode to take advantage of multiple CPU cores
      exec_mode: 'cluster',
      // Use max instances to scale to number of CPU cores available
      instances: 'max',
      // Restart on crash
      autorestart: true,
      // Merge logs from stdout and stderr
      merge_logs: true,
      // Log file locations (relative to repo root)
      error_file: './logs/citrineos-error.log',
      out_file: './logs/citrineos-out.log',
      // Environment variables for production run; PM2 will pick the 'production' env by default when --env production is used
      env_production: {
        APP_ENV: 'production',
        APP_NAME: 'all',
      },
    },
  ],
};
