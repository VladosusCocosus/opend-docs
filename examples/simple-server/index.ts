import * as http from "node:http";
import { URL } from 'node:url'

interface Options {
    port: number
    callback: () => void
}

class Server {
    options: Options = { port: 3000, callback: () => console.log(`Server started on localhost:${this.options.port}`)}

    constructor(props: Partial<Options>) {
        this.options = {
            ...this.options,
            ...props
        }
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
        }).listen(this.options.port, this.options.callback)
    }
}

const server = new Server({ port: 8888 })
server.start()
