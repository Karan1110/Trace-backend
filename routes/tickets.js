const express = require("express")
const router = express.Router()
const auth = require("../middlewares/auth.js")
const isadmin = require("../middlewares/isAdmin.js")
const User = require("../models/user.js")
const Performance = require("../models/performance.js")
const Notification = require("../models/notification.js")
const Ticket = require("../models/ticket.js")
const moment = require("moment")
const { Op } = require("sequelize")
const admin = require("firebase-admin")
const Comment = require("../models/comment.js")
const Saved = require("../models/saved.js")
const path = require("path")
const multer = require("multer")
const blockedUsers = require("../middlewares/blockedUsers.js")

const serviceAccount = require(path.join(
  __dirname,
  "../karanstore-2c850-firebase-adminsdk-5ry9v-ff376d22e0.json"
))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "karanstore-2c850.appspot.com",
})

const bucket = admin.storage().bucket()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

// count
router.get("/", async (req, res) => {
  try {
    const tickets = []
    const open = await Ticket.count({
      where: {
        status: "open",
      },
    })
    const closed = await Ticket.count({
      where: {
        status: "closed",
      },
    })
    const inProgress = await Ticket.count({
      where: {
        status: "in-progress",
      },
    })
    tickets.push(open)
    tickets.push(closed)
    tickets.push(inProgress)

    res.send(tickets)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

router.get("/all", [auth, blockedUsers], async (req, res) => {
  try {
    let whereClause = {}

    if (req.blockedUsers && req.blockedUsers.length > 0) {
      whereClause = {
        user_id: {
          [Op.notIn]: req.blockedUsers,
        },
      }
    }

    const tickets = await Ticket.findAll({
      where: whereClause,
      order: [
        [
          `${req.query.sortingProperty}`,
          `${req.query.sortingProperty == "createdAt" ? "DESC" : "ASC"}`,
        ],
      ],
    })

    res.json(tickets)
  } catch (ex) {
    console.error(ex.message, ex)
    res.send("Something failed.")
  }
})

router.get("/latest", [auth, blockedUsers], async (req, res) => {
  try {
    let tickets
    if (req.blockedUsers.length > 0) {
      tickets = await Ticket.findAll({
        where: {
          [Op.notIn]: {
            user_id: req.blockedUsers,
          },
        },
        order: [["createdAt", "DESC"]],
        limit: 5,
      })
    } else {
      tickets = await Ticket.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
      })
    }

    res.json(tickets)
  } catch (ex) {
    console.error(ex.message, ex)
    res.send("Something failed.")
  }
})

router.get("/closed", [auth, blockedUsers], async (req, res) => {
  try {
    const whereClauseBase = {
      status: "closed",
    }

    if (req.blockedUsers && req.blockedUsers.length > 0) {
      whereClauseBase.user_id = {
        [Op.notIn]: req.blockedUsers,
      }
    }

    const whereClause =
      req.query.department_id === "all" || !req.query.department_id
        ? whereClauseBase
        : {
            ...whereClauseBase,
            department_id: req.query.department_id,
          }

    const incompleteTickets = await Ticket.findAll({
      where: whereClause,
      order: [
        [
          `${req.query.sortingProperty}`,
          `${req.query.sortingProperty == "createdAt" ? "DESC" : "ASC"}`,
        ],
      ],
    })
    res.json(incompleteTickets)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})
// filter open tickets
router.get("/open", [auth, blockedUsers], async (req, res) => {
  try {
    const whereClause = {
      status: "open",
    }

    if (req.blockedUsers && req.blockedUsers.length > 0) {
      whereClause.user_id = {
        [Op.notIn]: req.blockedUsers,
      }
    }

    if (req.query.department_id && req.query.department_id !== "all") {
      whereClause.department_id = req.query.department_id
    }

    const openTickets = await Ticket.findAll({
      where: whereClause,
      order: [
        [
          `${req.query.sortingProperty}`,
          `${req.query.sortingProperty == "createdAt" ? "DESC" : "ASC"}`,
        ],
      ],
    })
    res.json(openTickets)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})
// filter in-progress tickets
router.get("/in-progress", [auth, blockedUsers], async (req, res) => {
  try {
    const whereClause = {
      status: "in-progress",
    }

    if (req.blockedUsers && req.blockedUsers.length > 0) {
      whereClause.user_id = {
        [Op.notIn]: req.blockedUsers,
      }
    }

    if (req.query.department_id && req.query.department_id !== "all") {
      whereClause.department_id = req.query.department_id
    }

    const tickets = await Ticket.findAll({
      where: whereClause,
      order: [
        [
          `${req.query.sortingProperty}`,
          `${req.query.sortingProperty == "createdAt" ? "DESC" : "ASC"}`,
        ],
      ],
    })
    res.json(tickets)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

router.get("/pending", auth, async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [{ status: "open" }, { status: "in-progress" }],
          },
          { user_id: req.user.id },
        ],
      },
      order: [["createdAt", "DESC"]],
    })

    res.json(tickets)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

router.get("/search", async (req, res) => {
  try {
    const { ticket } = req.query

    if (!ticket) {
      return res
        .status(400)
        .json({ error: "Ticket name is required in the request body." })
    }

    const matchingTickets = await Ticket.findAll({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: `%${ticket}%`,
            },
          },
          {
            description: {
              [Op.iLike]: `%${ticket}%`,
            },
          },
        ],
      },
    })

    res.json(matchingTickets)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})

router.get("/feed", [auth, blockedUsers], async (req, res) => {
  const temp = [...req.blockedUsers, req.user.id]

  const tickets = await Ticket.findAll({
    where: {
      user_id: {
        [Op.notIn]: temp,
      },
    },
  })

  tickets.sort(() => Math.random() - 0.5)
  res.status(200).json(tickets)
})

router.get("/departments", auth, async (req, res) => {
  const user = await User.findByPk(req.user.id)
  const department_id = user.dataValues.department_id
  const tickets = await Ticket.findAll({
    where: {
      department_id: department_id,
    },
  })
  res.json(tickets)
})

router.get("/followingFeed", auth, async (req, res) => {
  const user = await User.findByPk(req.user.id)
  const followedUsers = user.dataValues.followedUsers
  if (followedUsers) {
    const tickets = await Ticket.findAll({
      where: {
        user_id: {
          [Op.in]: followedUsers,
        },
      },
    })
    return res.json(tickets)
  } else {
    return res.status(400).send([])
  }
})

router.get("/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "User",
          include: {
            as: "mySavedTickets",
            model: Saved,
          },
        },
        {
          as: "Comments",
          model: Comment,
        },
      ],
    })

    res.json(ticket)
  } catch (ex) {
    console.error(ex)
    res.status(500).json({ error: "Internal Server Error" })
  }
})
router.post("/", [auth, upload.single("video")], async (req, res) => {
  const user = await User.findByPk(req.body.user_id)
  if (!user) return res.status(400).send("User not found")

  const start_date = moment(req.body.deadline)
  const now = moment()

  // Check if the deadline is more than two days later
  if (start_date.diff(now, "days") < 1) {
    return res
      .status(400)
      .send(
        `Deadline should be at least two days later - ${start_date.diff(
          now,
          "days"
        )}`
      )
  }

  const ticket = await Ticket.create({
    name: req.body.name,
    user_id: req.body.user_id,
    deadline: start_date.toDate(),
    status: req.body.status,
    description: req.body.description,
    department_id: req.body.department_id,
  })

  await Notification.create({
    message: `a new ticket for you! - ${ticket.dataValues.name}`,
    user_id: req.body.user_id,
  })

  if (req.file) {
    const videoBuffer = req.file.buffer
    const videoFileName = `trace/video_${ticket.id}.mp4`

    // Save the video to a temporary file
    const video = bucket.file(videoFileName)
    await video.save(videoBuffer)

    // Update ticket with signed URL
    const signedUrl = await video.getSignedUrl({
      action: "read",
      expires: "03-09-2491", // Replace with a far future date
    })

    await ticket.update({
      videoUrl: signedUrl[0],
    })
  }

  res.status(200).send(ticket)
})

router.post("/save/:id", auth, async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.user.id,
      },
      include: [
        {
          as: "Saved",
          model: Saved,
        },
      ],
    })

    if (user.Saved.some((saved) => saved.id === req.params.id)) {
      return res.status(400).send("Already saved...")
    }

    await Saved.create({
      ticket_id: req.params.id,
      user_id: req.user.id,
    })

    res.send("saved!")
  } catch (ex) {
    console.log("ERROR : ", ex.message)
    console.log(ex)
    res.send("something failed...")
  }
})

router.post("/save/remove/:id", auth, async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.user.id,
      },
      include: [
        {
          as: "Saved",
          model: Saved,
        },
      ],
    })

    if (user.Saved.some((saved) => saved.id !== req.body.ticket_id)) {
      return res.status(400).send("not saved...")
    }

    await Saved.destroy({
      where: {
        ticket_id: req.params.id,
        user_id: req.user.id,
      },
    })

    res.send("removed!")
  } catch (ex) {
    console.log("ERROR : ", ex.message)
    console.log(ex)
    res.send("something failed...")
  }
})

router.put("/close/:id", [auth], async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id)
  if (!ticket) return res.status(404).json({ message: "ticket not found..." })

  await Ticket.update(
    {
      status: "closed",
      closedOn: new Date(),
    },
    {
      where: {
        id: req.params.id,
      },
    }
  )

  res.status(200).json({ message: "done!" })
})

router.put("/assign/:id", [auth], async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id)
  if (!ticket) return res.status(404).json({ message: "ticket not found..." })

  const user = await User.findByPk(req.body.user_id)
  if (req.body.user_id !== null && !user)
    return res.status(404).json({ message: "user not found..." })

  await Ticket.update(
    {
      user_id: req.body.user_id,
    },
    {
      where: {
        id: req.params.id,
      },
    }
  )

  res.status(200).json({ message: "done!" })
})

router.put("/:id", [auth, isadmin], async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id)
  if (!ticket) return res.status(404).json({ message: "ticket not found..." })

  const deadline = moment(req.body.deadline)

  await Ticket.update(
    {
      name: req.body.name,
      deadline: deadline.toDate(),
      status: req.body.status,
      description: req.body.description,
    },
    {
      where: {
        id: req.params.id,
      },
    }
  )

  res.status(200).send(ticket)
})

router.delete("/:id", [auth, isadmin], async (req, res) => {
  await Ticket.destroy({
    where: {
      id: req.params.id,
    },
  })

  res.status(200).send("Deleted successfully")
})

module.exports = router
