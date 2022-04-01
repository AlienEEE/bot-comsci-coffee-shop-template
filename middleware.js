const jwt  = require('jsonwebtoken');

const getTokenFrom = request => {
    const authorization = request.get('Authorization')

    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
      return authorization.substring(7)
    }
    
    return null
}

exports.sign = function(user, secretkey){

    

    try{
        
        //return jwt.sign({ id: user._id }, secretkey, { expiresIn: 3600   }); //expires in 1 hour
        //return jwt.sign({ id: user._id }, secretkey, { expiresIn: 86400   }); //expires in 24 hours
        return jwt.sign(user, secretkey); //Never expire
    }
    catch(e){

        return e//res.status(401).send()
    }
}

exports.verify_token=async function(accessToken){
    try{

        const secretkey=process.env.SECRET
        return await jwt.verify(accessToken, secretkey, (err, authData) => {

            
            if(err) {
                return false//err//res.status(401).send(err)
            } else {
                //console.log(authData)
                return true 
                
            }

        });

       

    }
    catch(e){

        return false//e//res.status(401).send()
    }
}

exports.verify =  function(req, res, next){


    const secretkey=process.env.SECRET

    let accessToken = getTokenFrom(req)
    
    if (!accessToken){        
        return res.status(403).send()
    }


    try{

        jwt.verify(accessToken, secretkey, (err, authData) => {

            if(err) {

                return res.status(401).send(err)

            } 
        });

        next()

    }
    catch(e){

        return res.status(401).send()
    }
}