import type { RequestHandler } from "express";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  generateFinanceMonthlyReportPdfForMonth,
  getFinanceClientSummary,
  getFinanceIntegrity,
  getFinanceProjectSummary,
  getFinanceSummary,
  listFinanceEvents
} from "../finance/finance.runtime";
import { failure, success } from "../utils/responses";

type AuthSessionLocals = {
  authSession?: AuthResolvedSessionContext;
};

function getAuthSession(resLocals: unknown): AuthResolvedSessionContext | null {
  return (resLocals as AuthSessionLocals | undefined)?.authSession ?? null;
}

export const getFinanceSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }

  const month = typeof req.query.month === "string" ? req.query.month : null;
  const response = await getFinanceSummary(authSession, month);
  if (!response) {
    return void res.status(403).json(failure("FORBIDDEN", "Finance summary is unavailable."));
  }
  res.json(success(response, { scope: "finance-summary" }));
};

export const getFinanceClientSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }

  const response = await getFinanceClientSummary(authSession, req.params.id);
  if (!response) {
    return void res.status(404).json(failure("NOT_FOUND", "Client finance summary not found."));
  }
  res.json(success(response, { scope: "finance-client-summary" }));
};

export const getFinanceProjectSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }

  const response = await getFinanceProjectSummary(authSession, req.params.id);
  if (!response) {
    return void res.status(404).json(failure("NOT_FOUND", "Project finance summary not found."));
  }
  res.json(success(response, { scope: "finance-project-summary" }));
};

export const listFinanceEventsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }

  const month = typeof req.query.month === "string" ? req.query.month : null;
  const clientId = typeof req.query.clientId === "string" ? req.query.clientId : null;
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : null;
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;

  const response = await listFinanceEvents(authSession, { month, clientId, projectId, limit });
  if (!response) {
    return void res.status(403).json(failure("FORBIDDEN", "Finance events are unavailable."));
  }
  res.json(success(response, { scope: "finance-events" }));
};

export const getFinanceIntegrityHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }

  const response = await getFinanceIntegrity(authSession);
  if (!response) {
    return void res.status(403).json(failure("FORBIDDEN", "Finance integrity checks are unavailable."));
  }
  res.json(success(response, { scope: "finance-integrity" }));
};

export const generateFinanceMonthlyReportPdfHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }

  const month = typeof req.query.month === "string" ? req.query.month : null;
  const response = await generateFinanceMonthlyReportPdfForMonth(authSession, month);
  if (!response) {
    return void res.status(403).json(failure("FORBIDDEN", "Finance monthly report PDF is unavailable."));
  }
  res.json(success(response, { scope: "finance-monthly-report-pdf" }));
};
