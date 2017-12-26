import {HttpIO} from "./http.server";

export class HttpChannel {
  static parse(expressMiddleware) {
    return new HttpChannel(expressMiddleware);
  }

  constructor(protected middleware?: any) {
  }

  handler(io: HttpIO): Promise<HttpIO> {
    return this.middleware ? new Promise<HttpIO>((resolve, reject) => {

    }) : Promise.reject("No middleware");
  }
}