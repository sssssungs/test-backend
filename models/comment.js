// const DataTypes = require('sequelize');
// const { Model } = DataTypes;
// class 사용하는 최신문법
// module.export = class Comment extends Model {
//     static init(sequelize) {
//         return super.init({
//             content: {
//                 type: DataTypes.TEXT,
//                 allowNull: false,
//             },
//         }, {
//             modelName: 'Comment',
//             tableName: 'comments', // table 이름은 소문자에 복수로 자동생성.
//             charset: 'utf8mb4', // mb4 : emoticon
//             collate: 'utf8mb4_general_ci', // korean lang save
//             sequelize
//         })
//     }
//     static associate(db) {
//         db.Comment.belongsTo(db.User);
//         db.Comment.belongsTo(db.Post);
//     }
// }
//
module.exports = (sequelize, DataTypes) => {
    // model은 대문자로 만들어도 mysql에서는 소문자 + 복수형태로 table 생성됨
    const Comment = sequelize.define('Comment', {
        // id: {}, 기본으로 세팅해줌 mysql에서
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        charset: 'utf8mb4', // mb4 : emoticon
        collate: 'utf8mb4_general_ci', // korean lang save
    });
    Comment.associate = (db) => {
        db.Comment.belongsTo(db.User);
        db.Comment.belongsTo(db.Post);

    };
    return Comment;
}
