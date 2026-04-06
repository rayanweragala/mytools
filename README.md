# mytools

`mytools` is a local webhook playground.
Point third-party mytools at it, tweak endpoint responses, and watch requests live.
It is great for auth failures, retry sequences, delayed responses, and replay testing.

You get request replay, embedded ngrok controls, and persisted endpoint configs (`data/config.json`).

## Data

`data/` is gitignored. Config is local to your machine.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:8787`.

## One-command worker setup (background)

Use this when sharing internally so nobody has to remember install/run steps.
These worker commands are cross-platform (macOS, Linux, and Windows):

```bash
npm run worker:up
```

What it does:
- Installs dependencies automatically when needed.
- Starts `npm run dev` in the background.
- Saves PID/logs under `.run/`.

Useful commands:

```bash
npm run worker:status
npm run worker:logs
npm run worker:stop
npm run worker:restart
```


## Optional ngrok token

```bash
cp .env.example .env
# set NGROK_AUTHTOKEN in .env
```

No token? Tunnel start still attempts to run.

## Endpoint behavior controls

Each endpoint tab has its own auth mode (`NONE`, `API_KEY`, `BEARER`), status code,
retry sequence (`503,503,200`), response delay, response headers JSON, response body, and optional forward URL.

## API quick reference

`GET /api/state`  
`PUT /api/config/:endpoint`  
`POST /api/config/reset`  
`POST /api/profiles/save`  
`GET /api/profiles`  
`DELETE /api/profiles/:id`  
`POST /api/profiles/:id/load`  
`GET /api/chaos`  
`POST /api/chaos`  
`POST /api/logs/clear`  
`POST /api/logs/:id/replay`  
`GET /api/tunnel/status`  
`POST /api/tunnel/start`  
`POST /api/tunnel/stop`  
`POST /webhook/:endpoint`  
`GET /api/config/features`  
`POST /api/builder/send`  
`GET /api/builder/history`  
`POST /api/builder/history/clear`  
`GET /api/collections` · `POST /api/collections` · `DELETE /api/collections/:id` · `POST /api/collections/import`  
`POST /api/collections/:id/requests` · `PUT /api/collections/:id/requests/:reqId` · `DELETE /api/collections/:id/requests/:reqId` · `POST /api/collections/:id/requests/:reqId/run`  
`GET /api/environments` · `GET /api/environments/:id` · `POST /api/environments` · `DELETE /api/environments/:id`  
`PUT /api/environments/:id/variables` · `POST /api/environments/active`  
`POST /api/ai/generate` · `POST /api/ai/analyze-log`

## Real curl examples

Send an inbound call event:

```bash
curl -X POST http://localhost:8787/webhook/incoming-call \
  -H 'Content-Type: application/json' \
  -d '{"event":"incoming_call","call_id":"c_01831","from":"+14155550101","to":"+14155550199"}'
```

Set `incoming-call` to fail twice, then recover:

```bash
curl -X PUT http://localhost:8787/api/config/incoming-call \
  -H 'Content-Type: application/json' \
  -d '{"authType":"NONE","defaultStatusCode":200,"statusCodes":[503,503,200],"responseDelayMs":250,"responseHeaders":{"Content-Type":"application/json"},"responseBody":"{\n  \"accepted\": true\n}"}'
```

Replay log id `12`:

```bash
curl -X POST http://localhost:8787/api/logs/12/replay
```

Run it, point mytools at it, and break things on purpose.
