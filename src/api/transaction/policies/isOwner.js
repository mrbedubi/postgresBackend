module.exports = async (ctx, next) => {
  const { user } = ctx.state.user;

  if (!user) {
    return ctx.unauthorized();
  }
  // Fetch the content with the specified ID
  const content = await strapi.query('transaction').findOne({ id });

  // Check if the authenticated user is the owner of the content
  if (content.owner.id !== user.id) {
    return ctx.unauthorized('You are not authorized to perform this action');
  }

  // The user is authorized, so call the next middleware or controller action
  await next();
};
