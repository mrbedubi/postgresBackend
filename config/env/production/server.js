module.exports = ({ env }) => ({
  url: env('WEBSITE_URL'),
  port: process.env.PORT,
  app: {
    keys: env.array('APP_KEYS')
  },
});
