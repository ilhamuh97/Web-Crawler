import React from 'react';
import {
    Input, Button, List, Space, Typography, Card, Row, Col, Empty, Checkbox, Spin,
} from 'antd';
import { PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import HoverableListItem from '../../components/HoverableListItem';
import { useUrlManagerState } from '../../hooks/useUrlManagerState';
import { useUrlManagerActions } from '../../hooks/useUrlManagerActions';

const { Title } = Typography;

const URLManager: React.FC = () => {
    const state = useUrlManagerState();
    const actions = useUrlManagerActions(state);

    const {
        url, setUrl, urls, selectedUrls,
        loadingJobs, addingJob
    } = state;

    return (
        <Row justify="center">
            <Col span={24}>
                <Card
                    styles={{ body: { padding: '16px' } }}
                    variant='borderless'
                    title={<Title level={4} style={{ margin: 0 }}>URL Manager</Title>}
                >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Input.Search
                            placeholder="Enter a valid URL (e.g., https://example.com)"
                            enterButton="Add"
                            size="small"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onSearch={actions.addUrl}
                            loading={addingJob}
                        />

                        {loadingJobs ? (
                            <Spin tip="Loading URLs..." />
                        ) : urls.length === 0 ? (
                            <Empty description="No URLs added yet." />
                        ) : (
                            <>
                                <Checkbox
                                    indeterminate={selectedUrls.size > 0 && selectedUrls.size < urls.length}
                                    checked={selectedUrls.size === urls.length && urls.length > 0}
                                    onChange={e => {
                                        state.setSelectedUrls(
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
                                            activeJobIds={state.activeJobIds}
                                            deletingJobIds={state.deletingJobIds}
                                            selectedUrls={selectedUrls}
                                            renderStatus={renderStatus}
                                            startCrawl={actions.startCrawl}
                                            stopCrawl={actions.stopCrawl}
                                            deleteJob={actions.deleteJob}
                                            handleCheckbox={actions.handleCheckbox}
                                        />
                                    )}
                                />

                                {selectedUrls.size > 0 && (
                                    <Row justify="center">
                                        <Space direction="vertical" align='center'>
                                            <Button
                                                type="primary"
                                                icon={<PlayCircleOutlined />}
                                                onClick={actions.startCrawlSelected}
                                            >
                                                Start Crawling Selected
                                            </Button>

                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={async () => {
                                                    for (const id of selectedUrls) {
                                                        await actions.deleteJob(id);
                                                    }
                                                    state.setSelectedUrls(new Set());
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

const renderStatus = (status: string) => {
    switch (status) {
        case 'pending':
            return <Typography.Text type="secondary">Pending</Typography.Text>;
        case 'in_progress':
            return <Typography.Text type="warning">Crawling</Typography.Text>;
        case 'success':
            return <Typography.Text type="success">Success</Typography.Text>;
        case 'failed':
            return <Typography.Text type="danger">Failed</Typography.Text>;
    }
};

export default URLManager;
