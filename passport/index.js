const passport = require('passport');
const Local = require('./local');
const { User } = require('../models');

module.exports = () => {
    // 첫 로그인시
    passport.serializeUser((user, done) => {
        // session에 유저정보를 너무 많이 들고 있으면 부하가 생기기 때문에,
        // 이거를 db에 저장시켜준다. (like redis)
        // id를 이용해서 해당 쿠키의 유저정보를 가져온다.
        done(null, user.id)
    });

    // 로그인 성공 후 그 다음 요청부터
    passport.deserializeUser(async (id ,done) => {
        try {
            const user = await User.findOne({ where: { id }});
            done(null, user); // req.user로 넣어준다.
        } catch (e) {
            console.error(e);
            done(e);
        }
    });

    Local();

}
