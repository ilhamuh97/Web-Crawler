import React, { useState } from 'react';
import { List, Tooltip, Button, Checkbox, Typography } from 'antd';
import { StopOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UrlStatus } from '../../models/UrlStatus';

const { Text } = Typography;

interface HoverableListItemProps {
    item: any;
    activeJobIds: Set<number>;
    deletingJobIds: Set<number>;
    selectedUrls: Set<number>;
    renderStatus: (status: UrlStatus) => React.ReactNode;
    startCrawl: (item: any) => void;
    stopCrawl: (id: number) => void;
    deleteJob: (id: number) => void;
    handleCheckbox: (checked: boolean, id: number) => void;
}

const index: React.FC<HoverableListItemProps> = ({
    item,
    activeJobIds,
    deletingJobIds,
    selectedUrls,
    renderStatus,
    startCrawl,
    stopCrawl,
    deleteJob,
    handleCheckbox,
}) => {
    const [active, setActive] = useState(false);
    const isActiveJob = activeJobIds.has(item.id);

    return (
        <List.Item
            onMouseEnter={() => setActive(true)}
            onMouseLeave={() => setActive(false)}
            style={{
                backgroundColor:
                    item.status === 'in_progress'
                        ? '#fffbe6'
                        : item.status === 'success'
                            ? '#ffffff'
                            : item.status === 'failed'
                                ? '#fff1f0'
                                : '#f5f5f5',
                transition: 'background-color 0.3s ease',
                minHeight: "3rem",
            }}
            actions={
                active
                    ? [
                        renderStatus(item.status),
                        isActiveJob && item.status === 'in_progress' ? (
                            <Tooltip title="Stop Crawl">
                                <Button
                                    size="small"
                                    icon={<StopOutlined />}
                                    onClick={e => {
                                        e.stopPropagation();
                                        stopCrawl(item.id);
                                    }}
                                />
                            </Tooltip>
                        ) : (
                            <Tooltip title="Start Crawl">
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<PlayCircleOutlined />}
                                    onClick={e => {
                                        e.stopPropagation();
                                        startCrawl(item);
                                    }}
                                    loading={isActiveJob}
                                />
                            </Tooltip>
                        ),
                        <Tooltip title="Delete">
                            <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                loading={deletingJobIds.has(item.id)}
                                onClick={e => {
                                    e.stopPropagation();
                                    deleteJob(item.id);
                                }}
                            />
                        </Tooltip>,
                    ]
                    : []
            }
        >
            <List.Item.Meta
                avatar={
                    <Checkbox
                        checked={selectedUrls.has(item.id)}
                        onChange={e => {
                            e.stopPropagation();
                            handleCheckbox(e.target.checked, item.id);
                        }}
                    />
                }
                description={
                    <Tooltip title={item.url}>
                        <Text ellipsis style={{ maxWidth: '100%' }}>
                            {item.url}
                        </Text>
                    </Tooltip>
                }
            />
        </List.Item>

    );
};

export default index;
