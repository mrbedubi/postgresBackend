
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


    // User has to be logged in to update themselves
    if (!user) {
      return ctx.unauthorized();
    }

    // Pick only specific fields for security
    const newData = _.pick(ctx.request.body, ['username']);

    // Make sure there is no duplicate user with the same username
    if (newData.username) {
      const userWithSameUsername = await strapi
        .query('plugin::users-permissions.user')
        .findOne({where: {username: newData.username}});

      if (userWithSameUsername && userWithSameUsername.id != user.id) {
        return ctx.badRequest('Username already taken');
      }
    }

    // Make sure there is no duplicate user with the same email
    if (newData.email) {
      const userWithSameEmail = await strapi
        .query('plugin::users-permissions.user')
        .findOne({where: {email: newData.email.toLowerCase()}});

      if (userWithSameEmail && userWithSameEmail.id != user.id) {
        return ctx.badRequest('Email already taken');
      }
      newData.email = newData.email.toLowerCase();
    }

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
    ctx.request.body = newData
    ctx.params = {id: user.id}

    // Update the user and return the sanitized data
    return await getController('user').update(ctx)
  };




  // Add the custom route
  plugin.routes['content-api'].routes.unshift({
    method: 'PUT',
    path: '/user/me',
    handler: 'user.updateMe',
    config: {
      prefix: ''
    }
  });





  plugin.controllers.user.checkEmail = async (ctx) => {
  const data  = _.pick(ctx.request.body, ['email']);

    const userWithSameEmail = await strapi
      .query('plugin::users-permissions.user')
      .findOne({ where: { email: data.email.toLowerCase() } });

    return !userWithSameEmail; // return false if the email is already taken

  }

  plugin.routes['content-api'].routes.unshift({
    method: 'GET',
    path: '/user/checkEmail',
    handler: 'user.checkEmail',
    config: {
      prefix: ''
    }
  });


// check if a user wih a phone number already exists  in the database and return true if it does not exist

  plugin.controllers.user.checkNumber = async (ctx , next ) => {
    let { number } = ctx.request.params;
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
            eq: number,
          },
        },
      },
    });
    return userWithSamePhone.length !==0; // return ture if the phone numer is exists

  }

  plugin.routes['content-api'].routes.unshift({
    method: 'GET',
    path: '/user/checkReferral',
    handler: 'user.checkReferral',
    config: {
      prefix: ''
    }


  });




  const register = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    console.log(ctx.request.body);
    const userData = _.pick(ctx.request.body, ['username', 'email', 'password', 'referral', 'UserDetails']);
    console.log(userData);
    const userDetails = _.mapValues(_.pick(userData.UserDetails, ['firstName', 'surname' , "locality" , 'phone' ,'avatar','howfind']), _.toString);
    userData.UserDetails = userDetails;



      const regex = new RegExp('^(9[1236]\\d{7}|2\\d{8})$');

      if (!regex.test(userData.UserDetails.phone)) {
        return {message: 'numero inválido'}
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
        console.log(referralUser[0]);
      }

    }

    ctx.request.body = userData;

    console.log(ctx.request.body);

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







