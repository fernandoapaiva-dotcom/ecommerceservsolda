module.exports = {
  apps: [{
    name: 'servsolda',
    script: './backend/src/server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
