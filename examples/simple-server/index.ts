import * as http from "node:http";
import { URL } from 'node:url'

const PORT = 3000

http.createServer((req, res) => {
    const url = new URL(req.url ?? '', `https://${req.headers.host}/`);

    const params = Object.fromEntries(url.searchParams)

    console.log(params)


    if (req.method === 'POST') {
        if (url.pathname === '/users') {
            return res.end("POST USERS")
        }
    }

    if (req.method === 'GET') {
        if (url.pathname === '/users') {
            return res.end("GET USERS")
        }
    }

    res.writeHead(404)
    res.end("Not Found")
}).listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})
