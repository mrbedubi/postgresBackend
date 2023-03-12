module.exports = ({env}) => ({
    email: {
      config: {
        provider: 'sendgrid',
        providerOptions: {
          apiKey: env('SENDGRID_API_KEY'),
        },
        settings: {
          defaultFrom: 'noreplay@dpixel.pt',
          defaultReplyTo: 'noreplay@dpixel.pt',
        },
      },
    },
    upload: {
      config: {
        providerOptions: {
          localServer: {
            maxage: 300000
          },
        },
      },
    },



});
