const express = require('express');
const router = express.Router();
const { Post, Comment, Image, User, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');
const { Op } = require('sequelize');

router.get('/:hashtag/posts', async (req, res, next) => {
    try {
        const lastId = +(req.query.lastId);
        const where = {}
        if (lastId) { // 초기로딩이 아닐때 (더불러올때)
            where.id = { [Op.lt]: lastId };
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
                {
                    model: Hashtag,
                    where: { name: decodeURIComponent(req.params.hashtag) }
                },
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
