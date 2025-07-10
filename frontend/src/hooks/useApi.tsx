import { useCallback } from 'react';
import type { ApiErrorResponse, ApiKeyResponse, CrawlTaskListResponse, CrawlTaskResponse } from '../models/Api';
import type { CrawlTask } from '../models/CrawlTask';

const API_BASE = 'http://localhost:8080/api';

export const useApi = () => {
    const getApiKey = useCallback(async (): Promise<string> => {
        const res = await fetch(`${API_BASE}/api-key`, { method: 'POST' });
        const data: ApiKeyResponse | ApiErrorResponse = await res.json();

        if (!res.ok) {
            throw new Error((data as ApiErrorResponse)?.message || `Server responded with ${res.status}`);
        }

        const apiKey = (data as ApiKeyResponse).api_key;

        if (!apiKey) {
            throw new Error('API key is missing in response.');
        }

        localStorage.setItem('api_key', apiKey);
        return apiKey;
    }, []);

    const crawlUrl = useCallback(
        async (id: number, signal?: AbortSignal): Promise<CrawlTaskResponse> => {
            let apiKey = localStorage.getItem('api_key') || (await getApiKey());

            const res = await fetch(`${API_BASE}/crawl-tasks/${id}/crawl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                signal,
            });

            if (!res.ok) {
                const data: ApiErrorResponse | null = await res.json().catch(() => null);
                throw new Error(data?.message || `Error: ${res.status}`);
            }

            return res.json();
        },
        [getApiKey]
    );

    const addCrawlJob = useCallback(
        async (url: string): Promise<CrawlTaskResponse> => {
            let apiKey = localStorage.getItem('api_key') || (await getApiKey());

            const res = await fetch(`${API_BASE}/crawl-tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ url }),
            });

            if (!res.ok) {
                const data: ApiErrorResponse | null = await res.json().catch(() => null);
                throw new Error(data?.message || `Error: ${res.status}`);
            }

            return res.json();
        },
        [getApiKey]
    );

    const deleteCrawlJob = useCallback(
        async (id: number): Promise<{ message: string }> => {
            let apiKey = localStorage.getItem('api_key') || (await getApiKey());

            const res = await fetch(`${API_BASE}/crawl-tasks/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });

            if (!res.ok) {
                const data: ApiErrorResponse | null = await res.json().catch(() => null);
                throw new Error(data?.message || `Error: ${res.status}`);
            }

            return res.json();
        },
        [getApiKey]
    );

    const updateCrawlJobStatus = useCallback(
        async (id: number, status: CrawlTask['status']): Promise<CrawlTaskResponse> => {
            let apiKey = localStorage.getItem('api_key') || (await getApiKey());

            const res = await fetch(`${API_BASE}/crawl-tasks/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ status }),
            });

            if (!res.ok) {
                const data: ApiErrorResponse | null = await res.json().catch(() => null);
                throw new Error(data?.message || `Error: ${res.status}`);
            }

            return res.json();
        },
        [getApiKey]
    );

    const listCrawlJobs = useCallback(async (): Promise<CrawlTaskListResponse> => {
        let apiKey = localStorage.getItem('api_key') || (await getApiKey());

        const res = await fetch(`${API_BASE}/crawl-tasks`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!res.ok) {
            const data: ApiErrorResponse | null = await res.json().catch(() => null);
            throw new Error(data?.message || `Error: ${res.status}`);
        }

        return res.json();
    }, [getApiKey]);

    return {
        getApiKey,
        crawlUrl,
        addCrawlJob,
        deleteCrawlJob,
        updateCrawlJobStatus,
        listCrawlJobs,
    };
};
