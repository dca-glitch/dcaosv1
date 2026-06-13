import type { RequestHandler } from "express";
import { ApiError } from "../middleware/errorMiddleware";
import { getModule, listModules } from "../services/moduleService";
import { success } from "../utils/responses";

export const listModuleDefinitions: RequestHandler = (_req, res) => {
  res.json(success(listModules()));
};

export const getModuleDefinition: RequestHandler = (req, res, next) => {
  const moduleDefinition = getModule(req.params.key);

  if (!moduleDefinition) {
    next(new ApiError(404, "MODULE_NOT_FOUND", "Module definition was not found."));
    return;
  }

  res.json(success(moduleDefinition));
};
