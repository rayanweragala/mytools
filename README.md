# webhooks

`webhooks` is a local webhook playground.
Point third-party webhooks at it, tweak endpoint responses, and watch requests live.
It is great for auth failures, retry sequences, delayed responses, and replay testing.

You get request replay, embedded ngrok controls, and persisted endpoint configs (`data/config.json`).

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:8787`.

## Optional ngrok token

```bash
cp .env.example .env
# set NGROK_AUTHTOKEN in .env
```

No token? Tunnel start still attempts to run.

## Endpoint behavior controls

Each endpoint tab has its own auth mode (`NONE`, `API_KEY`, `BEARER`), status code,
retry sequence (`503,503,200`), response delay, response headers JSON, and response body.

## API quick reference

`GET /api/state`  
`PUT /api/config/:endpoint`  
`POST /api/config/reset`  
`POST /api/profiles/save`  
`GET /api/profiles`  
`DELETE /api/profiles/:id`  
`POST /api/profiles/:id/load`  
`POST /api/logs/clear`  
`POST /api/logs/:id/replay`  
`GET /api/tunnel/status`  
`POST /api/tunnel/start`  
`POST /api/tunnel/stop`  
`POST /webhook/:endpoint`

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

Run it, point webhooks at it, and break things on purpose.
