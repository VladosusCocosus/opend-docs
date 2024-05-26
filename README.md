# Backend framework своими руками
### Вы узнате
* Что такое Backend
* Как устроен http модуль в Node JS
* Как создать свой простой Node JS server без сторонних библиотек 
* Добавив валидацию входящих данных
* Добавим возможность добавлять свои кастомные модули
* На основе возможности добавлять модули попробуем написать свой генератор Open API схем

## Backend
А зачем вообще нужен Backend?

Когда вы заходите на сайт, вы всегда отправляете
запрос на получение данных на другой компьютер
находящийся в интернете, такой компьютер называют Backend'ом

Backend отвечает за выдачу данных пользователю, ограничение пользователя в зависимости от его прав,
обработкой данных перед сохранением в базу данных, бизнес логикой вашего приложения

Данные которые возвращает нам сервер могут быть в любом виде (строка, HTML,
JSON, медиа файлы и др.). Серверы могут общаться друг с другом или отдавать данные
на клиентские интерфейсы, будь то мобильное приложение, 
сайт или любой другой устройство с интерфейсом

Что в основном происходит на сервере?

В основном на сервере происходит работа с данными, обработка, сохранение в базу, получение данных из базы,
создание очередей задач и множество других операций над данными

Плавно перейдем из этого модуля в модуль про Node HTTP, для простоты и рассмотрим HTTP 
модуль на примере простого сервера

## Задача (уровень easy)
* Ознакомиться с библиотекой HTTP
* Запустить свой первый сервер
* Научиться принимать запрос и парсить значения из разных мест
* Сделать простой роутер


### Node HTTP
Встроенная библиотека позволяющая работать с HTTP, принимать запросы и отсылать ответы или создавать свой HTTP клиент

    HTTP модуль не блокирует поток и может обрабатывать сразу несколько запросов в один момент

#### Запуск сервера
```typescript
import * as http from "node:http";

const PORT = 3000

http.createServer((req, res) => {
    console.log({url: req.url, method: req.method, headers: req.headers})
    res.end("Hello World")
}).listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})
```

1. Импортируем http из node:http
2. Указывает порт, для удобства вынес в переменную
3. ```http.createServer``` Запускает сервер и позволяет работать с запросом и ответом в callback функции ```requestListener```
4. ```listen``` создает listener для определенного порта, в нашем случае ```3000```, в callback мы можем вывести сообщение об успешном запуске

```typescript
console.log({url: req.url, method: req.method, headers: req.headers}) -> для просмотра самых важных полей
``` 

```shell
$ curl  http://127.0.0.1:3000/users

-> {
  url: '/users',
  method: 'GET',
  headers: { host: '127.0.0.1:3000', 'user-agent': 'curl/8.4.0', accept: '*/*' }
}
```

##### Добавим несколько методов

```typescript
import * as http from "node:http";

const PORT = 3000

http.createServer((req, res) => {
    console.log({url: req.url, method: req.method, headers: req.headers})
    if (req.method === 'POST') {
        if (req.url === '/users') {
            return res.end("POST USERS")
        }
    }

    if (req.method === 'GET') {
        if (req.url === '/users') {
            return res.end("GET USERS")
        }
    }
    
    res.writeHead(404)
    res.end("Not Found")
}).listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})
```

Мы добавили несколько условий по которым ```POST /users``` вернет ```POST USERS```, ```GET /users``` вернет ```GET USERS```

Отлавливаем запросы, которые не попали ни в один метод

```typescript
res.writeHead(404)
res.end("Not Found")
```

```bash
$ curl -X POST http://localhost:3000/users
$ POST USERS
```

#### Search Params & Body
В текущей реализации обработать запрос вместе с Search Params не получится.
Мы получим Search Params прямо в нашем url и не попадем ни в один из хенделов

```bash
curl -X POST http://localhost:3000/users?q=123

-> { url: '/users?q=123', method: 'POST' }
```

В Node JS есть встроенный механизм преобразования url.
С помощью него мы сможем разбить наш url на составные части 

```typescript
import { URL } from 'node:url'
...

http.createServer((req, res) => {
    const url = new URL(req.url ?? '', `https://${req.headers.host}/`);
    console.log(url)

    if (req.method === 'POST') {
        if (url.pathname === '/users') {
    ...
```

1. Импортируем класс URL из библиотеки node:url
2. Создаем новый instance класса URL, первым аргументом передаем req.url, второй аргумент получаем путем склеивания протокола и host из headers


   Содержание URL Instance
```typescript
-> URL {
  href: 'https://localhost:3000/users?q=3',
  origin: 'https://localhost:3000',
  protocol: 'https:',
  username: '',
  password: '',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/users',
  search: '?q=3',
  searchParams: URLSearchParams { 'q' => '123' },
  hash: ''
}
```

```
pathname: '/users',
searchParams: URLSearchParams { 'q' => '123' }
```

3. Меняем req.url на url.pathname в нашем роутере
4. Теперь мы знаем где лежат наши Search Params


```typescript
...
const url = new URL(req.url ?? '', `https://${req.headers.host}/`);

const params = Object.fromEntries(url.searchParams)

console.log(params)

if (req.method === 'POST') {
...
```

```js
-> { q: '123' }
```
#### Body

1. Body приходит к нам в виде потока, для того что бы получить его, мы можем подписаться и слушать event ```data```
2. В конце, когда весь буфер собран мы можем собрать его в единую строку и преобразовать в JSON

```typescript
...
const bodyStream = [];
let requestBody;
req
    .on('data', (chunk) => {
        bodyStream.push(chunk);
    })
    .on('end', () => {
      const bufferData = Buffer.concat(bodyStream);
      requestBody = JSON.parse(bufferData.toString());
    });
...
```

Последним шагов, давайте сделаем приберемся в нашем классе
1. Создадим class Server, этот класс станет входной точкой для запуска сервера и регистрации новых методов
2. класс Server будет принимать параметры для запуска: PORT, Callback
3. Вынесем получение body, search params и pathname в отдельную функцию
4. Сделаем функцию start для запуска сервера


```typescript
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
```

### Роутер

Кажется самое время добавить в наше решение роутер и начать регистрировать наши методы снаружи. Мы воспользуемся готовым решением в виде библиотеки [path-to-regexp](https://www.npmjs.com/package/path-to-regexp)

```bash
$ npm install path-to-regexp --save
```

Удалим наши методы ```POST /users``` и ```GET /users``` и попробуем зарегистрировать их снаружи

1. Создадим класс для наших ответов, на текущий момент на важно знать о том, что при помощи заголовков браузер и другие клиенты понимают как работать с разными типами ответов
```typescript
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
```

1. Наш класс будет принимать аргумент res (response) для дальнейшей модификации
2. Создаем несколько вариантов ответа ```json```, ````html````, задаем в заголовках правильный mime type для json - ```application/json```, для html - ```text/html```
3. Создаем метод ```status```, он поможет нам задавать статус ответа пользуясь chain операцией ```res.status(200).json()```

Созданием подобных классов я стараюсь снизить сложность взаимодействия с framework'ом


2. Создаем класс для хранения и операциями над хедлерами (методами)
```typescript
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
```

1. Создаем переменную которую будем наполнять методами (типы ниже)
2. Создаем два метода ```post``` и ```get```, в дальнейшем пользователь будет вызывать их для регистрации

В этом блоке мы импортируем [match](https://www.npmjs.com/package/path-to-regexp#match) ```import {match} from "path-to-regexp";```
Она позволит нам создать url с параметрами ```/users/:id/tasks```. Такая же библиотека используется в express

Типы
```typescript
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
```


Собираем все вместе
```typescript
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
    
    get (url: string, callback: (req: Omit<Request, 'body'>, res: Response) => void) {
        this.methods.get(url, callback)
    }
    post (url: string, callback: (req: Request, res: Response) => void) {
        this.methods.post(url, callback)
    }


    start() {
        http.createServer((req, res) => {
            const response = new Response(res)
            const { body, searchParams, pathname } = getInput(req)

            if (!req.method) {
                response.setStatus(404).json({error: "Method not found"})
                return
            }
            
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
```

