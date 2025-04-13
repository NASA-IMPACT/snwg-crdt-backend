import { Server } from '@hocuspocus/server'
import { SQLite } from '@hocuspocus/extension-sqlite'

const sqliteDb = 'db.sqlite';
const port = 8000;

const server = Server.configure({
  port: port,
  async onConnect() {
    console.log('🔮 Connected!')
  },
  async onDisconnect() {
    console.log('🔮 Disconnected!')
  },
  extensions: [
    new SQLite({
      database: sqliteDb,
    }),
  ],
})

server.listen()
