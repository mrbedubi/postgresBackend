'use strict';

/**
 * transaction controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::transaction.transaction', ({ strapi }) =>  ({


  async owned(ctx ) {
    const { user } = ctx.state;

    if (!user) {
      return ctx.unauthorized();
    }
    console.log(user.id)
    const result = await strapi.entityService.findMany('api::transaction.transaction', {
      filters: {
        user: {
          id: {
            $eq: user.id
          }
        },
      },
    });
    console.log(result)
    return result;
  },

  async findowned(ctx) {
    const { user } = ctx.state;
    const { id } = ctx.request.params
    if (!user) {
      return ctx.unauthorized();
    }
    console.log(user.id);
    const result = await strapi.entityService.findOne('api::transaction.transaction', id, {
      filters: {
        user: {
          id: {
            $eq: user.id
          }
        },
      },
    });
    console.log(user);
    console.log(result);
    return result;
  }




}));
