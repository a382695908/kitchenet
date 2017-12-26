/// <reference types="node" />
import {Server} from 'http';
import {HttpServer, HttpServerDelegate} from "./net/http/http.server";
import {Get, Post} from "./net/http/http.method";
import {HttpRouterGuard} from "./net/http/http.router";

declare const __dirname;

class Manager {
  @Get("/")
  fn(data) {
    console.log(data);
    return {
      text: "hello world"
    };
  }

  @Post("/api")
  post(data) {
    console.log(data);
    return {
      test: "ok"
    };
  }
}

@HttpServer({
  base: __dirname,
  port: 8888,
  services: [
    Manager
  ],
  guards: [
    HttpRouterGuard.create().get("/", {})
  ],
  static: [
    "public"
  ]
})
class MyServer implements HttpServerDelegate {

  constructor(server: Server) {
  }

  onBootstrap() {
    console.log("onBootstrap");
  }

  onShutdown() {

  }
}