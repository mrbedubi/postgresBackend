
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
    const newData = _.pick(ctx.request.body, ['username'] );

    // Make sure there is no duplicate user with the same username
    if (newData.username) {
      const userWithSameUsername = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: { username: newData.username } });

      if (userWithSameUsername && userWithSameUsername.id != user.id) {
        return ctx.badRequest('Username already taken');
      }
    }

    // Make sure there is no duplicate user with the same email
    if (newData.email) {
      const userWithSameEmail = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: { email: newData.email.toLowerCase() } });

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
    ctx.params = { id: user.id }

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

  return plugin;
};


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
  const register = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx) => {
    console.log(ctx.request.body);
    const userData = _.pick(ctx.request.body, ['username', 'email', 'password', 'UserDetails']);
    const userDetails = _.mapValues(_.pick(userData.UserDetails, ['firstName', 'surname']), _.toString);
    userData.UserDetails = userDetails;
    ctx.request.body = userData
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


