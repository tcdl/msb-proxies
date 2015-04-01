# msb-proxies

HTTP adapters for [microservicebus](http://github.com/tcdl/msb) framework

![e.g. http2bus and bus2http](docs/end-to-end.png)
<!-- ![e.g. http2bus and bus2http](https://rawgithub.com/tcdl/msb-proxies/docs/end-to-end.png) -->

## Installation

To use globally from the command line:

```
$ npm install msb-proxies -g
```

## http2bus

```
$ http2bus -p=8080 examples/http2bus.json
```

Arguments:
- **-port** or **-p** Default: 0 (random)
- **-dump** or **-d** Default: false – print the config
- **...** Load the config from a JSON or JS file at this path

### Configuration

Example:

```json
{
  "channelMonitorEnabled": false,
  "port": 8080,
  "routes": [
    {
      "bus": {
        "namespace": "test:through",
        "responseTimeout": 3000,
        "waitForResponses": 1
      },
      "http": {
        "methods": ["get"],
        "path": "/api/item/:id"
      }
    }
  ]
}
```

## bus2http

```
$ bus2http examples/http2bus.json
```

Arguments:
- **-dump** or **-d** Default: false – print the config
- **...** Load the config from a JSON or JS file at this path

### Configuration

Example:

```json
{
  "channelMonitorEnabled": false,
  "routes": [
    {
      "bus": {
        "namespace": "test:through"
      },
      "http": {
        "baseUrl": "https://www.google.com"
      }
    }
  ]
}
```

