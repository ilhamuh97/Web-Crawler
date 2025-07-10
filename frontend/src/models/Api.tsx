import type { CrawlTask } from "./CrawlTask";

export type ApiKeyResponse = { api_key: string };
export type ApiErrorResponse = { message: string };
export type CrawlTaskResponse = CrawlTask;
export type CrawlTaskListResponse = CrawlTask[];
