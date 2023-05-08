const express = require("express");
const employees = require("../routes/employees");
const benefits = require("../routes/benefits");
const performances = require("../routes/performances");
const departments = require("../routes/departments");
const experiences = require("../routes/experiences");
const skills = require("../routes/skills");
const leaves = require("../routes/leaves")
const meetings = require("../routes/meetings")
const login = require("../routes/login")
const notifications = require("../routes/notifications")
const tickets = require("../routes/ticket")
const phone = require("../routes/phone")
const over_times = require("../routes/over_time")
const error = require("../middlewares/error");
const mails = require("../routes/mail");

module.exports = function (app) {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    require("../web sockets/chat")(app);
    app.use("/notifications", notifications);
    app.use("/employees", employees);
    app.use("/benefits", benefits);
    app.use("/departments", departments);
    app.use("/experiences", experiences);
    app.use("/performances", performances);
    app.use("/skills", skills);
    app.use("/tickets", tickets);
    app.use("/over_times", over_times);
    app.use("/verify-email", mails)
    app.use("/leaves", leaves);
    app.use("/phone", phone);
    app.use("/meetings", meetings);
    app.use("/login", login)
    app.use(error);
}