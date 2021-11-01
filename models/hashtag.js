module.exports = (sequelize, DataTypes) => {
    // model은 대문자로 만들어도 mysql에서는 소문자 + 복수형태로 table 생성됨
    const Hashtag = sequelize.define('Hashtag', {
        // id: {}, 기본으로 세팅해줌 mysql에서
        name: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
    }, {
        charset: 'utf8mb4', // mb4 : emoticon
        collate: 'utf8mb4_general_ci', // korean lang save
    });
    Hashtag.associate = (db) => {
        db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag' });
    };
    return Hashtag;
}
