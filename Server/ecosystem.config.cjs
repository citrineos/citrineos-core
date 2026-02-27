// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

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
      node_args: '--inspect=0.0.0.0:9229',
      env_production: {
        APP_ENV: 'local',
        APP_NAME: 'all',
        BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE: 'local',
        BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH: '/data',
      },
    },
  ],
};
