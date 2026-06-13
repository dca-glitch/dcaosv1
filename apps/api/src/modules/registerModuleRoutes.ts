import type { Router } from "express";
import type { AppModuleContract } from "@dca-os-v1/shared";

export type BackendModuleRouteFactory = {
  module: AppModuleContract;
  register: (router: Router) => void;
};

export function registerModuleRoutes(router: Router, factories: BackendModuleRouteFactory[]) {
  for (const factory of factories) {
    factory.register(router);
  }
}
