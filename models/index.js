const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};
// class 사용하는 최신문법
// const comment = require('./comment');

const sequelize = new Sequelize(config.database, config.username, config.password, config);

// class 사용하는 최신문법
// db.Comment = comment;

// sequelize로 model 등록
db.Comment = require('./comment')(sequelize, Sequelize)
db.Post = require('./post')(sequelize, Sequelize)
db.User = require('./user')(sequelize, Sequelize)
db.Hashtag = require('./hashtag')(sequelize, Sequelize)
db.Image = require('./image')(sequelize, Sequelize)

// class 사용하는 최신문법
// Object.keys(db).forEach((modelName) => {
//   db[modelName].init(sequelize)
// })

// associate (관계) 설정해준다
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
