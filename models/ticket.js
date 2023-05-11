const Sequelize = require('sequelize');
const db = require('../startup/db');
const Employee = require('./employee');
const moment = require("moment");

const Ticket = db.define('Ticket', {
    name: Sequelize.STRING,
    steps: Sequelize.ARRAY(Sequelize.STRING),
    deadline : Sequelize.DATE
},{
  timestamps: true 
});

Ticket.afterCreate(async (instance) => {
  const deadline = moment(instance.deadline);
  const newDate = deadline.subtract(1, 'days');

  schedule.scheduleJob(newDate,async () => {
    await Notification.create({
      message: `Ticket pending! complete now!, name  : ${instance.name}`
    });
    
    schedule.scheduleJob(instance.deadline, () => {
      instance.destroy();
    });
    
  });
})

Employee.hasMany(Ticket, {
  as: "TicketEmployee",
  foreignKey: "employee_id",
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

Ticket.sync({force:true}).then(() => {
  const winston = require("winston")
winston.info('Ticket table created');
});

module.exports = Ticket;