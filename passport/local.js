const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');

const { User } = require('../models');
const bcrypt = require('bcrypt');

module.exports = () => {
    passport.use(new LocalStrategy({
        // req body 안에 있는 이름.
        usernameField: 'email',
        passwordField: 'pw',
    }, async (email, pw, done) => {
        // done : callback 같은거임.
        try {
            // login 전략을 둔다.
            const user = await User.findOne({
                where: { email }
            });

            // email 있는지 확인.
            if (!user) {
                //done(server error, 성공여부, client error);
                return done(null, false, { reason: '존재하지 않는 email 입니다' })
            }
            // 비밀번호 비교
            const result = await bcrypt.compare(pw, user.password);

            if (result) {
                return done(null, user);
            }

            return done(null, false, { reason: '비밀번호가 틀렸습니다' });
        } catch (e) {
            console.error(e);
            return done(e);
        }

    }));
}
