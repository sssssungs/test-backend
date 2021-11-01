const express = require('express');
const app = express();
const postRouter = require('./routes/post');
const postsRouter = require('./routes/posts');
const userRouter = require('./routes/user');
const hashtagRouter = require('./routes/hashtag');
const db = require('./models');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const passportConfig = require('./passport');
const helmet = require('helmet');
const hpp = require('hpp');

db.sequelize.sync()
    .then(() => {
        console.log('db connection success')
    })
    .catch((err) => {
        console.log(err)
    });

passportConfig();
dotenv.config();
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined')); // front -> back 요청관련 url이 로깅됨.
    app.use(hpp());
    app.use(helmet())
} else {
    app.use(morgan('dev')); // front -> back 요청관련 url이 로깅됨.

}
//app.use는 다 middle ware
// (req, res, next) 자체를 middle ware 라고 한다.
// front에서 받은 json을 req body에 넣어주는 역할을 해준다. (middleware)
// 아래 route 실행 코드 보다 위에 있어야함.
app.use('/', express.static(path.join(__dirname, 'uploads'))); // 여기서 '/'는 localhost:3065/ 의 의미를 가짐.
app.use(express.json()); // front에서 json보낸거를 body에 넣어줌. (axios로 보낼때)
app.use(express.urlencoded({ extended: true })); //front에서 form submit으로 보낸거를 body에 넣어줌
app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: process.env.COOKIE_SECRET,
    // 도메인 사용하게 될 경우 이렇게 한다.
    // cookie: {
    //     httpOnly: true,
    //     secure: false,
    //     domain: process.env.NODE_ENV === 'production' && '.randy-bird.com'
    // }
}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors({
    origin: ['http://localhost:3000', 'randy-bird.com', 'http://3.34.118.0'], // '*', // 별표시하면 보낸곳의 주소가 자동으로 들어간다.
    credentials: true, // 쿠키도 공유시키는것. (도메인이 다른데 쿠키 공유하도록한다. 로그인할때 특히)
}));

// **************************************
// 브라우저에서 서버로 요청할때는 cors 발생하지만,
// 서버에서 서버로 요청할때 에러는 나지 않는다.
// 그래서 브라우저에서 프론트 서버로 보내고, 여기서 백엔드 서버에서 요청하도록 하기도함. --> 이런 방식 proxy라고 한다.
// **************************************

app.get('/', (req,res) => {
    res.send('hello express')
})
// prefix로 구분을
app.use('/post', postRouter); // prefix
app.use('/posts', postsRouter); // prefix
app.use('/user', userRouter); // prefix
app.use('/hashtag', hashtagRouter);

// npx sequelize --> sequelize 초기세팅

app.listen(80, () => {
    console.log('::::: server is running :::::')
});


// app.use((err, req, res, next) => {
    // 에러처리 미들웨어 -> next(arg) 에서 arg에 어떤 값을 보낼때 여기를 무조건 실행하고 간다.
// })

// put : 전체수정
// patch : 부분수정
// options : 찔러보기 (서버한테 요청가능한지 확인)
// head : header만 가져옴

