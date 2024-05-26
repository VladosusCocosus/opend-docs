import {HTTPMethods, MethodsType, Request} from "./types";
import {match} from "path-to-regexp";
import {Response} from "./response";


export class Methods {
    methods: MethodsType = {
        [HTTPMethods.POST]: [],
        [HTTPMethods.GET]: [],
    }

    get (url: string, callback: (req: Omit<Request, 'body'>, res: Response) => void) {
        console.log(this.methods)
        this.methods = {
            ...this.methods,
            [HTTPMethods.GET]: [
                ...this.methods[HTTPMethods.GET] ?? [],
                {
                    url,
                    callback,
                    matchFn: match(url),
                }
            ]
        }
    }

    post (url: string, callback: (req: Request, res: Response) => void) {
        this.methods = {
            ...this.methods,
            [HTTPMethods.POST]: [
                ...this.methods[HTTPMethods.POST] ?? [],
                {
                    url,
                    callback,
                    matchFn: match(url),
                }
            ]
        }
    }
}

