// expose our config directly to our application using module.exports
if (process.env.NODE_ENV=='staging') {
	module.exports = {
		'oDeskAuth' : {
			'clientID' 		: '3f448b92c4aaf8918c0106bd164a1656',
			'clientSecret' 	: 'e6a71b4f05467054',
			'callbackURL' 	: 'http://fast-caverns-8687.herokuapp.com/auth/odesk/callback'
		},

		'googleAuth' : {
			'clientID' 		: '626791004779-234kimc8dp9lfksi2o9ktk7ahv0prra0.apps.googleusercontent.com',
			'clientSecret' 	: '1hEVk-Mx--PvEguB6jJG3nEO',
			'callbackURL' 	: 'http://fast-caverns-8687.herokuapp.com/auth/google/callback'
		}

	};

} else {
	module.exports = {
		'oDeskAuth' : {
			'clientID' 		: '3f448b92c4aaf8918c0106bd164a1656',
			'clientSecret' 	: 'e6a71b4f05467054',
			'callbackURL' 	: 'http://localhost:5000/auth/odesk/callback'
		},

		'googleAuth' : {
			'clientID' 		: '626791004779-f61f22vjoc8shkliqb79l1aa463a0okt.apps.googleusercontent.com',
			'clientSecret' 	: '2kTwdDf27vKwvz21HUJOOlHJ',
			'callbackURL' 	: 'http://localhost:5000/auth/google/callback'
		}

	};

}
