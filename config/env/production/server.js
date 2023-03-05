
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  emitErrors: true,
  url: env('PUBLIC_URL', 'https://api.example.com'),
  proxy: true,
  cron: {
    enabled: env.bool('CRON_ENABLED', false),
  },
});
