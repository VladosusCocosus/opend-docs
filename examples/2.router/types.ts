import {MatchFunction} from "path-to-regexp";
import {Response} from "./response";

export interface Request {
    body: Record<string, unknown>,
    params: Record<string, unknown>
    query: Record<string, unknown>
    headers: Record<string, unknown>
}

export interface Method {
    url: string
    callback: (req: Request, res: Response) => void
    matchFn: MatchFunction<object>
}


export enum HTTPMethods {
    CONNECT = 'CONNECT',
    DELETE = 'DELETE',
    GET = 'GET',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
    PATCH = 'PATCH',
    POST = 'POST',
    PUT = 'PUT',
    TRACE = 'TRACE'
}

export type MethodsType = Record<HTTPMethods.POST | HTTPMethods.GET, Method[]>
