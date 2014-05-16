// expose our config directly to our application using module.exports
module.exports = {
	'oDeskAuth' : {
		'clientID' 		: '3f448b92c4aaf8918c0106bd164a1656',
		'clientSecret' 	: 'e6a71b4f05467054',
		'callbackURL' 	: process.env.NODE_ENV=='staging' ? 'http://fast-caverns-8687.herokuapp.com/auth/odesk/callback' : 'http://localhost:3000/auth/odesk/callback'
	},

	'googleAuth' : {
		'clientID' 		: '626791004779-f61f22vjoc8shkliqb79l1aa463a0okt.apps.googleusercontent.com',
		'clientSecret' 	: '2kTwdDf27vKwvz21HUJOOlHJ',
		'callbackURL' 	: process.env.NODE_ENV=='staging' ? 'http://fast-caverns-8687.herokuapp.com/auth/google/callback' || 'http://localhost:3000/auth/google/callback'
	}

};
