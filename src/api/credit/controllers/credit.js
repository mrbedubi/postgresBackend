'use strict';

/**
 * credit controller
 */
const _ = require("lodash");

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::credit.credit', ({ strapi }) =>  ({


async newCredit(ctx) {
  const {user} = ctx.state;
  const  body = _.pick(ctx.request.body, ['amount' , 'user_id' , 'description']  );
  const date = new Date();

// Validação de Dados
  if (!user) return ctx.badRequest('Não tem autrização para efetuar esta ação');

  if(!body.amount){
    return ctx.badRequest('O valor do credito não foi defenido');
  }

  if(!body.user_id){
    return ctx.badRequest('User distinatário do crédito em falta');
  }

  if (body.amount <= 0)  return ctx.badRequest('O valor a transferir deve ser superior  a 0€');


  const userInfo = await strapi.entityService.findOne('plugin::users-permissions.user', body.user_id , {
    fields: ['email', 'username'],
    populate: {
      UserDetails:{
        fields: [  'balance'],
      }},
  });
  console.log(userInfo);

  if(!userInfo) return ctx.badRequest('O user selecionado não foi encontrado');

  // Fim de validação de dados

  const transfer  = await strapi.entityService.create('api::transaction.transaction',  {
    data: {
      transferType : 'credito',
      amount: body.amount,
      transactionDate: date,
      transferStatus :  "Aprovada",
      status : true,
      user:{ connect: [{ id: body.user_id }] }
    },
  });

  const approval  = await strapi.entityService.create( 'api::approval.approval',  {
    data: {
      dateAproval: date,
      dateRequest : date,
      transaction : { connect: [transfer.id] },
      gestor : { connect: [user.id] },
      approved: true
    },
  });


  const credit  = await strapi.entityService.create( 'api::credit.credit',  {
    data: {
      description: "blabla",
      service : body.description,
      amount: body.amount,
      transaction : { connect: [transfer.id] },
      user : { connect: [body.user_id] },
    },
  });


  const update = await strapi.entityService.update('plugin::users-permissions.user', userInfo.id , {
    data: {
      UserDetails:{
        id: userInfo.UserDetails.id,
        balance: userInfo.UserDetails.balance + body.amount
      }
    }
  });

  return ({message: 'Crédito realizado com sucesso'});

},

  }));



