import * as http from "node:http";
import { URL } from 'node:url'
import {Methods} from "./methods";
import {Response} from "./response";
import {HTTPMethods, Request} from "./types";

class Server {
    private port = 3000;
    private readonly callback = (port: number) => console.log(`Server started on localhost:${port}`)
    methods = new Methods()

    constructor(port: number, callback: (port: number) => void) {
        this.port = port
        this.callback = callback
    }

    getInput(req: http.IncomingMessage) {
        const url = new URL(req.url ?? '', `https://${req.headers.host}/`);

        const searchParams = Object.fromEntries(url.searchParams)

        const bodyStream: Uint8Array[] = [];
        let requestBody: Record<string, unknown> = {};

        req
            .on('data', (chunk) => {
                bodyStream.push(chunk);
            })
            .on('end', () => {
                const bufferData = Buffer.concat(bodyStream);
                try {
                    requestBody =  JSON.parse(bufferData.toString());
                } catch (e) {
                    // Do nothing
                }

            });

        return { body: requestBody, searchParams: searchParams, pathname: url.pathname }
    }


    get (url: string, callback: (req: Omit<Request, 'body'>, res: Response) => void) {
        this.methods.get(url, callback)
    }
    post (url: string, callback: (req: Request, res: Response) => void) {
        this.methods.post(url, callback)
    }


    start() {
        http.createServer((req, res) => {
            const response = new Response(res)
            const { body, searchParams, pathname } = this.getInput(req)

            if (!req.method) {
                response.setStatus(404).json({error: "Method not found"})
                return
            }

            console.log(this.methods.methods)

            let params: Record<string, unknown> = {}
            const method = this.methods.methods[req.method as HTTPMethods.GET | HTTPMethods.POST].find((m) => {
                const match = m.matchFn(pathname)
                if (match) {
                    params = match.params as Record<string, unknown>
                    return true
                }
                return false
            })

            if (!method) {
                response.json({ error: "Method not found" })
                return
            }


            return method.callback({ body: body, headers: req.headers, params: params, query: searchParams }, response)
        }).listen(this.port, () => this.callback(this.port))
    }
}

const server = new Server(3000, (port) => console.log(port))

server.get('/users/:id', (req, res) => {
    res.json({ hello: `World ${req.params.id}` })
})

server.get('/users', (_, res) => {
    res.json({users: [{ id: 1 }]})
})

server.get('/users/:id/html', (req, res) => {
    res.html(`<div><h1>Users Page ${req.params.id}</h1></div>`)
})

server.start()
