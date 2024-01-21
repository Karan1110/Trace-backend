const Sequelize = require("sequelize")
const db = require("../startup/db")
const jwt = require("jsonwebtoken")
const Experience = require("./experience")
const Notification = require("./notifications")
const Performance = require("./performance")

const Employee = db.define(
  "Employee",
  {
    name: Sequelize.STRING,
    email: {
      type: Sequelize.STRING,
      unique: true,
    },
    password: Sequelize.STRING,
    age: Sequelize.INTEGER,
    salary: Sequelize.INTEGER,
    isAdmin: Sequelize.BOOLEAN,
    manager_id: Sequelize.INTEGER,
    education_id: Sequelize.INTEGER,
    department_id: Sequelize.INTEGER,
    performance_id: {
      type: Sequelize.INTEGER,
    },
    total_working_days: {
      type: Sequelize.INTEGER,
      defaultValue: 25,
      // allowNull : false
    },
    total_meetings: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    attended_meetings: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    chats: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
    },
    last_seen: Sequelize.DATE,
    isOnline: Sequelize.BOOLEAN,
    punctuality_score: {
      type: Sequelize.VIRTUAL,
      get() {
        const temp =
          (this.getDataValue("attended_meetings") /
            this.getDataValue("total_meetings")) *
          100

        if (Math.round(temp) > 75) {
          return `Probably will attend meetings - ${temp}%`
        } else if (Math.round(temp) < 75) {
          return `May or may not attend - ${temp}%`
        } else if (Math.round(temp) < 25) {
          return `Probably will not attend - ${temp}%`
        }
      },
    },
  },
  {
    timestamps: true,
  }
)
Employee.belongsTo(Performance, {
  as: "Performance",
  foreignKey: "performance_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

Employee.hasMany(Experience, {
  as: "Experience",
  foreignKey: "employee_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})
Experience.belongsTo(Employee, {
  as: "Employee",
  foreignKey: "employee_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

Employee.belongsTo(Employee, {
  as: "Manager",
  foreignKey: "manager_id",
  selfGranted: true,
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

Employee.hasMany(Notification, {
  as: "Notification",
  foreignKey: "employee_id",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
})

// Employee.hasMany(Employee, {
//   as: "Employees",
//   foreignKey: "manager_id",
//   selfGranted: true,
//   onDelete: "CASCADE",
//   onUpdate: "CASCADE",
// })

Employee.prototype.generateAuthToken = function () {
  const token = jwt.sign(
    { id: this.getDataValue("id"), isadmin: this.getDataValue("isadmin") },
    "karan112010"
  )
  return token
}

module.exports = Employee
