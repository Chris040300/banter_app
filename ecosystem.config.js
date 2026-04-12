module.exports = {
  apps: [
    {
      name: 'banter',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // REQUIRED: Set these in your environment or pm2 ecosystem before starting
        // NEXTAUTH_SECRET: 'generate with: openssl rand -base64 32',
        // NEXTAUTH_URL: 'http://<your-pi-ip>:3000',
        // DATABASE_PATH: './banter.db',
      },
    },
  ],
};
