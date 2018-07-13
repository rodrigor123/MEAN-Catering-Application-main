let config = require('../../config/environment');
let Promise = require('bluebird');
let request = require('request-promise');
let mongoose = require('mongoose');

let dwolla = require('dwolla-v2');
let dwollaOptions = {
  id: config.payments.DWOLLA.KEY,
  secret: config.payments.DWOLLA.SECRET
};
if (process.env.NODE_ENV !== 'production') {
  dwollaOptions.environment = 'sandbox';
}
let dwollaClient = new dwolla.Client(dwollaOptions);

class DwollaController {

  requestAccessToken(user) {

    if (!user.dwollaTokens) {
      return Promise.reject({});
    }

    return request.post(dwollaClient.tokenUrl, {
      headers: {
        "accept": "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        "client_id": config.payments.DWOLLA.KEY,
        "client_secret": config.payments.DWOLLA.SECRET,
        "refresh_token": user.dwollaTokens.refresh_token,
        "grant_type": "refresh_token"
      })
    }).then(response => {
      response = JSON.parse(response);
      return mongoose.model('User').findOne({
        _id: user._id
      }).then((dbUser) => {
        dbUser.dwollaTokens = {
          access_token: response.access_token,
          refresh_token: response.refresh_token
        };
        return dbUser.save().then(() => response);
      });
    });

  }

  pay(items, user) {

    return this.requestAccessToken(user).then((response) => {

      var accountToken = new dwollaClient.Token({
        access_token: response.access_token,
        refresh_token: response.refresh_token
      });

      if (items.length === 0 || !accountToken) {
        return Promise.reject({});
      }

      return accountToken.get(`https://api.dwolla.com/accounts/${config.payments.DWOLLA.ACCOUNT_ID}/funding-sources`).then((response) => {
        let fundingSources = response.body._embedded['funding-sources'];
        let balance = fundingSources.filter(item => item.type === 'balance')[0];
        var requestBody = {
          _links: {
            source: balance._links.self
          },
          items: items
        };
        return accountToken.post('mass-payments', requestBody);
      });
    });

  }

  endAuth(req, res) {

    let options = {
      "client_id": config.payments.DWOLLA.KEY,
      "client_secret": config.payments.DWOLLA.SECRET,
      "code": req.query.authCode,
      "grant_type": "authorization_code",
      "redirect_uri": 'https://' + req.headers.host + req.query.redirect /*"redirect_uri": request.headers.protocol + '://' + req.headers.host + req.query.redirect*/
    };

    return request.post(dwollaClient.tokenUrl, {
      headers: {
        "accept": "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify(options)
    })
      .then(respondWithResult(res))
      .catch(handleError(res));
  }

  startAuth(req, res) {
    let authUrl = dwollaClient.authUrl;
    let clientId = config.payments.DWOLLA.KEY;
    let redirectUrl = 'http://' + req.headers.host + req.query.redirect;
    //if (dwollaOptions.environment = 'sandbox') {
    //  let redirectUrl = 'http://' + req.headers.host + req.query.redirect;
    //}
    let scope = 'Send|Funding'; //'Transactions|Send|Request|Funding|ManageCustomers|Email';
    let output = {
      authUrl: `${authUrl}?client_id=${clientId}&response_type=code&redirect_uri=${redirectUrl}&scope=${scope}`//&verified_account=true`
    };
    return Promise.resolve(output).then(respondWithResult(res))
  }

  loginUrl(req, res) {
      let loginUrl = config.payments.DWOLLA.LOGIN_URL;
      //let redirectUrl = '//' + req.headers.host + req.query.redirect;
      let output = {
        loginUrl: `${loginUrl}`
      };
      return Promise.resolve(output).then(respondWithResult(res))
  }
}

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
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

module.exports = new DwollaController();
