import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Row,
    Col,
    Card,
    Typography,
    Space,
    Button,
    List,
    Tag,
    Spin,
    Tooltip,
} from 'antd';
import ReactApexChart from 'react-apexcharts';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useDetailsData } from '../../hooks/useDetailsData';
import type { ApexOptions } from 'apexcharts';

const { Title, Paragraph, Text } = Typography;

const Details: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { task, brokenLinks, loading, brokenLinksLoading } = useDetailsData(id);

    if (loading || !task) {
        return <Spin tip="Loading task..." />;
    }

    const chartData: {
        series: number[];
        options: ApexOptions;
    } = {
        series: [task.internal_links || 0, task.external_links || 0],
        options: {
            chart: { type: 'donut' },
            labels: ['Internal Links', 'External Links'],
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: { width: '100%' },
                        legend: { position: 'bottom' },
                    },
                },
            ],
        },
    };

    return (
        <Row justify="center">
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <Card
                    styles={{ body: { padding: '16px' } }}
                    variant='borderless'
                    title={
                        <Space direction="horizontal">
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => navigate(-1)}
                                style={{ display: 'flex', alignItems: 'center' }}
                            >
                                Back
                            </Button>
                            <Title level={4} style={{ margin: 0 }}>
                                Crawl Details
                            </Title>
                        </Space>
                    }
                >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Paragraph>
                            <Text strong>URL:</Text> {task.url}
                        </Paragraph>
                        <Paragraph>
                            <Text strong>Page Title:</Text> {task.page_title || 'N/A'}
                        </Paragraph>

                        <Card title="Internal vs External Links">
                            <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
                                <ReactApexChart
                                    options={chartData.options}
                                    series={chartData.series}
                                    type="donut"
                                />
                            </div>
                        </Card>

                        <Card title={`Broken Links (${brokenLinks?.length})`}>
                            {brokenLinksLoading ? (
                                <Spin tip="Loading broken links..." />
                            ) : brokenLinks?.length > 0 ? (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={brokenLinks}
                                    renderItem={item => (
                                        <List.Item>
                                            <List.Item.Meta
                                                title={
                                                    <Tooltip title={item.url}>
                                                        <Paragraph
                                                            ellipsis={{ tooltip: false }}
                                                            style={{ maxWidth: "100%", marginBottom: 0 }}
                                                            copyable={{ text: item.url }}
                                                        >
                                                            {item.url}
                                                        </Paragraph>
                                                    </Tooltip>
                                                }
                                                description={<Tag color="error">Status {item.status_code}</Tag>}
                                            />
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Paragraph>No broken links found.</Paragraph>
                            )}
                        </Card>
                    </Space>
                </Card>
            </Col>
        </Row>
    );
};

export default Details;
