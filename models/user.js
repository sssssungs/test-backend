module.exports = (sequelize, DataTypes) => {
    // model은 대문자로 만들어도 mysql에서는 소문자 + 복수형태로 table 생성됨
    const User = sequelize.define('User', {
        // id: {}, 기본으로 세팅해줌 mysql에서
        email: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true,
        },
        nickname: {
            type: DataTypes.STRING(30),
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci', // korean lang save
    });
    User.associate = (db) => {
        db.User.hasMany(db.Post); // 1:N 관계
        db.User.hasMany(db.Comment); // 1:N 관계
        db.User.belongsToMany(db.Post, { through: 'Like', as:'Liked' }); // through: 중간테이블 이름 넣을수 있음, as로 이름붙일수 있음
        db.User.belongsToMany(db.User, { through: 'Follow', as:'Followers', foreignKey:'FollowingId' }); // foreignkey로 중간테이블 id의 이름을 바꿔준다
        db.User.belongsToMany(db.User, { through: 'Follow', as:'Followings', foreignKey:'FollowerId' });
    };
    return User;
}
