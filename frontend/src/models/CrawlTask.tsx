import type { UrlStatus } from "./UrlStatus";

export interface CrawlTask {
    id: number;
    url: string;
    status?: UrlStatus;
    html_version?: string | null;
    page_title?: string | null;
    h1_count?: number | null;
    h2_count?: number | null;
    h3_count?: number | null;
    internal_links?: number | null;
    external_links?: number | null;
    broken_links?: number | null;
    has_login_form?: boolean | null;
    created_at?: string;
}
