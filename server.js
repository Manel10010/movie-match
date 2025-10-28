const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { Server } = require("socket.io")

const { initSocketServer } = require("./lib/socket-server.ts")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
  })

  global.io = io

  io.on("connection", (socket) => {
    console.log("[v0] Socket connected:", socket.id)

    socket.on("join-combat", (combatId) => {
      socket.join(`combat-${combatId}`)
      console.log("[v0] Socket joined combat:", combatId)
    })

    socket.on("leave-combat", (combatId) => {
      socket.leave(`combat-${combatId}`)
      console.log("[v0] Socket left combat:", combatId)
    })

    socket.on("disconnect", () => {
      console.log("[v0] Socket disconnected:", socket.id)
    })
  })

  server
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
