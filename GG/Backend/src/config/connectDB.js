
import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';

// add actual password instead of null
const sequelize = new Sequelize('languageexchangematchmaker', 'root', null, {
  host: 'localhost',
  dialect: 'mysql'
});

let connectDB = async() => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }

}

// Sequelize functions were not working for me; added the mysql2 library as an alternative way to access database fields directly
// both connections to the database were exported in case some developers prefer sequelize
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // your actual password, may be 'null'
  database: 'languageexchangematchmaker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log(pool); // check that pool is an object with an .execute function

export { pool };
export default { pool, connectDB };