const Joi = require('joi');

const punch = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
}).options({ allowUnknown: true }); // multipart form may include extra fields

module.exports = { punch };
