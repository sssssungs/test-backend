exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()){
        next(); // parameter를 넣으면 error 처리가 된거고, 없으면 다음 미들웨어로 토스한다.
    } else {
        res.status(401).send('로그인 하십시오.');
    }
}

exports.isNotLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        next(); // parameter를 넣으면 error 처리가 된거고, 없으면 다음 미들웨어로 토스한다.
    } else {
        res.status(401).send('로그인 하십시오.');
    }
}
