# Backend framework своими руками
### Из этого гайда вы узнате
* Что такое Backend server
* Как устроен http модуль в node js
* Как создать свой простой node js server без сторонних библиотек 
* Добавив валидацию входящих данных
* Добавим возможность добавлять свои кастомные модули
* На основе возможности добавлять модули попробуем написать свой генератор Open API схем

## Backend
Давайте разберемся зачем нам вообще нужен сервер

Когда вы заходите на сайт, вы всегда отправляете
запрос на получение каких-либо данных на другой компьютер 
находящийся в интернете, такой компьютер называют сервером

Данные которые возвращает нам сервер могут быть в любом виде, строка, HTML,
JSON или медиа файлы. Серверы могут общаться друг с другом или отдавать данные
на клиентские интерфейсы, будь то мобильное приложение, 
сайт или любой другой устройство с интерфейсом

Что в основном происходит на сервере?

В основном на сервере происходит работа с данными, сервер может их 
класть в базу, доставить из базы интересующие клиента данные,
создавать очереди задач и множество других операций над данными

Мы не будем сейчас обсуждать нужно ли писать backend на node js,
моя задача постараться разобраться и написать свой Backend Framework
вместе с вами


## Задача (уровень easy)
* Запусть сервер
* Научиться принимать ответ
* Сделать роутер
* Добавить абстракции для упрощения жизни


### Node HTTP
Встроенная библиотека позволяющая создать сервер,
а так же взаимодействовать с другими серверами

HTTP модуль не блокирует поток и может обрабатывать
сразу несколько запросов в один момент

#### Простейший сервер
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

Первым шагом мы импортируем встроенную HTTP библиотеку, определим PORT и
вызываем функцию ```createServer```, аргументом в нашем случае будет callback, 
который принимает req(request), res(response)

Последнее что мы должны сделать для запуска сервера - это вызвать функцию
listen, указать порт, и вывести в callback что все прошло успешно

##### Добавим пару методов и зарберемся что у нас есть в req

В req нас в основом интересует url, headers, method и body

###### url / headers

Если мы оптравим запрос на наш сервер из примера выше, то увидем примерно такую картину в консоли
```js
{
    url: '/users',
    method: 'POST',
    headers: {
        'user-agent': 'PostmanRuntime/7.37.3',
        accept: '*/*',
        host: 'localhost:3000',
        connection: 'keep-alive',
        cookie: 'Cookie_1=value',
        'content-length': '0'
    }
}
```

    Все заголовки в нижнем регистре потому что HTTP заголовки case-insensitive

###### простенький роутер

```typescript
import * as http from "node:http";

const PORT = 3000

http.createServer((req, res) => {
    console.log({url: req.url, method: req.method})
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

Так же мы добавили fallback на случай если в нашем роутере нет такого пути
```typescript
res.writeHead(404)
res.end("Not Found")
```

Вроде все работает, для проверки отправим запрос
```bash
curl -X POST http://localhost:3000/users
```


А что будет если мы добавим searchParams в наш url? Мы увидим что наш url содержит в себе searchParams
```bash
curl -X POST http://localhost:3000/users?q=123

-> { url: '/users?q=123', method: 'POST' }
```

В node есть встроенный механизм парсинга url, который может разбить URL на несколько полезных нам частей, давайте попробуем воспользоваться ими

1. Импортируем класс URL из библиотеки node:url
2. Создаем новый instance класса URL, аргументами передаем req.url и получаем хост путем склеивания протокола и host из headers
3. Меняем req.url на url.pathname в нашем роутере
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

Содержание URL instance
```js
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
  searchParams: URLSearchParams { 'q' => '3' },
  hash: ''
}
```

Так же у нас появилась возможность достать searchParams из URL

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
###### Body

Body приходит к нам в виде стрима, для того что бы получить его, мы можем подписаться и слушать event data

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
      requestBody =  JSON.parse(bufferData.toString());
    });
...
```

Давайте попробуем сделать все чуть-чуть проще перед следующим большим шагом
1. Создадим class Server, этот класс станет основной точкой взаимодействия с нашим сервером
2. класс Server будет принимать параметры для запуска: PORT, Callback
3. Вынесем получение body, search params и pathname в отдельную функцию
4. Сделаем функцию start, она и будет запускать наш сервер


```typescript
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
```
