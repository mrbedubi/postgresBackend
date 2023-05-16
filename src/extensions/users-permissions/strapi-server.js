
/*

module.exports=(plugin)=>{
  plugin.controllers.user.updateMe = async (ctx) =>{
    if(!ctx.state.user || !ctx.state.user.id){
      return ctx.response.status=401;
    }

    await strapi.query('plugin::users-permissions.user').update({
      where:{id:ctx.state.user.id},
      data:ctx.request.body
    }).then((res)=>{
      ctx.response.status=200;
    })
  }

  plugin.routes['content-api'].routes.push(
    {
      method:"PUT",
      path:"/user/me",
      handler:"user.updateMe",
      config:{
        prefix:"",
        policies:[]
      }
    }
  )
  return plugin ;
}
*/




 const _ = require('lodash');
const axios = require("axios");
const { yup, validateYupSchema } = require('@strapi/utils');

const callbackSchema = yup.object({
  identifier: yup.string().required(),
  password: yup.string().required(),
});

const registerSchema = yup.object({
  email: yup.string().email().required(),
  username: yup.string().required(),
  password: yup.string().required(),
});

module.exports = {

  validateRegisterBody: validateYupSchema(registerSchema),

};


module.exports = (plugin) => {

  const getController = name => {
    return strapi.plugins['users-permissions'].controller(name);
  };

  // Create the new controller
  plugin.controllers.user.updateMe = async (ctx) => {
    const user = ctx.state.user;
    console.log(user);


    // User has to be logged in to update themselves
    if (!user) {
      return ctx.unauthorized();
    }

    // Pick only specific fields for security
    const newData = _.pick(ctx.request.body, ['phone', 'zipCode', 'district', 'address', 'birthDate', 'profession']);

    // Get User Details
    const userDetail = await strapi.entityService.findOne('plugin::users-permissions.user',user.id,{
      populate:{UserDetails :true},
      UserDetails:{
        fields: ['id','phone', 'zipCode', 'district', 'address', 'birthDate' ]
      }
    });

    console.log(userDetail);




    // Check if user is changing password and make sure passwords match
    if (newData.password) {
      if (!newData.confirmPassword) {
        return ctx.badRequest('Missing password confirmation');
      } else if (newData.password !== newData.confirmPassword) {
        return ctx.badRequest('Passwords don\'t match')
      }
      delete newData.confirmPassword
    }

    console.log(newData);

    // Reconstruct context so we can pass to the controller

    // filter all the fields that have change
    const UpdatedData = Object.keys(newData).reduce((acc, current) => {
      console.log(userDetail.UserDetails[current] , newData[current]);
      // filter empty fields
      if(newData[current] === null || newData[current] === '' || newData[current] === undefined || newData[current].length === 0) {
      }else{
        if (newData[current] !== userDetail.UserDetails[current] ) {
          acc[current] = newData[current];
        }
      }

      return acc;
    }, {});


    console.log('canhged fileds', UpdatedData);



    // Update the user and return the sanitized data
    if(Object.keys(UpdatedData).length === 0){
    return {message: 'No data to update'};
    }else{


      if (UpdatedData["phone"]){
        console.log('phone');

        // check if phone already exists
        const userWithSamePhone = await strapi.entityService.findMany('plugin::users-permissions.user', {
          fields:['id'],
          filters: {
            UserDetails: {
              phone: {
                $eq: newData["phone"],
              },
            },
          },
        });
        if(userWithSamePhone.length > 0){
          return ctx.badRequest('Este numero já se encontra registado');
        }
      }

      const Update = await strapi.entityService.update('plugin::users-permissions.user', user.id , {
        data: {
          UserDetails:{
            id: userDetail.UserDetails.id,
            ...UpdatedData
          }
        },
      });

      return {data: {...UpdatedData}};
    }

    // send email to user notifying the change of data
    /*
    const emailTemplate = await strapi.entityService.findOne('email-template', { slug: 'user-data-change' });
    const emailTemplateData = {
      to: user.email,
      from: 'diogo.azev97@gmail.com'
};
    await strapi.plugins['email'].services.email.sendTemplatedEmail(emailTemplate, emailTemplateData);

*/
  };




  // Add the custom route
  plugin.routes['content-api'].routes.unshift({
    method: 'PATCH',
    path: '/user/me',
    handler: 'user.updateMe',
    config: {
      prefix: ''
    }
  })



  // Update Avatar Image
  plugin.controllers.user.updateAvatar = async (ctx) => {
  const user = ctx.state.user;
  const {avatar} = ctx.request.files;

    const  UserAvatar = await strapi.entityService.findOne('plugin::users-permissions.user',user.id,{
      populate:{avatar:true},
      fields: ['id']
    });
    console.log(UserAvatar);

  // if avatar image already exists on the current user then delete it
  if(UserAvatar.avatar){
    const deleteAvatar = await strapi.plugins.upload.services.upload.remove(UserAvatar.avatar);
  }

    const Update = await strapi.entityService.update('plugin::users-permissions.user', user.id , {
      data: {
      },
      populate: {avatar: true},
      files: {
        avatar: avatar,
      },
    });

    return  Update.avatar;
  }

  // Add the custom route
  plugin.routes['content-api'].routes.unshift({
    method: 'POST',
    path: '/user/me/avatar',
    handler: 'user.updateAvatar',
    config: {
      prefix: ''
    }
  });





  plugin.controllers.user.checkEmail = async (ctx) => {
  const  { email } = ctx.request.params;

    const userWithSameEmail = await strapi
      .query('plugin::users-permissions.user')
      .findMany({ where: { email: email.toLowerCase() } });

     return {message: userWithSameEmail.length ===0};// return false if the email is already taken

  }

  plugin.routes['content-api'].routes.unshift({
    method: 'GET',
    path: '/user/checkEmail/:email',
    handler: 'user.checkEmail',
    config: {
      prefix: ''
    }
  });


// check if a user wih a phone number already exists  in the database and return true if it does not exist

  plugin.controllers.user.checkNumber = async (ctx , next ) => {
    let { number } = ctx.request.params;
    const regex = new RegExp('^(9[123456]\\d{7}|2\\d{8})$');

    if (!regex.test(number)) {
      return {message: 'contacto inválido'}
    }

    const userWithSamePhone = await strapi.entityService.findMany('plugin::users-permissions.user', {
      fields:['id'],
      filters: {
        UserDetails: {
            phone: {
              $eq: number,
            },
          },
        },
    });
    return {message: userWithSamePhone.length ===0}; // return false if the phone numer is already taken
  }

  plugin.routes['content-api'].routes.push({
    method: 'GET',
    path: '/user/checkNumber/:number',
    handler: 'user.checkNumber',
    config: {
      prefix: ''
    }
  });


// check if a user wih a register phone number  exists  in the database and return true if exists
  plugin.controllers.user.checkReferral = async (ctx) => {

    let { number } = ctx.request.params;
    console.log(number);
    const regex = new RegExp('^(9[1236]\\d{7}|2\\d{8})$');

    if (!regex.test(number)) {
      return {message: 'numero inválido'}
    }
    const userWithSamePhone = await strapi.entityService.findMany('plugin::users-permissions.user', {
      fields:['id'],
      filters: {
        UserDetails: {
          phone: {
            $eq: number,
          },
        },
      },
    });
    return {message: userWithSamePhone.length > 0}; // return ture if the phone numer is exists

  }

  plugin.routes['content-api'].routes.unshift({
    method: 'GET',
    path: '/user/checkReferral/:number',
    handler: 'user.checkReferral',
    config: {
      prefix: ''
    }


  });


  // check if a user is admin or not - retrun true if it is admin
  plugin.controllers.user.checkRole = async (ctx) => {
    const user =  ctx.state.user;
    if (user.role.type === 'admin'){
      return {message: true};
    }else{
      return {message: false};
    }
  }

  plugin.routes['content-api'].routes.unshift({
    method: 'GET',
    path: '/user/checkRole',
    handler: 'user.checkRole',
    config: {
      prefix: ''
    }


  });





  const register = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {

    const userData = _.pick(ctx.request.body, ['username', 'email', 'password', 'referral', 'UserDetails']);

    const userDetails = _.mapValues(_.pick(userData.UserDetails, ['firstName', 'surname' , "locality" , 'phone' ,'avatar','howfind']), _.toString);
    userData.UserDetails = userDetails;



      const regex = new RegExp('^(9[1236]\\d{7}|2\\d{8})$');

      if (!regex.test(userData.UserDetails.phone)) {
        return ctx.badRequest('O numero '+userData.UserDetails.phone +' de telemovel indicado é inválido');
      }

      const userWithSamePhone = await strapi.entityService.findMany('plugin::users-permissions.user', {
        fields:['id'],
        filters: {
          UserDetails: {
            phone: {
              $eq: userData.UserDetails.phone,
            },
          },
        },
      });

      if (userWithSamePhone.length !==0) {
        return ctx.badRequest('O numero '+userData.UserDetails.phone +' de telemovel indicado já está registrado');
      }





    if (userData.referral) {
      const referralUser = await strapi.entityService.findMany('plugin::users-permissions.user', {
        fields:['id'],
        filters: {
          UserDetails: {
            phone: {
              $eq: userData.referral,
            },
          },
        },
      });
      if (referralUser.length ===0) {
        return ctx.badRequest('Não Encontramos nenhum utilizador associado a este numero '+userData.referral +'. Verifique se introduziu o numero correto.');
      }else {
        userData.referral=referralUser[0].id;

      }

    }

    if (userData.email) {
      const userWithSameEmail = await strapi
        .query('plugin::users-permissions.user')
        .findMany({where: {email: userData.email.toLowerCase()}});

      if (userWithSameEmail.length > 0) {
        return ctx.badRequest('Email already taken');
      }
      userData.email = userData.email.toLowerCase();
    }

    ctx.request.body = userData;

    console.log(ctx);

    /*
    ctx.request.body.confirmed = false;
    const token = ctx.request.body.token;
    const gres = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GOOGLE_SITEKEY}&response=${token}`
    );
    console.log(gres.data);
    if (!gres.data.success) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.token.provide",
          message: "Please provide a valid token.",
        })
      );
    }

    */
    await register(ctx);
  };

  return plugin;
};







