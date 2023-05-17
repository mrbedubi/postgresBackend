'use strict';

/**
 * approval controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::approval.approval', ({ strapi }) =>  ({

  async approve(ctx) {
    console.log("sddsd");
    const {user} = ctx.state;
    const data = ctx.request.body
    const {transferproof} = ctx.request.files;
    const trans_id = data.id;
    const approved = Boolean(data.approved);

    console.log(data);
    console.log(approved);


    const transaction = await strapi.entityService.findOne('api::transaction.transaction', trans_id,{
      fields: ['id','transferType' , 'amount' , 'transactionDate' , 'complete'],
      populate: '*'

    });





    if  (transaction.transferType==='credito'){
    return  ctx.badRequest('Não foi possivel realizar esta operação');
    }

    if  (transaction.complete){
      return  ctx.badRequest('Esta transação já foi aprovada');
    }



    const recipient = await  strapi.entityService.findOne('plugin::users-permissions.user', transaction.user.id,{
      fields: ['email', 'username'],
      populate: {
        UserDetails:{
          fields: ['id',  'balance' , 'holdBalance'],
        }},
    });
    console.log(recipient);
    if (!recipient){
      return ctx.badRequest('este utilizador não existe')
    }

    console.log(approved ? 'Aprovada' : 'Recusada');

    const UpdateTransaction = await strapi.entityService.update('api::transaction.transaction', trans_id,{
      data: {
        status : approved ,
        complete: true ,
        transferStatus: approved ? 'Aprovada' : 'Recusada'
      }
    });
    console.log(UpdateTransaction)

    const history  = await strapi.entityService.create('api::transaction-history.transaction-history',  {
      data: {
        state: approved ? 'Aprovada' : 'Recusada',
        date: new Date,
        transaction :  { connect: [transaction.id] }
      },
    });


    if(transferproof){
      const  approval = await strapi.entityService.create('api::approval.approval',{
        data:{
          gestor: { connect: [user.id] },
          transaction :  { connect: [transaction.id] },
          dateAproval : new Date,
          dateRequest: transaction.transactionDate ,
          approved : approved,
          motive: data.motive!=='' || data.motive !==" "  ? data.motive : null,
        },populate:{transferProof:true},
        files:{
          transferProof: transferproof
        }

      });
    } else{
      const  approval = await strapi.entityService.create('api::approval.approval',{
        data:{
          gestor: { connect: [user.id] },
          transaction :  { connect: [transaction.id] },
          dateAproval : new Date,
          dateRequest: transaction.transactionDate ,
          approved : approved,
          motive: data.motive!=='' || data.motive !==" "  ? data.motive : null,
        },
      });
    }


if (approved){
// if the transaction is approved
  const Update = await  strapi.entityService.update('plugin::users-permissions.user', transaction.user.id , {
   data:{
     UserDetails:{
       id: recipient.UserDetails.id,
       holdBalance : recipient.UserDetails.holdBalance - transaction.amount,
     }
   }

  })
  console.log("Updkk",Update );

}else {
// if the transaction is rejected

  await strapi.entityService.update('plugin::users-permissions.user', transaction.user.id , {
data:{
  UserDetails:{
    id: recipient.UserDetails.id,
    holdBalance : recipient.UserDetails.holdBalance - transaction.amount,
    balance : recipient.UserDetails.balance + transaction.amount
  }
}
  })



}

    const recipientUpdate = await  strapi.entityService.findOne('plugin::users-permissions.user', transaction.user.id,{
      fields: ['email', 'username'],
      populate: {
        UserDetails:{
          fields: ['id',  'balance' , 'holdBalance'],
        }},
    });

    console.log("old",recipient );
    console.log("new",recipientUpdate );

    ctx.send({ message: 'Success' });

  }

}));
