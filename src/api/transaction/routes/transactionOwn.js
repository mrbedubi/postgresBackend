
module.exports = {
  routes: [
    {
      "method": "GET",
      "path": "/transaction/owned",
      "handler": "transaction.owned",
      "config": {

      }
    },

    {
      "method": "GET",
      "path": "/transaction/findowned/:id",
      "handler": "transaction.findowned",
      "config": {

      }
    },
  ]
}
