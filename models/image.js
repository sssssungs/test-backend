module.exports = (sequelize, DataTypes) => {
    // model은 대문자로 만들어도 mysql에서는 소문자 + 복수형태로 table 생성됨
    const Image = sequelize.define('Image', {
        // id: {}, 기본으로 세팅해줌 mysql에서
        src: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci', // korean lang save
    });
    Image.associate = (db) => {
        db.Image.belongsTo(db.Post); // key를 column 으로 자동생성 해준다.

    };
    return Image;
}
