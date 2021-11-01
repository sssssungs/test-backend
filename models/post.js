module.exports = (sequelize, DataTypes) => {
    // model은 대문자로 만들어도 mysql에서는 소문자 + 복수형태로 table 생성됨
    const Post = sequelize.define('Post', {
        // id: {}, 기본으로 세팅해줌 mysql에서
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        charset: 'utf8mb4', // mb4 : emoticon
        collate: 'utf8mb4_general_ci', // korean lang save
    });
    Post.associate = (db) => {
        db.Post.belongsTo(db.User); // key를 column 으로 자동생성 해준다.
        db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag'}); // N:N 관계 (중간 관계 테이블이 하나 생긴다)
        db.Post.hasMany(db.Comment);
        db.Post.hasMany(db.Image);
        db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers' }); // 뒤에 중간테이블 이름 넣을수 있음, as로 이름 붙일수 있음
        // 관계형으로 설정해놓으면 post.addLikers / post.removeLikers / post.getLikers , setLikers 등등 이런 메소드가 자동으로 생성됨.
        db.Post.belongsTo(db.Post, { as: 'Retweet' }); //retweet용. as 하면 컬럼 id가 RetweetId 로 변경되서 생성됨.
    };
    return Post;
}
