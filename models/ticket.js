const Sequelize = require("sequelize")
const db = require("../startup/db")
const User = require("./user")
const Department = require("./department")

const Ticket = db.define(
  "Ticket",
  {
    name: Sequelize.STRING,
    deadline: Sequelize.DATE,
    status: {
      type: Sequelize.ENUM("in-progress", "closed", "open"),
      defaultValue: "open",
    },
    description: Sequelize.TEXT,
    user_id: Sequelize.INTEGER,
    videoUrl: Sequelize.TEXT,
    department_id: Sequelize.INTEGER,
    closedOn: {
      type: Sequelize.DATE,
      defaultValue: null,
    },
  },
  {
    timestamps: true,
  }
)

User.hasMany(Ticket, {
  as: "Ticket",
  foreignKey: "user_id",
  onDelete: "CASCADE",
})

Ticket.belongsTo(User, {
  as: "User",
  foreignKey: "user_id",
  onDelete: "CASCADE",
})

Ticket.hasOne(Department, {
  as: "department",
  foreignKey: "department_id",
  onDelete: "CASCADE",
})

module.exports = Ticket
