/// <reference types="node" />
import {STATUS_CODES} from 'http';
import {HttpIO} from "./http.server";
import {HttpMethodMetadata} from "./http.method";
import {HttpNavController} from "./http.nav";

export class HttpEndpoint {
  base: string;
  params: string[] = [];

  constructor(endpoint: string) {
    endpoint.split(":").forEach((param, index) => {
      if (index > 0) {
        this.params.push(param.replace("/", ""));
      } else {
        this.base = param;
      }
    });
  }
}

export interface HttpValidatorValue {
  value: any;
  invalid: string;
}

export interface HttpValidator {
  "="?: HttpValidatorValue;
  ">"?: HttpValidatorValue;
  "<"?: HttpValidatorValue;
  ">="?: HttpValidatorValue;
  "<="?: HttpValidatorValue;
  length?: HttpValidatorValue;
  require?: HttpValidatorValue;
  validate?: (data) => string;
}

export interface HttpGuardMap {
  get?: HttpValidator;
  post?: HttpValidator;
  put?: HttpValidator;
  patch?: HttpValidator;
  delete?: HttpValidator;
  head?: HttpValidator;
  trace?: HttpValidator;
  options?: HttpValidator;
  connect?: HttpValidator;
}

export interface HttpFunction {
  port: string;
  instance: any;
}

export class HttpFunctionContainer {
  fn: HttpFunction;
  validator: HttpValidator;
  params: string[];
}

export class HttpFunctionMap {
  get = new HttpFunctionContainer();
  post = new HttpFunctionContainer();
  put = new HttpFunctionContainer();
  patch = new HttpFunctionContainer();
  delete = new HttpFunctionContainer();
  head = new HttpFunctionContainer();
  trace = new HttpFunctionContainer();
  options = new HttpFunctionContainer();
  connect = new HttpFunctionContainer();

  param: { [count: number]: HttpFunctionContainer } = {};
}

export class HttpRouterMap {
  [endpoint: string]: HttpFunctionMap;
}

export class HttpRouter {
  static create() {
    return new HttpRouter();
  }
  protected routerMap = new HttpRouterMap();
  protected navCtrl = HttpNavController.getInstance();

  protected constructor() {
  }

  addService(service: any) {
    for (const key in service) {
      if (typeof service[key] !== "function") continue;
      const metadata: HttpMethodMetadata = service[key].__annotation__;
      const method = metadata.method;
      const endpoint = new HttpEndpoint(metadata.endpoint);
      const map = this.routerMap[endpoint.base] || new HttpFunctionMap();
      const paramCount = endpoint.params.length;
      const hasParam = paramCount > 0;
      const fn = {
        port: key,
        instance: service
      };

      if (hasParam) {
        const paramMap = map.param[paramCount] || new HttpFunctionContainer();
        if (paramMap.fn) {
          throw `[ERROR] endpoint '${endpoint.base}' method '${method}' is already defined!`;
        }
        paramMap.fn = fn;
        map.param[paramCount] = paramMap;
      } else {
        if (map[method].fn) {
          throw `[ERROR] endpoint '${endpoint.base}' method '${method}' is already defined!`;
        }
        map[method].fn = fn;
        if (method === "post") {
          map.options.fn = fn;
        }
      }

      this.routerMap[endpoint.base] = map;
    }
  }

  addGuard(guard: HttpRouterGuard) {
    guard.map((_endpoint, guardMap) => {
      const endpoint = new HttpEndpoint(_endpoint);
      const map = this.routerMap[endpoint.base] || new HttpFunctionMap();
      const paramCount = endpoint.params.length;
      const hasParam = paramCount > 0;

      for (const method in guardMap) {
        if (hasParam) {
          const paramMap = map.param[paramCount] || new HttpFunctionContainer();
          paramMap.params = endpoint.params;
          paramMap.validator = guardMap[method];
          map.param[paramCount] = paramMap;
        } else {
          map[method].validator = guardMap[method];
        }
      }

      this.routerMap[endpoint.base] = map;
    });
  }

  nav(io: HttpIO) {
    return this.navCtrl.nav(this.routerMap, io);
  }
}


export class HttpRouterGuard {
  static create() {
    return new HttpRouterGuard();
  }

  protected guards: { [endpoint: string]: HttpGuardMap };

  protected constructor() {
    this.guards = {};
  }

  map(callback: (endpoint: string, guardMap: HttpGuardMap) => void) {
    for (const endpoint in this.guards) {
      callback(endpoint, this.guards[endpoint]);
    }
  }

  define(method: string, endpoint: string, validator: HttpValidator) {
    const guard = this.guards[endpoint] || {};
    guard[endpoint] = validator;
    return this;
  }

  get(endpoint: string, validator: HttpValidator) {
    return this.define("get", endpoint, validator);
  }

  post(endpoint: string, validator: HttpValidator) {
    return this.define("post", endpoint, validator);
  }

  put(endpoint: string, validator: HttpValidator) {
    return this.define("put", endpoint, validator);
  }

  patch(endpoint: string, validator: HttpValidator) {
    return this.define("patch", endpoint, validator);
  }

  delete(endpoint: string, validator: HttpValidator) {
    return this.define("delete", endpoint, validator);
  }

  head(endpoint: string, validator: HttpValidator) {
    return this.define("head", endpoint, validator);
  }

  trace(endpoint: string, validator: HttpValidator) {
    return this.define("trace", endpoint, validator);
  }

  options(endpoint: string, validator: HttpValidator) {
    return this.define("options", endpoint, validator);
  }

  connect(endpoint: string, validator: HttpValidator) {
    return this.define("connect", endpoint, validator);
  }
}
