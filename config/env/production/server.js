
module.exports = ({ env }) => ({
  proxy: true,
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 80),
  url: env('APP_URL','dev-mudamuda.dpixel.pt'), // Sets the public URL of the application.
  app: {
    keys: env.array('APP_KEYS')
  },
});
