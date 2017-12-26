// Annotations
export function Connect(endpoint: string) {
  const method: any = HttpMethod;
  method.metadata = {
    endpoint: endpoint,
    method: "connect",
  };
  return method;
}

export function Delete(endpoint: string) {
  const method: any = HttpMethod;
  method.metadata = {
    endpoint: endpoint,
    method: "delete",
  };
  return method;
}

export function Get(endpoint: string) {
  const method: any = HttpMethod;
  method.metadata = {
    endpoint: endpoint,
    method: "get",
  };
  return method;
}

export function Head(endpoint: string) {
  const method: any = HttpMethod;
  method.metadata = {
    endpoint: endpoint,
    method: "head",
  };
  return method;
}

export function Options(endpoint: string) {
  const method: any = HttpMethod;
  method.metadata = {
    endpoint: endpoint,
    method: "options",
  };
  return method;
}

export function Patch(endpoint: string) {
  const method: any = HttpMethod;
  method.metadata = {
    endpoint: endpoint,
    method: "patch",
  };
  return method;
}

export function Post(endpoint: string) {
  const method: any = HttpMethod;
  method.metadata = {
    endpoint: endpoint,
    method: "post",
  };
  return method;
}

export function Put(endpoint: string) {
  const method: any = HttpMethod;
  method.metadata = {
    endpoint: endpoint,
    method: "put",
  };
  return method;
}

export function Trace(endpoint: string) {
  const method: any = HttpMethod;
  method.metadata = {
    endpoint: endpoint,
    method: "trace",
  };
  return method;
}


export interface HttpMethodMetadata {
  method?: string;
  endpoint?: string;
}

export class HttpMethod {
  protected static metadata: HttpMethodMetadata;
  constructor(type, prop, config) {
    Object.defineProperty(type[prop], "__annotation__", {
      configurable: config.configurable,
      enumerable: false,
      writable: config.configurable,
      value: HttpMethod.metadata
    })
  }
}
