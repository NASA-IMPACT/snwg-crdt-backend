import { Server } from '@hocuspocus/server'
import { SQLite } from '@hocuspocus/extension-sqlite'
import { Logger } from "@hocuspocus/extension-logger";

const sqliteDb = process.env.APP_SQLITE_DB;

const server = Server.configure({
    port: 8001,
    extensions: [
        new SQLite({
            database: sqliteDb,
        }),
        new Logger()
    ],
})

server.listen()
