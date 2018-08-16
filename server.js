const express = require('express')
const server = express()
server.use(express.json())
const next = require('next')
const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const r = require('rethinkdb')
let connection = null

r.connect({ host: 'localhost', port: 28015 }, (err, conn) => {
  if(err) throw err
  connection = conn
})

app
  .prepare()
  .then(() => {

    server.get('/list', (req, res) => {
      r.table('tv_shows').run(connection, function(err, cursor) {
        if (err) throw err;
        cursor.toArray(function(err, row) {
          if (err) throw err
          res.status(200).json(row)
        })
      })
    })

    server.get('/create_table', (req, res) => {
      r.db('test').tableCreate('tv_shows').run(connection, (err, result) => {
        if(err) throw err
        res.status(200).json(result)
      })
    })

    server.get('/add/:text', (req, res) => {
      r.table('tv_shows').insert({ name: req.params.text }).run(connection, (err, result) => {
        if(err) throw err
        res.status(200).json(result)
      })
    })

    server.get('*', (req, res) => handle(req, res))

    let temp = server.listen(port, (err) => {
      if (err) throw err
      console.log(`> Ready on http://localhost:${port}`)
    })

    const io = require('socket.io')(temp)
    io.on('connection', (socket) => {
      console.log('a user connected')

      r.table('tv_shows').changes().run(connection, (err, cursor) => {
        if (err) throw err
        cursor.each(function(err, row) {
          if (err) throw err
          console.log('changes',row.new_val)
          socket.broadcast.emit('message.chat1', row.new_val)
        })
      })
      socket.on('message.chat1', (data) => {
        console.log('server message.chat1', data)
      })
      socket.on('disconnect', function(){
        console.log('user disconnected')
      })
    })
  })
  .catch((err) => {
    console.log(err)
  })