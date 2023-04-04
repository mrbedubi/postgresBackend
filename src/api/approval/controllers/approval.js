'use strict';

/**
 * approval controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::approval.approval', ({ strapi }) =>  ({

  async approve(ctx) {
    console.log("sddsd");
    const {user} = ctx.state;
    const data = ctx.request.body ;

    console.log(data);
   /* const obj = {
      id : number ,
      approved : 0|1 ,
      motive : 's',
      transferProof;
    }
    */
    const trans_id = data.id;

    console.log(trans_id);


    const transaction = await strapi.entityService.findOne('api::transaction.transaction', trans_id,{
      fields: ['id','transferType' , 'amount' , 'transactionDate' , 'complete'],
      populate: '*'

    });





    if  (transaction.transferType==='credito'){
    return  ctx.badRequest('Não foi possivel realizar esta operação');
    }

    if  (transaction.complete){
      return  ctx.badRequest('Esta trnasação já foi aprovada');
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

    console.log(data.approved ? 'Aprovada' : 'Recusada');

    const UpdateTransaction = await strapi.entityService.update('api::transaction.transaction', trans_id,{
      data: {
        status : data.approved ,
        complete: true ,
        transferStatus: data.approved ? 'Aprovada' : 'Recusada'
      }
    });
    console.log(UpdateTransaction)

    const history  = await strapi.entityService.create('api::transaction-history.transaction-history',  {
      data: {
        state: data.approved ? 'Aprovada' : 'Recusada',
        date: new Date,
        transaction :  { connect: [transaction.id] }
      },
    });


    const  approval = await strapi.entityService.create('api::approval.approval',{
      data:{
        gestor: { connect: [user.id] },
        transaction :  { connect: [transaction.id] },
        dateAproval : new Date,
        dateRequest: transaction.transactionDate ,
        approved : data.approved,
        motive: data.motive,
        transferProof : data.transferProof || null
      }

    });

    console.log(recipient.UserDetails.holdBalance -transaction.amount);

if (data.approved){
// if the transaction is approved
  console.log('ola');
  const Update = await  strapi.entityService.update('plugin::users-permissions.user', transaction.user.id , {
   data:{
     UserDetails:{
       id: recipient.UserDetails.id,
       holdBalance : recipient.holdBalance - transaction.amount,
     }
   }

  })
  console.log("Update",Update );

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
  console.log("Update",Update );


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

return 'success';

  }

}));
