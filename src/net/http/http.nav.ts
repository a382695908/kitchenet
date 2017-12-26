import {STATUS_CODES} from "http";
import {HttpIO} from "./http.server";
import {HttpFunction, HttpRouterMap} from "./http.router";

const CrossAbleMethods = ["options", "post"];

function crossAble(method) {
  return CrossAbleMethods.indexOf(method) >= 0;
}

export class HttpNavController {
  protected static instance: HttpNavController;

  static getInstance() {
    if (!HttpNavController.instance) HttpNavController.instance = new HttpNavController();
    return HttpNavController.instance;
  }

  nav(routerMap: HttpRouterMap, io: HttpIO): Promise<HttpIO> {
    return new Promise<HttpIO>((resolve, reject) => {
      const endpoints = io.request.url.split("/");
      const lastEndpoint = endpoints.pop();
      // Make method to lower case
      const method = io.request.method = io.request.method.toLowerCase();
      let getData: string;

      // Shift empty
      endpoints.shift();
      // Check if url has params
      lastEndpoint.indexOf("?") >= 0 ? (getData = lastEndpoint.substring(1)) : endpoints.push(lastEndpoint);

      const result = this.matchingFn(routerMap, endpoints, method);

      if (result && result.fn) {
        const fn = result.fn;
        const params = this.mergeParams([
          this.parseGetData(getData),
          this.parsePostData((<any>io.request).data),
          result.urlParams,
        ]);
        const response = fn.instance[fn.port](params, io.request.headers);
        const headers = HttpResponseHeader.create(response.headers);

        if (crossAble(method)) headers.crossAble();

        // 检测类型，并序列化数据
        const data = headers.detectAndSerialize(response.data || response);

        io.response.writeHead(headers.code, headers.content);
        io.response.write(data);
        io.response.end();
        resolve();
      } else {
        // 返回 404
        io.response.writeHead(404);
        io.response.end(STATUS_CODES[404]);
        reject(STATUS_CODES[404]);
      }
    });
  }

  // 匹配最契合的接口
  protected matchingFn(routerMap: HttpRouterMap, endpoints: string[], method: string): { urlParams?: string[], fn?: HttpFunction } {
    const urlParams = [];
    while (true) {
      const endpoint = "/" + endpoints.join("/");
      const map = routerMap[endpoint];

      if (map) {
        const fnc = map[method];

        // 如果有参数的话
        let params: any;
        if (urlParams.length > 0) {
          urlParams.reverse();
          // 匹配 url params
          params = {};
          fnc.params.forEach((key, index) => {
            params[key] = urlParams[index];
          });
        }

        return {
          urlParams: params,
          fn: fnc.fn,
        };
      } else {
        urlParams.push(endpoints.pop());
        if (endpoints.length === 0) return;
      }
    }
  }

  // make name=xxx & age=10 => {name:xxx, age: 10}
  protected parseGetData(data: string) {
    if (!data) return;
    data = decodeURIComponent(data.replace("/?", ""));
    const paramsArray = data.split("&");
    const params: any = {};
    paramsArray.forEach(param => {
      const key_value = param.split("=");
      params[key_value[0]] = key_value[1];
    });
    return params;
  }

  protected parsePostData(data: string) {
    if (!data) return;
    let params: any;
    try {
      params = JSON.parse(data);
    } catch (e) {
      params = this.parseGetData(data);
    }
    return params;
  }

  protected mergeParams(paramsList: any[]) {
    const masterParams: any = {};
    paramsList.forEach(params => Object.assign(masterParams, params));
    return masterParams;
  }
}

export class HttpResponseHeader {
  static create(headers?: any) {
    return new HttpResponseHeader(headers);
  }

  code = 200;

  protected constructor(protected headers?: any) {
    headers = Object.assign({
      "Content-Type": ["charset=utf-8"],
      "X-Powered-By": "Kitchenet 0.0.1"
    }, headers);

    if (headers.code) {
      this.code = headers.code;
      delete headers.code;
    }

    this.headers = headers;
  }

  get content() {
    return this.headers;
  }

  detectAndSerialize(data: any) {
    const contentType = this.headers['content-type'];
    switch (typeof data) {
      case "object":
        // if it's a Buffer
        if (data instanceof ArrayBuffer) {

        } else {
          try {
            // if can be json
            data = JSON.stringify(data);
            contentType.push("application/json");
          } catch (e) {
            // if not

          }
        }
        break;
      case "string":
      case "undefined":
      case "function":
      case "number":
      case "boolean":
      case "symbol":
      default:
        data = data.toString();
    }
    return data;
  }

  crossAble() {
    this.headers = Object.assign(this.headers, {
      "Access-Control-Allow-Origin": ["*"],
      "Access-Control-Allow-Headers": ["*"],
      "Access-Control-Allow-Methods": ["*"],
    });
  }
}