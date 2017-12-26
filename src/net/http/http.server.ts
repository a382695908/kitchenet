/// <reference types="node" />
import {Server, createServer, IncomingMessage, ServerResponse} from 'http';
import {HttpRouter, HttpRouterGuard} from "./http.router";
import {HttpStatic, HttpStaticResource} from "./http.static";
import {HttpChannel} from "./http.channel";

export interface HttpServerDelegate {
  staticConfig?: HttpStaticResource;

  bootstrap?: () => void;
  shutdown?: () => void;
  onBootstrap?: () => void;
  onShutdown?: () => void;
}

export interface HttpServerMetadata {
  base: string;
  port?: number;
  host?: [number, number, number, number];
  services?: any[];
  static?: string[],
  channels?: HttpChannel[];
  guards?: HttpRouterGuard[];
}

export interface HttpIO {
  request: IncomingMessage;
  response: ServerResponse;
}

export class HttpServerFactory {
  static create(options?: HttpServerMetadata) {
    return new HttpServerFactory(Object.assign({
      port: 8260,
      host: [0, 0, 0, 0],
    }, options));
  }

  protected context: Server;
  protected delegate: HttpServerDelegate;
  protected channels: HttpChannel[] = [];
  protected router = HttpRouter.create();
  protected static: HttpStatic;

  protected constructor(protected options: HttpServerMetadata) {
    if (this.options.channels) {
      this.options.channels.forEach(channel => this.channel(channel));
    }

    if (this.options.guards) {
      this.options.guards.forEach(guard => this.guard(guard));
    }

    if (this.options.services) {
      this.options.services.forEach(service => this.service(service));
    }
  }

  setDelegate(delegate: HttpServerDelegate) {
    this.delegate = delegate;
    this.static = HttpStatic.create(this.options.base, delegate.staticConfig);
    this.options.static.forEach(path => this.static.set(path));
  }

  protected crossChannel(index: number, io: HttpIO) {
    const endOrNull = this.channels.length === 0 || this.channels.length === index;
    return endOrNull ? Promise.resolve(io) : this.channels[index++].handler(io).then(io => this.crossChannel(index, io));
  }

  bootstrap() {
    this.context = createServer((request: IncomingMessage, response: ServerResponse) => {

      let postData;

      request.on("data", chunk => {
        if (postData) {
          postData += chunk;
        } else {
          postData = chunk;
        }
      });


      request.on("end", () => {
        if (postData) {
          (<any> request).data = postData.toString();
        }

        const io_$0 = {request: request, response: response};

        // 先过滤静态资源的请求
        this.static.cross(0, io_$0).then((io_$1: HttpIO) => {
          // 再过滤请求
          this.crossChannel(0, io_$1).then((io_$2: HttpIO) => {
            // 最后导航到指定 endpoint 中
            this.router.nav(io_$2).catch(err => console.log(err));
          }).catch(err => console.log(err));
        }).catch(err => console.log(err));
      });
    });

    const port = this.options.port;
    const host = this.options.host.join(".");

    this.context.listen(port, host, () => {
      console.log(`http://localhost:${port}`);
      this.delegate.onBootstrap && this.delegate.onBootstrap();
    });
  }

  channel(channel: HttpChannel) {
    this.channels.push(channel);
  }

  guard(guard: HttpRouterGuard) {
    this.router.addGuard(guard);
  }

  service(serviceClass: any) {
    let service: any;
    switch (typeof serviceClass) {
      case "object":
        service = serviceClass;
        break;
      case "function":
        service = new serviceClass();
        break;
      default:
        return;
    }
    this.router.addService(service);
  }

  shutdown() {
    this.context.close(() => {
      this.delegate.onShutdown && this.delegate.onShutdown();
    });
  }
}


export function HttpServer(metadata: HttpServerMetadata) {
  const loader: any = ServerLoader;
  loader.metadata = metadata;
  return loader;
}

export class ServerLoader {
  protected static metadata: HttpServerMetadata;

  constructor(ServerClass) {
    const context = HttpServerFactory.create(ServerLoader.metadata);
    const delegate: HttpServerDelegate = new ServerClass();
    context.setDelegate(delegate);
    context.bootstrap();
  }
}