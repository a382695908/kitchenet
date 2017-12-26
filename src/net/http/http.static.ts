import {HttpIO} from "./http.server";
import * as serveStatic from 'serve-static';
import {ServerResponse} from "http";

export interface HttpStaticResource {
  fallthrough?: boolean;
  redirect?: boolean;
  setHeaders?: (response: ServerResponse, path: string) => void;
  maxage?: number;
}

export interface HttpStaticMap {
  [endpint: string]: any
  length: number;
}

export class HttpStatic {
  static create(base: string, options: HttpStaticResource) {
    return new HttpStatic(base, options);
  }

  staticMap: HttpStaticMap = {length: 0};

  protected constructor(protected base: string, protected options: HttpStaticResource) {
  }

  set(path: string) {
    const key = "/" + path;
    this.staticMap[key] = serveStatic([this.base, path].join("/"), this.options);
    this.staticMap[this.staticMap.length++] = key;
  }

  cross(index: number, io: HttpIO) {
    const endOrNull = this.staticMap.length === 0 || index === this.staticMap.length;
    return endOrNull ? Promise.resolve(io) : new Promise<HttpIO>(resolve => {
      const key = this.staticMap[index++];

      if (io.request.url.indexOf(key) >= 0) {
        this.staticMap[key]({
          url: io.request.url.replace(key, ""),
          method: io.request.method,
          headers: io.request.headers,
        }, io.response, err => {
          this.cross(index, io).then(resolve);
        });
      } else {
        this.cross(index, io).then(resolve);
      }
    });
  }
}