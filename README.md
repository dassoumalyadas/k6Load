# k6Load

Performance and load testing suite built with [Grafana k6](https://k6.io/).

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) (`brew install k6`)
- Node.js (for `@types/k6` IDE autocompletion and type definitions)

## Setup

```bash
npm install
```

## Running Tests

Execute test scenarios directly with the k6 CLI:

```bash
k6 run test1.js
k6 run test2.js
k6 run E2E.js
```

