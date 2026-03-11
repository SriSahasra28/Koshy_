const Sequelize = require("sequelize");
const { EnvVariables, CommonEnums } = require("../utils/common.enums");

const sequelize = new Sequelize(
  EnvVariables.DATABASE.DB,
  EnvVariables.DATABASE.USER,
  EnvVariables.DATABASE.PASSWORD,
  {
    host: EnvVariables.DATABASE.HOST,
    dialect: EnvVariables.DATABASE.dialect,
    pool: {
      max: EnvVariables.DATABASE.pool.max,
      min: EnvVariables.DATABASE.pool.min,
      acquire: EnvVariables.DATABASE.pool.acquire,
      idle: EnvVariables.DATABASE.pool.idle,
    },
  }
);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");

    CommonEnums.setFyresAccesstoken({ sequelize });
  })
  .catch((error) => {
    console.error("Unable to connect to the database: ", error);
  });

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;
