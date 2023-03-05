
module.exports = ({ env }) => ({
  proxy: true,
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('APP_URL','dev-mudamuda.dpixel.pt'), // Sets the public URL of the application.
  app: {
    url: env('APP_URL','dev-mudamuda.dpixel.pt/admin'), // Sets the public URL of the application.
    keys: env.array('APP_KEYS')
  },
});
