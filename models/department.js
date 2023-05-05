const Sequelize = require('sequelize');
const db = require('../config/database');
const Employee = require('./employee');
const Position = require('./position');

const Department = db.define('Department', {
  name: Sequelize.STRING
});

Department.hasMany(
    Employee, { as: "employee", foreignKey: "employee_id" }
);
Department.hasOne(
    Position, { as: "Position", foreignKey: "position_id" }
)

Department.sync().then(() => {
  winston.info('Department table created');
});

module.exports = Department;