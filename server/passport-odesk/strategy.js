/**
 * Module dependencies.
 */
var util = require('util'),
  OAuthStrategy = require('passport-oauth').OAuthStrategy,
  InternalOAuthError = require('passport-oauth').InternalOAuthError,
  request = require('superagent');


/**
 * `Strategy` constructor.
 *
 * The Odesk authentication strategy authenticates requests by delegating to
 * Odesk using the OAuth protocol.
 *
 * Applications must supply a `verify` callback which accepts a `token`,
 * `tokenSecret` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `consumerKey`     identifies client to Odesk
 *   - `consumerSecret`  secret used to establish ownership of the consumer key
 *   - `callbackURL`     URL to which Odesk will redirect the user after obtaining authorization
 *
 * Examples:
 *
 *     passport.use(new OdeskStrategy({
 *         consumerKey: '123-456-789',
 *         consumerSecret: 'shhh-its-a-secret'
 *         callbackURL: 'https://www.example.net/auth/odesk/callback'
 *       },
 *       function(token, tokenSecret, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};
  options.requestTokenURL = options.requestTokenURL || 'https://www.odesk.com/api/auth/v1/oauth/token/request';
  options.accessTokenURL = options.accessTokenURL || 'https://www.odesk.com/api/auth/v1/oauth/token/access';
  options.userAuthorizationURL = options.userAuthorizationURL || 'https://www.odesk.com/services/api/auth';
  options.sessionKey = options.sessionKey || 'oauth:twitter'; //strange, but without it works we have errors - Anatolij
  OAuthStrategy.call(this, options, verify);
  this.name = 'odesk';
}

/**
 * Inherit from `OAuthStrategy`.
 */
util.inherits(Strategy, OAuthStrategy);


/**
 * Authenticate request by delegating to Odesk using OAuth.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req, options) {
  // When a user denies authorization on Odesk, they are presented with a link
  // to return to the application in the following format (where xxx is the
  // value of the request token):
  //
  //     http://www.example.com/auth/Odesk/callback?denied=xxx
  //
  // Following the link back to the application is interpreted as an
  // authentication failure.
  if (req.query && req.query.denied) {
    return this.fail();
  }

  // Call the base class for standard OAuth authentication.
  OAuthStrategy.prototype.authenticate.call(this, req, options);
}

/**
 * Retrieve user profile from Odesk.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `id`        (equivalent to `user_id`)
 *   - `displayName`  (equivalent to `name`)
 *
 * @param {String} token
 * @param {String} tokenSecret
 * @param {Object} params
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(token, tokenSecret, params, done) {
  var me = this;
  this.token = token;
  this.tokenSecret = tokenSecret;

  this._oauth.get('https://www.odesk.com/api/hr/v2/users/me.json', //'https://www.odesk.com/api/auth/v1/info.json',
    token, tokenSecret,
    function (err, body, res) {
      if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }
      var data = JSON.parse(body);

      console.log("Got from oDesk: "+data.email+" and "+body);

      var profile = {
        oauth: me._oauth,
        token: me.token,
        tokenSecret: me.tokenSecret,

        provider: 'odesk',
        "id" :  data.user.id,
        "name": {"familyName": data.user.last_name, "givenName": data.user.first_name},
        //ref : data.info.ref,
        "displayName" : data.user.first_name + " " + data.user.last_name,
        //"img" : data.info.portrait_100_img,
        "profile" : data.user.public_url, //data.info.profile_url,
        "email": data.user.email,
        "timezone":data.user.timezone,
        "timezone_offset":data.user.timezone_offset,
        "teams": []
        //"location":data.info.location,
        //"country" : data.info.location.country,
        //"company_url":data.info.company_url
      };

      // Get additional oDesk info through this other URL... Would be easier if the public APIs gave everything in one place :)
      me._oauth.get('https://www.odesk.com/api/auth/v1/info.json',
        token, tokenSecret,
        function (err, body, res) {
          if (err) { return done(new InternalOAuthError('failed to fetch user profile', err)); }
          var data = JSON.parse(body);
          profile.img = data.info.portrait_100_img;
          profile.location = data.info.location;
          profile.country = data.info.location.country;
          profile.company_url = data.info.company_url;
          done(null, profile);
        });
    });

}

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
