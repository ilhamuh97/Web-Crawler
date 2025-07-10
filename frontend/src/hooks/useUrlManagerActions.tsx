import { message } from 'antd';
import { useApi } from './useApi';
import type { UrlItem } from './useUrlManagerState';
import type { UrlStatus } from '../models/UrlStatus';

export function useUrlManagerActions(state: ReturnType<typeof import('./useUrlManagerState').useUrlManagerState>) {
    const {
        url, setUrl, setUrls, urls,
        setAddingJob,
        selectedUrls, setSelectedUrls,
        activeJobIds,
        deletingJobIds, setDeletingJobIds
    } = state;

    const {
        addCrawlJob,
        crawlUrl,
        stopCrawlJob,
        deleteCrawlJob
    } = useApi();

    const addUrl = async () => {
        const trimmed = url.trim();
        if (!trimmed) {
            message.warning('Please enter a URL.');
            return;
        }
        try {
            const testUrl = new URL(trimmed);
            if (!/^https?:/.test(testUrl.protocol)) throw new Error('Invalid protocol');
        } catch {
            message.error('Invalid URL (must start with http:// or https://).');
            return;
        }

        setAddingJob(true);
        try {
            const res = await addCrawlJob(trimmed);
            const newJob: UrlItem = { id: res.id, url: trimmed, status: res.status as UrlStatus };
            setUrls(prev => [...prev, newJob]);
            setUrl('');
            message.success('Crawl job added.');
        } catch (err: any) {
            message.error(err.message || 'Failed to add crawl job.');
        } finally {
            setAddingJob(false);
        }
    };

    const handleCheckbox = (checked: boolean, id: number) => {
        setSelectedUrls(prev => {
            const next = new Set(prev);
            checked ? next.add(id) : next.delete(id);
            return next;
        });
    };

    const startCrawl = async (item: UrlItem) => {
        if (activeJobIds.has(item.id)) {
            message.info(`Crawl for ${item.url} is already running.`);
            return;
        }
        try {
            await crawlUrl(item.id);
            message.success(`Crawl started for ${item.url}`);
        } catch (err: any) {
            message.error(`Failed to start crawl: ${err.message || 'Unknown error'}`);
        }
    };

    const startCrawlSelected = () => {
        urls.filter(u => selectedUrls.has(u.id)).forEach(startCrawl);
        setSelectedUrls(new Set());
    };

    const stopCrawl = async (id: number) => {
        try {
            await stopCrawlJob(id);
            message.success(`Stop requested for ID ${id}`);
        } catch (err: any) {
            message.error(`Failed to stop crawl: ${err.message || 'Unknown error'}`);
        }
    };

    const deleteJob = async (id: number) => {
        if (deletingJobIds.has(id)) return;
        setDeletingJobIds(prev => new Set(prev).add(id));
        try {
            await deleteCrawlJob(id);
            setUrls(prev => prev.filter(item => item.id !== id));
            message.success(`Deleted job ID ${id}`);
        } catch (err: any) {
            message.error(err.message || `Failed to delete job ID ${id}`);
        } finally {
            setDeletingJobIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    return {
        addUrl,
        handleCheckbox,
        startCrawl,
        startCrawlSelected,
        stopCrawl,
        deleteJob
    };
}
