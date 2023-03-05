'use strict';

/**
 * approval service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::approval.approval');
