import * as http from "node:http";
import { URL } from 'node:url'

class Server {
    private port = 3000;
    private readonly callback = (port: number) => console.log(`Server started on localhost:${port}`)

    constructor(port: number, callback: (port: number) => void) {
       this.port = port
       this.callback = callback
    }

    getInput(req: http.IncomingMessage) {
        const url = new URL(req.url ?? '', `https://${req.headers.host}/`);

        const searchParams = Object.fromEntries(url.searchParams)

        const bodyStream: Uint8Array[] = [];
        let requestBody: string = '';

        req
            .on('data', (chunk) => {
                bodyStream.push(chunk);
            })
            .on('end', () => {
                const bufferData = Buffer.concat(bodyStream);
                requestBody =  JSON.parse(bufferData.toString());
            });

        return { body: requestBody, searchParams: searchParams, pathname: url.pathname }
    }

    start() {
        http.createServer((req, res) => {
            const { body, searchParams, pathname } = this.getInput(req)

            console.log(body, searchParams)

            if (req.method === 'POST') {
                if (pathname === '/users') {
                    return res.end("POST USERS")
                }
            }

            if (req.method === 'GET') {
                if (pathname === '/users') {
                    return res.end("GET USERS")
                }
            }

            res.writeHead(404)
            res.end("Not Found")
        }).listen(this.port, () => this.callback(this.port))
    }
}

const server = new Server(8888, (port) => console.log(port))
server.start()
