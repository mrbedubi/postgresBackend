module.exports =  ({ env }) => ({
	connection: {
		client: 'postgres',
		connection: {
		host: env('DATABASE_HOST', ' dev_mudamuda'),
			port: env.int('DATABASE_PORT', 5432),
			database: env('DATABASE_NAME', 'dev_mudamuda'),
			user: env('DATABASE_USERNAME', 'postgres'),
			password: env('DATABASE_PASSWORD', 'c9f47a7271cb92d1dd50c3712ffff8b5'),
			ssl: env.bool('DATABASE_SSL', false)
		}
	}
});
