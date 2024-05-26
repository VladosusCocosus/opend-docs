import http from "node:http";

export class Response {
    private response: http.ServerResponse
    private status: number = 200

    constructor(props: http.ServerResponse) {
        this.response = props
    }

    setStatus (statusCode: number) {
        this.status = statusCode
        return this
    }

    json (value: unknown) {
        this.response.setHeader("Content-Type", "application/json");
        this.response.writeHead(this.status)
        this.response.end(JSON.stringify(value))
    }

    html (value: unknown) {
        this.response.setHeader("Content-Type", "text/html");
        this.response.writeHead(this.status)
        this.response.end(value)
    }
}
