const express = require('express');
const router = express.Router();
const { Post, Comment, Image, User } = require('../models');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Op } = require('sequelize');


router.get('/', async (req, res, next) => {
    // console.log(req.headers)
    try {
        if(req.user) {
            const fullUserInfoWithoutPw = await User.findOne({
                where: { id: req.user.id },
                attributes: {
                    exclude: ['password']
                },
                include: [ // join
                    { model: Post, attributes: ['id'] },
                    { model: User, as: 'Followers', attributes: ['id'] }, // model as의 명칭
                    { model: User, as: 'Followings', attributes: ['id'] },
                ]
            });
            res.status(200).json(fullUserInfoWithoutPw);
        } else {
            res.status(200).json(null);
        }
    } catch(e) {
        console.error(e);
        next(e);
    }
})




router.post('/login', isNotLoggedIn, (req, res, next) => {
    // middleware 확장하는 방법.
    passport.authenticate('local', (errFromServer, user, errFromClient) => {
        if (errFromServer) {
            console.error(errFromServer);
            return next(errFromServer);
        }
        if (errFromClient) {
            return res.status(401).send(errFromClient.reason);
        }
        // passport 에서 제공해주는 login 이용
        // req login 실행되면서 passport index에 serialize 실행된다.
        return req.login(user, async (loginErr) => {
            if (loginErr) {
                console.error(loginErr);
                return next(loginErr);
            }
            const fullUserInfoWithoutPw = await User.findOne({
                where: { id: user.id },
                attributes: {
                    exclude: ['password']
                },
                include: [ // join
                    { model: Post },
                    { model: User, as: 'Followers' }, // model as의 명칭
                    { model: User, as: 'Followings' },
                ]
            });
            return res.status(200).json(fullUserInfoWithoutPw);
        });

    })(req, res, next); // // middleware 확장하는 방법. 뒤에 이렇게 붙여주면 passport 내부에서도 사용이 가능하다.
});


router.post('/', async (req, res, next) => {
    try {
        const exUser = await User.findOne({
            where: {
                email: req.body.email,
            }
        });
        if (exUser) {
            return res.status(403).send('이미 사용중인 email 입니다'); // return 없으면 밑으로 계속 탄다~
        }
        const hashedPw = await bcrypt.hash(req.body.pw, 10);
        await User.create({
            email: req.body.email,
            nickname: req.body.nickname,
            password: hashedPw,
        });
        // 200 성공
        // 300 리다이렉트 or 캐싱.
        // 400 클라이언트 에러
        // 500 서버에러
        res.status(200).send('ok');
    } catch (e) {
        console.error(e);
        next(e); // status 500 으로 보낸다. error처리를 한방에 ?
    }
});

router.post('/logout', isLoggedIn, (req, res) => {
    req.logout();
    req.session.destroy();
    res.send('ok');
})

router.patch('/nickname', isLoggedIn, async (req, res, next) => {
    try{
        await User.update({
            nickname: req.body.nickname, // 수정대상
        }, {
            where:{ id: req.user.id } // 조건절
        });
        res.status(200).json({ nickname: req.body.nickname });
    }
    catch (e) {
        console.error(e);
        next(e);
    }
});

//user/1/follow
router.patch('/:userId/follow', isLoggedIn, async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { id: req.params.userId }
        });
        if(!user) {
            res.status(403).send('없는 사람입니다..');
        }
        // 내 아이디를 user follower 에 넣는다.
        await user.addFollowers(req.user.id);
        res.status(200).json({ UserId: +(req.params.userId) });
    }
    catch (e) {
        console.error(e);
        next(e);
    }
});

router.delete('/:userId/follow', isLoggedIn, async (req, res, next) => {
    try{
        const user = await User.findOne({
            where: { id: req.params.userId }
        });
        if(!user) {
            res.status(403).send('없는 사람입니다..');
        }
        await user.removeFollowers(req.user.id);
        res.status(200).json({ UserId: +(req.params.userId) });
    }
    catch (e) {
        console.error(e);
        next(e);
    }
});

router.get('/followers', isLoggedIn, async (req, res, next) => {
    try{
        const user = await User.findOne({
            where: { id: req.user.id }
        });
        if(!user) {
            res.status(403).send('없는 사람입니다..');
        }
        const followers = await user.getFollowers({ limit: +(req.query.limit) });
        res.status(200).json(followers);
    }
    catch (e) {
        console.error(e);
        next(e);
    }
});

router.get('/followings', isLoggedIn, async (req, res, next) => {
    try{
        const user = await User.findOne({
            where: { id: req.user.id }
        });
        if(!user) {
            res.status(403).send('없는 사람입니다..');
        }
        const followings = await user.getFollowings({ limit: +(req.query.limit) });
        res.status(200).json(followings);
    }
    catch (e) {
        console.error(e);
        next(e);
    }
});

router.get('/:userId', async (req, res, next) => {
    // console.log(req.headers)
    try {
        const fullUserInfoWithoutPw = await User.findOne({
            where: { id: req.params.userId },
            attributes: {
                exclude: ['password']
            },
            include: [ // join
                { model: Post, attributes: ['id'] },
                { model: User, as: 'Followers', attributes: ['id'] }, // model as의 명칭
                { model: User, as: 'Followings', attributes: ['id'] },
            ]
        });
        if (fullUserInfoWithoutPw) {
            const data = fullUserInfoWithoutPw.toJSON();
            data.Posts = data.Posts.length;
            data.Followers = data.Followers.length;
            data.Followings = data.Followings.length;
            res.status(200).json(data);
        } else {
            res.status(404).json('존재하지않는 사용자입니다');
        }
    } catch(e) {
        console.error(e);
        next(e);
    }
});

router.get('/:userId/posts', async (req, res, next) => {
    try {
        const lastId = +(req.query.lastId);
        const where = { UserId: req.params.userId };
        if (lastId) { // 초기로딩이 아닐때 (더불러올때)
            where.id = { [Op.lt]: lastId }; // less than
        }
        const posts = await Post.findAll({
            where,
            limit: 10, // 10개단위로 가져와라.
            // offset: 0, // 1번부터 10개 가져와라.  잘 안씀... 삭제되거나 추가되었을때 꼬일수 있음.
            order: [
                ['createdAt', 'DESC'],
                [Comment, 'createdAt', 'DESC']
            ],
            include: [
                { model: Image },
                {
                    model: Comment,
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'nickname'],
                        }
                    ] },
                {
                    model: User,
                    attributes: ['id', 'nickname']
                },
                {
                    model: User, // 좋아요 누른
                    as: 'Likers',
                    attributes: ['id']
                },
                {
                    model: Post,
                    as: 'Retweet',
                    include: [
                        { model: User, attributes: ['id', 'nickname'] },
                        { model: Image, }]
                },
            ],
        });
        res.status(200).json(posts);
    } catch (e) {
        console.error(e);
        next(e);
    }
});


module.exports = router;
