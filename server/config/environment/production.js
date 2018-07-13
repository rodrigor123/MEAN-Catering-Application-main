'use strict';

// Production specific configuration
// =================================
module.exports = {
  domain: 'https://app.cateringninja.com/',

  // Server IP
  ip:     process.env.OPENSHIFT_NODEJS_IP ||
          process.env.IP ||
          undefined,

  // Server port
  port:   process.env.OPENSHIFT_NODEJS_PORT ||
          process.env.PORT ||
          443,

  // MongoDB connection options
  mongo: {
    uri:  process.env.MONGODB_URI ||
          process.env.MONGOHQ_URL ||
          process.env.OPENSHIFT_MONGODB_DB_URL +
          process.env.OPENSHIFT_APP_NAME ||
          'mongodb://ninja_root:ninja3141@104.154.59.205:27017/catering'
  },

  mailgun: {
    api_key: 'key-11f4fceec484b3d96fbd07dd91b9ff58',
    domain: 'mg.cateringninja.com',
    from: 'catering@cateringninja.com'
  },

  payments: {
    TAXCLOUD: {
      API_LOGIN_ID: '36DF64D0',
      API_KEY: 'E1A33450-A519-4379-8FF8-CBA269A17640'
    },
    DWOLLA: {
       KEY: 'EVOeQHO2RWEoi57XF80Fxhj1CyfIGIngMCx7vEBCzbhOEl9D0a',
       SECRET: '78CmxYBXv0DBBv49J18eeCBKxdh75l0OfgZk20pTr7nOmmvGqa',
       ACCOUNT_ID: 'acc7964c-6bb9-45b2-bbad-5b91487c6758', //eabd60f1-8fbc-4ed9-b09a-b213bdc9d092
       ACCESS_TOKEN: 'HCAeRJYcE78z8PDhRfZZIXDdTLEU27rEij2oxvIlQ1LBHhh0Xy',
       REFRESH_TOKEN: 'ZMvv9FCAT3SNGYFBUtpdogqM1GOesScOvkifroFPprL326wiZZ',
       LOGIN_URL: 'https://dwolla.com/login'
    },
    STRIPE: {
      SECRET_KEY: 'sk_live_psBPsSZ7ccO1bampVWlVNdMk',
      PUBLIC_KEY: 'pk_live_Zpopr6NDYNJ45SpUVLu2c5hq'
    }
    /*STRIPE: {
      SECRET_KEY: 'sk_test_FgAfCdq6QKhuGwWsHuk0yz7h',
      PUBLIC_KEY: 'pk_test_sPCubetxhsItqcr1nkZOHQfM'
    }*/
  },

  activeCampaign: {
    domain: 'https://cateringninja.api-us1.com',
    api_key: '338d95021e19ec066b3dd319c1138e0606b34b8ed306ed2c7e2bd41625a206964ebf7aaa',
    user_group: '2',
    catering_group: '1'
  }

  /*payments: {
    TAXCLOUD: {
      API_LOGIN_ID: '36DF64D0',
      API_KEY: 'E1A33450-A519-4379-8FF8-CBA269A17640'
    },
    DWOLLA: {
      KEY: '2jKQn8aERXipDkCuNYG8TKMKPqpGB4KjuK1Gevrw74ZITIK6Ew',
      SECRET: 'tWsvZmICKSRpbGbO0WWRKBVXb4B03j35XpI5ifrP1LJJJ5HExy',
      ACCOUNT_ID: 'f8615f27-0783-4078-97db-d8d7ce3ae368',
      ACCESS_TOKEN: 'ozXPnlbOePqgiaUKFMOsgBH9xsl2upuOwxCg7C6K6PNgFIzyCt'
    },
    STRIPE: {
      SECRET_KEY: 'sk_test_FgAfCdq6QKhuGwWsHuk0yz7h',
      PUBLIC_KEY: 'pk_test_sPCubetxhsItqcr1nkZOHQfM'
    }
  }*/

  //payments: {
  //  DWOLLA: {
  //    KEY: process.env.DWOLLA_KEY,
  //    SECRET: process.env.DWOLLA_SECRET,
  //    ACCOUNT_ID: process.env.DWOLLA_ACCOUNT_ID,
  //    ACCESS_TOKEN: process.env.DWOLLA_ACCESS_TOKEN
  //  },
  //  STRIPE: {
  //    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  //    PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY
  //  }
  //}
};
