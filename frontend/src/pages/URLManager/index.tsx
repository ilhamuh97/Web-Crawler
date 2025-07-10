import React, { useState, useRef, useEffect } from 'react';
import {
    Input,
    Button,
    List,
    Space,
    Typography,
    Card,
    Row,
    Col,
    Empty,
    Checkbox,
    Badge,
    message,
    Spin,
} from 'antd';
import {
    PlayCircleOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useApi } from '../../hooks/useApi';
import HoverableListItem from '../../components/HoverableListItem'
import type { UrlStatus } from '../../models/UrlStatus';

const { Title } = Typography;

interface UrlItem {
    id: number;
    url: string;
    status: UrlStatus;
}

const URLManager: React.FC = () => {
    const [url, setUrl] = useState('');
    const [urls, setUrls] = useState<UrlItem[]>([]);
    const [selectedUrls, setSelectedUrls] = useState<Set<number>>(new Set());
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [addingJob, setAddingJob] = useState(false);
    const [activeJobIds, setActiveJobIds] = useState<Set<number>>(new Set());
    const controllers = useRef<Map<number, AbortController>>(new Map());
    const [deletingJobIds, setDeletingJobIds] = useState<Set<number>>(new Set());

    const {
        addCrawlJob,
        updateCrawlJobStatus,
        listCrawlJobs,
        deleteCrawlJob,
        crawlUrl,
    } = useApi();

    useEffect(() => {
        const loadJobs = async () => {
            setLoadingJobs(true);
            try {
                const res = await listCrawlJobs();
                const jobs = res?.map((job: any) => ({
                    id: job.id,
                    url: job.url,
                    status: job.status,
                })) || [];
                setUrls(jobs);
            } catch (err: any) {
                message.error(err.message || 'Failed to load crawl jobs.');
            } finally {
                setLoadingJobs(false);
            }
        };

        loadJobs();
    }, [listCrawlJobs]);

    const addUrl = async () => {
        const trimmed = url.trim();
        if (!trimmed) {
            message.warning('Please enter a URL.');
            return;
        }

        try {
            const testUrl = new URL(trimmed);
            if (!/^https?:/.test(testUrl.protocol)) {
                throw new Error('Invalid protocol');
            }
        } catch {
            message.error('Invalid URL (must start with http:// or https://).');
            return;
        }

        setAddingJob(true);
        try {
            const res = await addCrawlJob(trimmed);
            const newJob: UrlItem = {
                id: res.id,
                url: trimmed,
                status: res.status as UrlStatus,
            };
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

    const startCrawlSelected = () => {
        urls
            .filter(u => selectedUrls.has(u.id))
            .forEach(item => startCrawl(item));
        setSelectedUrls(new Set());
    };

    const startCrawl = async (item: UrlItem) => {
        if (controllers.current.has(item.id)) {
            message.info(`Crawl for ${item.url} is already running.`);
            return;
        }

        const controller = new AbortController();
        controllers.current.set(item.id, controller);
        setActiveJobIds(prev => new Set(prev).add(item.id));
        updateUrlStatus(item.id, 'in_progress');

        try {
            await updateCrawlJobStatus(item.id, 'in_progress');
            await crawlUrl(item.id, controller.signal);
            await updateCrawlJobStatus(item.id, 'success');
            updateUrlStatus(item.id, 'success');
            message.success(`Crawl succeeded for ${item.url}`);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                message.info(`Crawl for ${item.url} was stopped.`);
            } else {
                message.error(`Failed: ${err.message || 'Unknown error'}`);
                updateUrlStatus(item.id, 'failed');
                await updateCrawlJobStatus(item.id, 'failed');
            }
        } finally {
            controllers.current.delete(item.id);
            setActiveJobIds(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    };

    const stopCrawl = async (id: number) => {
        const controller = controllers.current.get(id);
        if (!controller) {
            message.info(`No active crawl to stop for ID ${id}`);
            return;
        }
        controller.abort();
        await updateCrawlJobStatus(id, 'failed');
        updateUrlStatus(id, 'failed');
        controllers.current.delete(id);
        setActiveJobIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const updateUrlStatus = (id: number, status: UrlStatus) => {
        setUrls(prev =>
            prev.map(item =>
                item.id === id ? { ...item, status } : item
            )
        );
    };

    const renderStatus = (status: UrlStatus) => {
        switch (status) {
            case 'pending':
                return <Badge status="default" text="Pending" />;
            case 'in_progress':
                return <Badge status="processing" text="Crawling" />;
            case 'success':
                return <Badge status="success" text="Success" />;
            case 'failed':
                return <Badge status="error" text="Failed" />;
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

    return (
        <Row justify="center">
            <Col xs={24} sm={24} md={24} lg={24}>
                <Card
                    styles={{ body: { padding: '16px' } }}
                    variant='borderless'
                    title={<Title level={4}>URL Manager</Title>}
                >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Input.Search
                            placeholder="Enter a valid URL (e.g., https://example.com)"
                            enterButton="Add"
                            size="small"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onSearch={addUrl}
                            loading={addingJob}
                        />

                        {loadingJobs ? (
                            <Spin tip="Loading URLs..." />
                        ) : urls.length === 0 ? (
                            <Empty description="No URLs added yet." />
                        ) : (
                            <>
                                <Checkbox
                                    indeterminate={
                                        selectedUrls.size > 0 && selectedUrls.size < urls.length
                                    }
                                    checked={selectedUrls.size === urls.length && urls.length > 0}
                                    onChange={e => {
                                        setSelectedUrls(
                                            e.target.checked ? new Set(urls.map(u => u.id)) : new Set()
                                        );
                                    }}
                                >
                                    Select All
                                </Checkbox>

                                <List
                                    bordered
                                    size="small"
                                    dataSource={urls}
                                    renderItem={item => (
                                        <HoverableListItem
                                            item={item}
                                            activeJobIds={activeJobIds}
                                            deletingJobIds={deletingJobIds}
                                            selectedUrls={selectedUrls}
                                            renderStatus={renderStatus}
                                            startCrawl={startCrawl}
                                            stopCrawl={stopCrawl}
                                            deleteJob={deleteJob}
                                            handleCheckbox={handleCheckbox}
                                        />
                                    )}
                                />

                                {selectedUrls.size > 0 && (
                                    <Row justify="center">
                                        <Space direction="vertical" align='center'>
                                            <Button
                                                type="primary"
                                                icon={<PlayCircleOutlined />}
                                                onClick={startCrawlSelected}
                                            >
                                                Start Crawling Selected
                                            </Button>

                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={async () => {
                                                    for (const id of selectedUrls) {
                                                        await deleteJob(id);
                                                    }
                                                    setSelectedUrls(new Set());
                                                }}
                                            >
                                                Delete Selected
                                            </Button>
                                        </Space>
                                    </Row>
                                )}
                            </>
                        )}
                    </Space>
                </Card>
            </Col>
        </Row>
    );
};

export default URLManager;
