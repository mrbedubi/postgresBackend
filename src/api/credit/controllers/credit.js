'use strict';

/**
 * credit controller
 */
const _ = require("lodash");

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::credit.credit', ({ strapi }) =>  ({


async newCredit(ctx) {
  const {user} = ctx.state;
  const  body = _.pick(ctx.request.body, ['amount' , 'user_id' , 'description' , 'serviceValue']  );
  const date = new Date();

  if(ctx.request.files === undefined){
    return ctx.badRequest("Ficheiro em falta");
  }else if(ctx.request.files.serviceProof === undefined ){
    return ctx.badRequest("Ficheiro em falta");
  }

  // verify if service value exist and if is number else return error
  if(body.serviceValue){
    body.serviceValue= parseFloat(body.serviceValue);
  }else if(body.serviceValue === undefined){
    return ctx.badRequest("Valor do serviço em falta");
  }

body.amount= parseFloat(body.amount);
  console.log(body.amount);
// Validação de Dados
  if (!user) return ctx.badRequest('Não tem autrização para efetuar esta ação');

  if(!body.amount){
    return ctx.badRequest('O valor do credito não foi defenido');
  }

  if(!body.user_id){
    return ctx.badRequest('Distinatário do crédito em falta');
  }

  if (body.amount <= 0)  return ctx.badRequest('O valor a transferir deve ser superior  a 0€');


  const userInfo = await strapi.entityService.findOne('plugin::users-permissions.user', body.user_id , {
    fields: ['email', 'username'],
    populate: {
      UserDetails:{
        fields: ['balance', 'firstName', 'surname'],
      },

      referrals:{
        fields: ['id'],
      }

      },

  });
  console.log(userInfo);

  if(userInfo.length ===0 ) return ctx.badRequest('O user com o Id '+body.user_id +' selecionado não foi encontrado');


  // Fim de validação de dados

  const transfer  = await strapi.entityService.create('api::transaction.transaction',  {
    data: {
      transferType : 'credito',
      amount: body.amount,
      transactionDate: date,
      transferStatus :  "Aprovada",
      complete : true,
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
      description: body.description,
      service : body.description,
      amount: body.amount,
      serviceValue: body.serviceValue,
      transaction : { connect: [transfer.id] },
      user : { connect: [body.user_id] },
      populate:{
        serviceProof:{
          fields: ['name', 'url'],
        },
      }
    },
    files:ctx.request.files
  });


  const update = await strapi.entityService.update('plugin::users-permissions.user', userInfo.id , {
    data: {
      UserDetails:{
        id: userInfo.UserDetails.id,
        balance: userInfo.UserDetails.balance + body.amount
      }
    }
  });



  if (userInfo.referrals) {

    const refAmount = parseFloat((body.amount * 0.2).toFixed(2));

    const RefUserInfo = await strapi.entityService.findOne('plugin::users-permissions.user', userInfo.referrals.id , {
      fields: ['email', 'username'],
      populate: {
        UserDetails:{
          fields: ['balance'],
        }
      },

    });
    console.log('User Ref  ',RefUserInfo);


    const RefTransfer  = await strapi.entityService.create('api::transaction.transaction',  {
      data: {
        transferType : 'credito',
        amount: refAmount,
        transactionDate: date,
        transferStatus :  "Aprovada",
        complete : true,
        referral_from: { connect: [{ id: userInfo.id }] },
        user:{ connect: [{ id: RefUserInfo.id }] }
      },
    });

    const RefApproval  = await strapi.entityService.create( 'api::approval.approval',  {
      data: {
        dateAproval: date,
        dateRequest : date,
        transaction : { connect: [RefTransfer.id] },
        gestor : { connect: [user.id] },
        approved: true
      },
    });


    const RefCredit  = await strapi.entityService.create( 'api::credit.credit',  {
      data: {
        description: 'Comissão de referência de '+userInfo.UserDetails.firstName +' '+ userInfo.UserDetails.surname,
        service : 'Comissão de referência de '+userInfo.UserDetails.firstName +' '+ userInfo.UserDetails.surname ,
        amount: refAmount,
        transaction : { connect: [RefTransfer.id] },
        user : { connect: [RefUserInfo.id] },
      },
    });


    const RefUpdate = await strapi.entityService.update('plugin::users-permissions.user', RefUserInfo.id , {
      data: {
        UserDetails:{
          id: RefUserInfo.UserDetails.id,
          balance: RefUserInfo.UserDetails.balance + refAmount,
        }
      }
    });
    console.log('User Ref com precentagem do credito ', RefUpdate)
  }


  return ({message: 'Crédito realizado com sucesso'});

},

  }));



