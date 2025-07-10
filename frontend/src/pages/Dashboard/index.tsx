import React from 'react';
import {
    Card,
    Space,
    Row,
    Col,
    Typography,
    Input,
    Table,
    Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import type { CrawlTask } from '../../models/CrawlTask';
import { useDashboardData } from '../../hooks/useDashboardData';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const Dashboard: React.FC = () => {
    const { filteredData, loading, searchText, handleSearch } = useDashboardData();

    const statusColors: Record<string, string> = {
        pending: 'default',
        in_progress: 'processing',
        success: 'success',
        failed: 'error',
    };

    const columns: ColumnsType<CrawlTask> = [
        {
            title: 'Title',
            dataIndex: 'page_title',
            key: 'page_title',
            sorter: (a, b) => (a.page_title || '').localeCompare(b.page_title || ''),
            render: (_, record) => (
                <Link to={`/details/${record.id}`}>
                    {record.page_title || record.url}
                </Link>
            ),
            ellipsis: true,
        },
        {
            title: 'URL',
            dataIndex: 'url',
            key: 'url',
            render: (url: string) => (
                <a href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                </a>
            ),
            ellipsis: true,
        },
        {
            title: 'HTML Version',
            dataIndex: 'html_version',
            key: 'html_version',
            sorter: (a, b) => (a.html_version || '').localeCompare(b.html_version || ''),
        },
        {
            title: 'H1 Count',
            dataIndex: 'h1_count',
            key: 'h1_count',
            sorter: (a, b) => (a.h1_count || 0) - (b.h1_count || 0),
        },
        {
            title: 'H2 Count',
            dataIndex: 'h2_count',
            key: 'h2_count',
            sorter: (a, b) => (a.h2_count || 0) - (b.h2_count || 0),
        },
        {
            title: 'H3 Count',
            dataIndex: 'h3_count',
            key: 'h3_count',
            sorter: (a, b) => (a.h3_count || 0) - (b.h3_count || 0),
        },
        {
            title: '# Internal Links',
            dataIndex: 'internal_links',
            key: 'internal_links',
            sorter: (a, b) => (a.internal_links || 0) - (b.internal_links || 0),
        },
        {
            title: '# External Links',
            dataIndex: 'external_links',
            key: 'external_links',
            sorter: (a, b) => (a.external_links || 0) - (b.external_links || 0),
        },
        {
            title: '# Broken Links',
            dataIndex: 'broken_links',
            key: 'broken_links',
            sorter: (a, b) => (a.broken_links || 0) - (b.broken_links || 0),
        },
        {
            title: 'Has Login Form',
            dataIndex: 'has_login_form',
            key: 'has_login_form',
            render: (hasLogin: boolean) => hasLogin ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
            filters: [
                { text: 'Yes', value: true },
                { text: 'No', value: false },
            ],
            onFilter: (value, record) => record.has_login_form === value,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'Pending', value: 'pending' },
                { text: 'In Progress', value: 'in_progress' },
                { text: 'Success', value: 'success' },
                { text: 'Failed', value: 'failed' },
            ],
            onFilter: (value, record) => record.status === value,
            render: status => <Tag color={statusColors[status || 'pending']}>{status}</Tag>,
        },
    ];

    return (
        <Row justify="center">
            <Col span={24}>
                <Card
                    style={{ borderRadius: 8 }}
                    variant='borderless'
                    title={<Title level={4} style={{ margin: 0 }}>Results Dashboard</Title>}
                >
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Paragraph type="secondary">
                            View your crawl results. You can sort, filter, and search across tasks.
                        </Paragraph>

                        <Search
                            placeholder="Search by title or URL"
                            allowClear
                            enterButton
                            size="large"
                            onSearch={handleSearch}
                            value={searchText}
                            onChange={e => handleSearch(e.target.value)}
                        />

                        <Table<CrawlTask>
                            rowKey="id"
                            loading={loading}
                            columns={columns}
                            dataSource={filteredData}
                            pagination={{ pageSize: 10, showSizeChanger: true }}
                            scroll={{ x: 'max-content' }}
                        />
                    </Space>
                </Card>
            </Col>
        </Row>
    );
};

export default Dashboard;
