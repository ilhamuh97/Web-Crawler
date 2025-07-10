import { useState, useEffect } from 'react';
import { message } from 'antd';
import type { UrlStatus } from '../models/UrlStatus';
import { useApi } from './useApi';

export interface UrlItem {
    id: number;
    url: string;
    status: UrlStatus;
}

export function useUrlManagerState() {
    const [url, setUrl] = useState('');
    const [urls, setUrls] = useState<UrlItem[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<Set<number>>(new Set());
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [addingJob, setAddingJob] = useState(false);
    const [activeJobIds, setActiveJobIds] = useState<Set<number>>(new Set());
    const [deletingJobIds, setDeletingJobIds] = useState<Set<number>>(new Set());

    const { listCrawlJobs } = useApi();

    useEffect(() => {
        const loadJobs = async () => {
            try {
                const res = await listCrawlJobs();
                const jobs = res?.map((job: any) => ({
                    id: job.id,
                    url: job.url,
                    status: job.status,
                })) || [];
                setUrls(jobs);
                setActiveJobIds(new Set(jobs.filter((j: any) => j.status === 'in_progress').map(j => j.id)));
            } catch (err: any) {
                message.error(err.message || 'Failed to load crawl jobs.');
            } finally {
                setLoadingJobs(false);
            }
        };

        loadJobs();
        const interval = setInterval(loadJobs, 3000);
        return () => clearInterval(interval);
    }, [listCrawlJobs]);

    return {
        url,
        setUrl,
        urls,
        setUrls,
        selectedUrls,
        setSelectedUrls,
        loadingJobs,
        setLoadingJobs,
        addingJob,
        setAddingJob,
        activeJobIds,
        setActiveJobIds,
        deletingJobIds,
        setDeletingJobIds,
    };
}
