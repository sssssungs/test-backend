const express = require('express');
const router = express.Router();
const { Post, Comment, Image, User, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

try {
    // file system 으로 업로드 폴더 있는지 먼저 검사한다.
    fs.accessSync('uploads')
} catch (e) {
    console.log('uploads 폴더 없으므로 생성한다.')
    fs.mkdirSync('uploads')
}

// aws 접근권한 생성
AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: 'ap-northeast-2'
});

// image upload
// multer: multi part 형식 업로드할때 사용
const upload = multer({
    storage: multerS3({
        s3: new AWS.S3(), // 이렇게하면 접근권한을 얻게되는것
        bucket: 'randy-bird',
        key(req, file, cb) {
            cb(null, `original/${Date.now()}_${path.basename(file.originalname)}`)
        }
    }),
    //     multer.diskStorage({ // 어디 저장할거니.
    //     destination(req, file, done) {
    //         done(null, 'uploads'); // uploads 라는 폴더에 저장 , 나중에는 s3에 저장되도록할고얌.
    //     },
    //     filename(req, file, done) { // 파일명 중복 막기 위해 시간 붙여줌.
    //         const ext = path.extname(file.originalname); // 확장자 추출. (.jpg)
    //         const basename = path.basename(file.originalname, ext); // 파일명 추출
    //         done(null, basename + '_' + new Date().getTime() + ext);
    //     }
    // }),
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB 까지.
    }
});
// array 이름은 front랑 맞춰줘야함.
// 한장 올리는거면 upload.single()
// text 올리는거면 upload.none()

//POST
router.post('/', isLoggedIn, upload.none(),  async (req, res, next) => {
    try {
        const hashtags = req.body.content.match(/#[^\s#]+/g)
        const post = await Post.create({
            content: req.body.content,
            UserId: req.user.id,
        });
        if (hashtags) {
            const result = await Promise.all(hashtags.map(tag => Hashtag.findOrCreate({
                where : { name: tag.slice(1).toLowerCase() }
            }))); // 있으면 가져오고 없으면 등록한다.
            // result 형태가 [['해시', true], ['태그', false]] 이런 형태로 return 된다.
            await post.addHashtags(result.map(v => v[0]))
        }

        if (req.body.images) {
            if (Array.isArray(req.body.images)) { // 여러 이미지인 경우
                // Image.create 하게되면 promise로 return
                const images = await Promise.all(req.body.images.map((image) => Image.create({ src: image })));
                await post.addImages(images);
            } else { // 이미지 한개
                const image = await Image.create({ src: req.body.images });
                await post.addImages(image);

            }
        }
        const fullPost = await Post.findOne({
            where: { id: post.id },
            // include: join 테이블 조인.
            include: [
                { model: Image },
                {
                    model: Comment,
                    include: [
                        {
                            model: User, // 댓글 작성자
                            attributes: ['id', 'nickname']
                        }
                    ]},
                {
                    model: User, // 게시글 작성자
                    attributes: ['id', 'nickname']
                },
                {
                    model: User, // 좋아요 누른
                    as: 'Likers',
                    attributes: ['id']
                }
            ]
        });
        res.status(201).send(fullPost);
    } catch(e) {
        console.error(e);
        next(e);
    }
});


router.post('/:postId/comment', isLoggedIn, async (req, res, next) => {
    try {
        const currentPost = await Post.findOne({
            where: { id: req.params.postId }
        });
        if (!currentPost) {
            return res.status(403).send('존재하지 않는 게시글 입니다.');
        }
        const comment = await Comment.create({
            content: req.body.data.content,
            PostId: +(req.params.postId),
            UserId: req.user.id, // 로그인 한번 한 이후 deserialize 실행으로 user에 접근가능하다.
        });

        const fullComment = await Comment.findOne({
            where: { id: comment.id },
            include: [
                { model: User, attributes: ['id', 'nickname'] }
            ]
        })

        res.status(201).send(fullComment);
    } catch(e) {
        console.error(e);
        next(e);
    }
});


//순서
// 1. isLoggedIn check
// 2. upload.array에서 이미 이미지를 업로드하고
// 3. 여기부분은 이미지 업로드 다된 후에 실행이 된다.
router.post('/images', isLoggedIn, upload.array('images'), async  (req, res, next) => {
    try {
        // console.log(req.files)
        res.json(req.files.map(v => v.location.replace(/\/original\//, '/thumb/')))
    } catch (e) {
        console.error(e);
        next(e);
    }
})

router.patch('/:postId/like', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId }
        });
        if (!post) {
            return res.status(403).send('게시글이 존재하지 않습니다');
        }
        await post.addLikers(req.user.id);
        res.json({ PostId: post.id, UserId: req.user.id });
    } catch (e) {
        console.error(e);
        next(e)
    }
});

router.delete('/:postId/like', isLoggedIn, async (req, res, next) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId }
        });
        if (!post) {
            return res.status(403).send('게시글이 존재하지 않습니다');
        }
        await post.removeLikers(req.user.id);
        res.json({ PostId: post.id, UserId: req.user.id });
    } catch (e) {
        console.error(e);
        next(e)
    }
});

//DELETE
router.delete('/:postId', isLoggedIn, async (req, res, next) => {
    try {
        await Post.destroy({
            where: {
                id: req.params.postId,
                UserId: req.user.id,
            }
        });
        res.json({ PostId: +(req.params.postId) })
    } catch (e) {
        console.error(e);
        next(e)
    }

});

router.get('/:postId', async (req, res, next) => {
    try {
        const currentPost = await Post.findOne({
            where: { id: req.params.postId },
        });
        if (!currentPost) {
            return res.status(404).send('존재하지 않는 게시글 입니다.');
        }
        const fullPost = await Post.findOne({
            where: { id: currentPost.id },
            include: [
                { model: Post, as: 'Retweet', include: [{ model: User, attributes: ['id', 'nickname'] }, { model: Image, }] },
                { model: User, attributes: ['id', 'nickname'] },
                { model: Image },
                { model: Comment, include: [{ model: User, attributes: ['id', 'nickname'] }] },
                { model: User, as: 'Likers', attributes: ['id'] },
            ]
        })
        res.status(200).send(fullPost);
    } catch(e) {
        console.error(e);
        next(e);
    }
});


router.post('/:postId/retweet', isLoggedIn, async (req, res, next) => {
    try {
        const currentPost = await Post.findOne({
            where: { id: req.params.postId },
            include: [{
                model: Post,
                as: 'Retweet',
            }]
        });
        if (!currentPost) {
            return res.status(403).send('존재하지 않는 게시글 입니다.');
        }
        if (req.user.id === currentPost.UserId || (currentPost.Retweet && currentPost.Retweet.UserId === req.user.id)) {
            // 본인게시글을 리트윗 또는 내 게시물을 리트윗한것을 다시 리트윗 --> 이거는 막을것이얌.
            return res.status(403).send('자신의 글은 리트윗 불가능합니다.');
        }
        const retweetTargetId = currentPost.RetweetId || currentPost.id;
        // 리트윗한거 또 못하도록
        const exPost = await Post.findOne({
            where: {
                UserId: req.user.id,
                RetweetId: retweetTargetId,
            }
        });
        if (exPost) {
            return res.status(403).send('이미 리트윗 했습니다.');
        }
        const retweet = await Post.create({
            UserId: req.user.id,
            RetweetId: retweetTargetId,
            content: 'retweet',
        });
        const retweetWithPrevPost = await Post.findOne({
            where: { id: retweet.id },
            include: [
                { model: Post, as: 'Retweet', include: [{ model: User, attributes: ['id', 'nickname'] }, { model: Image, }] },
                { model: User, attributes: ['id', 'nickname'] },
                { model: Image },
                { model: Comment, include: [{ model: User, attributes: ['id', 'nickname'] }] },
                { model: User, as: 'Likers', attributes: ['id'] },
                ]
        })
        res.status(201).send(retweetWithPrevPost);
    } catch(e) {
        console.error(e);
        next(e);
    }
});

module.exports = router;
