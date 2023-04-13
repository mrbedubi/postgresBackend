'use strict';

const _ = require("lodash");


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
      sort: { transactionDate: 'desc' },
      populate:{
        credits:{
          fields: ['id', 'amount', 'service', 'serviceValue'],
        }
      },
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
      populate: {
        user:{
          fields: ['id'],
        },
        attachements:{
          fields: ['name', 'url'],
        },
        approval:{
          fields: ['id','motive'],
          populate: {
            gestor:{
              fields: ['id'],
              populate: {
                UserDetails:{
                  fields: ['firstName' , 'surname'],
                }
              }
            },
            transferProof:{
              fields: ['name', 'url'],
            }
          }
        },

        credits: {
          fields: ['id', 'service', 'serviceValue' ,'description'  ],
          populate: {
            serviceProof:{
              fields: ['name', 'url'],
            }
          }

        },

        },




    });
    if (!result) {
      return ctx.badRequest('this transaction does not exist');
    }


    console.log(result)

    if(result.user.id !== user.id) {
      return ctx.unauthorized();
    }

 ;
    return result;
  },


  async withdraw(ctx) {
    const { user } = ctx.state;
    if (!user) {
      return ctx.unauthorized();
    }


    if(ctx.request.body.amount < 0) {
      return ctx.unauthorized();
    }
    const data = _.pick(ctx.request.body, ['amount' , 'data']  );
    console.log(data);
    console.log(ctx.request.files);
    console.log(ctx.request.files.attachements);
    if(ctx.request.files.attachements === undefined){
      return ctx.badRequest("Ficheiro em falta");
    }

    const userInfo = await strapi.entityService.findOne('plugin::users-permissions.user', user.id , {
      fields: ['email', 'username'],
      populate: {
        UserDetails:{
          fields: ['id','IBAN' ,'firstName' , 'surname' , 'balance' ,'holdBalance'],
        }},
    });

    console.log(userInfo);

    // USER VERIFICATION //
    let amount = Number(parseFloat(data.amount).toFixed(2));
    const balance = userInfo.UserDetails.balance;


    if (typeof amount !== "number" && !isNaN(amount)) {
      return ctx.badRequest("Intruduza um valor valido");
    }


    if(balance < amount) {
      return ctx.badRequest("Fundos insuficientes para realizar esta operação");
    }

    const name=userInfo.UserDetails.firstName + " " + userInfo.UserDetails.surname;

    const email= userInfo.email;
    const username= userInfo.username;
    const balacehold = userInfo.UserDetails.holdBalance;
    const IBAN = userInfo.UserDetails.IBAN;
    const date = new Date();
    const newbalance = balance - amount;
    const newholdbalance = balacehold + amount;




    if (newbalance < 0) {
      return ctx.badRequest("Fundos insuficientes para realizar esta operação");
    }

    if(!IBAN){
      return ctx.badRequest("Tem que associar um Iban antes à sua conta para realizar esta operação")
    }

    if(!IBAN){
      return ctx.badRequest("Tem que associar um Iban antes à sua conta para realizar esta operação")
    }
    // END USER VERIFICATION //


    const history  = await strapi.entityService.create('api::transaction-history.transaction-history',  {
      data: {
        state: 'Pendente',
        date: date,
      },
    });




    const historyId =history.id;

    const transfer  = await strapi.entityService.create('api::transaction.transaction',  {
      data: {
        transferType : 'debito',
        amount: amount,
        transferStatus: 'Pendente',
        transferToIban: IBAN,
        transactionDate: date,
        user:{ connect: [
            { id: user.id },
          ], },
        transaction_history:{ connect: [
            { id: historyId },
          ], }
      },
      files:ctx.request.files  ,
      populate:{attachements:true},
    });
    console.log("Transfer Created : ", transfer);
    /*
    const approval  = await strapi.entityService.create( 'api::approval.approval',  {
      data: {
        dateRequest: date,
        transaction : { connect: [transfer.id] },
      },
    });

*/

    // ROLLBACK //

    if(!transfer || !history /*|| !approval */) {
      if(transfer) {
        await strapi.entityService.delete('api::transaction.transaction', history.id);
      }
        if(history) {
          await strapi.entityService.delete('api::transaction-history.transaction-history', history.id);
        }
        /*
          if(approval) {
            await strapi.entityService.delete('api::approval.approval', history.id);
          }
          */


      return ctx.badRequest('Ocorreu um erro ao realizar esta operação , contacte a equipa da mudamuda para mais detalhes');
    }

    const Update = await strapi.entityService.update('plugin::users-permissions.user', user.id , {
     data: {
       UserDetails:{
         id: userInfo.UserDetails.id,
         balance: newbalance,
         holdBalance: newholdbalance,


       }
     }
    });

    const transferDetails= {

      idTransferencia : transfer.id,
      nome : name,
      username : username,
      email : email,
      montante: amount,
      saldo : newbalance,
      retido : balacehold,
      iban : IBAN,
      date : date,

    }

    return ({message: 'Transferencia realizada com sucesso', data: transferDetails});

  }




}));
