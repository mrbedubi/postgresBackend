'use strict';

/**
 * credit controller
 */
const _ = require("lodash");

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::credit.credit', ({ strapi }) =>  ({


async newCredit(ctx) {
  const {user} = ctx.state;
  console.log(user);
  if (!user) return ctx.badRequest('Não tem autrização para efetuar esta ação');

  const transfer  = await strapi.entityService.create('api::transaction.transaction',  {
    data: {
      transferType : 'debito',
      amount: amount,
      transferToIban: IBAN,
      transactionDate: date,
      user:{ connect: [
          { id: user.id },
        ], }
    },
  });


},

  }));



