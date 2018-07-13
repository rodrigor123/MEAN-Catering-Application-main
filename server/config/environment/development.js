'use strict';

// Development specific configuration
// ==================================
module.exports = {
 // domain: 'http://localhost:8080/',
 // domain: 'http://dev.cateringninja.com:8080/',
 domain: 'http://dev.cateringninja.com:8080/',

  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/catering'
    // uri: 'mongodb://ninja_root:ninja3141@104.198.67.10:27017/catering'
  },

  // Seed database on startup
  seedDB: false,

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
      //local
      /*KEY: 'uGQTHG1Yp1dvagz9yejNwGXMbzsQ0mfHfNpF7CPqY9QA7W48Ot',
       SECRET: 'YxmlcmAXhCOn4utGrQMZMfK8X1SoxSVUBODDJWOTIuhtkIMV5a',
       ACCOUNT_ID: 'f8615f27-0783-4078-97db-d8d7ce3ae368',
       ACCESS_TOKEN: '0IDUpXJtXo21YYJueOd45HzZ2FvrVBF3xE1zyTmTRXP3nG4QkW',
       REFRESH_TOKEN: 'BtL6PAAtC5v26KtYHMpOK9VSqdSYsSV5oL7awWmsiOVBcbZ7fD'  */
      //dev
      KEY: '1HVGwWtBKv8amnhdmJvZ2wK4CS6xSVvVNSNvlDVbj3zlzWUVyh',
      SECRET: '8xPG4YytWNmeVtbt7UMCVDH5wT6UfBEZtqBE3tmRQ1nq7fle72',
      ACCOUNT_ID: '9b0c7e4e-56d2-4722-8ca4-832609e7dcf0', //eabd60f1-8fbc-4ed9-b09a-b213bdc9d092
      ACCESS_TOKEN: 'WzpXdO9KTOXsTKBncasOBn0i3lsI8t8rTZzlmW65k3UMzd1WZ4',
      REFRESH_TOKEN: '9kAlLadOCGrchOgAHdKc28vWIIl31hsT4YvZvOXT3nNVrkYpCa',
      LOGIN_URL: 'https://uat.dwolla.com/login'
    },
    STRIPE: {
      SECRET_KEY: 'sk_test_wRIsHZnwUKFqmPTD8YjRxkQd',
      PUBLIC_KEY: 'pk_test_0EFB2Y1WvIYGIIUsAQJ42DVD'
    }
    /*STRIPE: {
     SECRET_KEY: 'sk_test_FgAfCdq6QKhuGwWsHuk0yz7h',
     PUBLIC_KEY: 'pk_test_sPCubetxhsItqcr1nkZOHQfM'
     } */
  },

  activeCampaign: {
    domain: 'https://cateringninja.api-us1.com',
    api_key: '338d95021e19ec066b3dd319c1138e0606b34b8ed306ed2c7e2bd41625a206964ebf7aaa',
    user_group: '4',
    catering_group: '3'
  }

};
