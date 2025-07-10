import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import type { CrawlTask } from '../models/CrawlTask';

export function useDashboardData() {
    const { listCrawlJobs } = useApi();
    const [data, setData] = useState<CrawlTask[]>([]);
    const [filteredData, setFilteredData] = useState<CrawlTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await listCrawlJobs();
                setData(result);
                setFilteredData(result);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [listCrawlJobs]);

    const handleSearch = (value: string) => {
        setSearchText(value);
        const lower = value.toLowerCase();
        const filtered = data.filter(
            task =>
                task.page_title?.toLowerCase().includes(lower) ||
                task.url?.toLowerCase().includes(lower)
        );
        setFilteredData(filtered);
    };

    return {
        data,
        filteredData,
        loading,
        searchText,
        handleSearch,
    };
}
