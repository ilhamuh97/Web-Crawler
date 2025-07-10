import { useEffect, useState } from 'react';
import { useApi } from './useApi';
import type { CrawlTask } from '../models/CrawlTask';
import type { BrokenLink } from '../models/BrokenLink';

export function useDetailsData(id: string | undefined) {
    const { listCrawlJobs, getBrokenLinks } = useApi();

    const [task, setTask] = useState<CrawlTask | null>(null);
    const [brokenLinks, setBrokenLinks] = useState<BrokenLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [brokenLinksLoading, setBrokenLinksLoading] = useState(true);

    useEffect(() => {
        const fetchTask = async () => {
            setLoading(true);
            try {
                const allTasks = await listCrawlJobs();
                const found = allTasks.find(t => t.id === Number(id));
                setTask(found || null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const fetchBrokenLinks = async () => {
            setBrokenLinksLoading(true);
            try {
                const result = await getBrokenLinks(Number(id));
                setBrokenLinks(result || []);
            } catch (err) {
                console.error('Failed to fetch broken links:', err);
            } finally {
                setBrokenLinksLoading(false);
            }
        };

        if (id) {
            fetchTask();
            fetchBrokenLinks();
        }
    }, [id, listCrawlJobs, getBrokenLinks]);

    return {
        task,
        brokenLinks,
        loading,
        brokenLinksLoading,
    };
}
