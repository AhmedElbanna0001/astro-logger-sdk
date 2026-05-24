# your-logger-sdk

Official SDK for sending logs to your AppLogger platform.

---

## Installation

```bash
npm install logger-sdk
```

---

## Usage

### CommonJS

```js
const logger = require("your-logger-sdk");

logger.init({
  apiKey: "ak_your_api_key_here",
  appName: "my-app",
  baseUrl: "https://your-api.com",
});

const result = await logger.log({ message: "Server started", level: "INFO" });
```

### ES Modules

```js
import { init, log } from "your-logger-sdk";

init({
  apiKey: "ak_your_api_key_here",
  appName: "my-app",
  baseUrl: "https://your-api.com",
});

const result = await log({ message: "Server started", level: "INFO" });
```

---

## API

### `init({ apiKey, appName, baseUrl })`

Must be called once before using `log()`.

| Parameter | Type   | Required | Description                               |
| --------- | ------ | -------- | ----------------------------------------- |
| apiKey    | string | ✅       | Your developer API key from the dashboard |
| appName   | string | ✅       | Your application's unique name            |
| baseUrl   | string | ✅       | Base URL of the logging server            |

---

### `log({ message, level })`

Sends a log entry to the server. Returns a result object — never throws.

| Parameter | Type   | Required | Description                     |
| --------- | ------ | -------- | ------------------------------- |
| message   | string | ✅       | The log message                 |
| level     | string | ✅       | One of: `INFO`, `WARN`, `ERROR` |

#### Success response

```js
{ success: true, data: { _id, message, level, count, createdAt, updatedAt, ... } }
```

#### Error response

```js
{ success: false, status: 403, error: '[logger-sdk] Forbidden: ...' }
```

---

## Handling results

`log()` never throws — always check `result.success`:

```js
const result = await logger.log({ message: "Payment failed", level: "ERROR" });

if (!result.success) {
  console.error(result.error);
} else {
  console.log(`Log saved. Total count: ${result.data.count}`);
}
```

---

## Log levels

| Level | When to use                         |
| ----- | ----------------------------------- |
| INFO  | General info, lifecycle events      |
| WARN  | Minor issues, degraded behavior     |
| ERROR | Critical bugs, failures, exceptions |
