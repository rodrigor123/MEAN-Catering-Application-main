let config = require('../../config/environment');
let Promise = require('bluebird');
let request = require('request-promise');


const BASE_URL = 'https://api.taxcloud.com';
const API_VERSION = '1.0';

function $getEndPoint(endPoint) {
  "use strict";
  return `${BASE_URL}/${API_VERSION}${endPoint}?apiKey=${config.payments.TAXCLOUD.API_KEY}`;
}

const endpoints = {
  verifyAddress: $getEndPoint('/taxcloud/VerifyAddress'),
  lookup: $getEndPoint('/TaxCloud/Lookup')
};

const TAX_CLOUD_CONFIG = {
  apiLoginId: config.payments.TAXCLOUD.API_LOGIN_ID
};

function $getOptions(body) {
  "use strict";
  return Object.assign({}, TAX_CLOUD_CONFIG, body);
}

class TaxCloudController {

  verifyAddress(req, res) {
    return request.post(endpoints.verifyAddress, {
      form: $getOptions(req.body)
    })
      .then(respondWithResult(res))
      .catch(handleError(res));
  }

  lookup(req, res) {

    return request.post(endpoints.lookup, {
      headers: {
        "accept": "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify($getOptions(req.body))
    })
      .then(respondWithResult(res))
      .catch(handleError(res));
  }

}

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      console.log('Entity', entity);
      res.status(statusCode).json(entity);
    }
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

module.exports = new TaxCloudController();
