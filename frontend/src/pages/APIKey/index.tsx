import React, { useState } from 'react';
import { Button, Input, Typography, Card, Space, message, Row, Col } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useApi } from '../../hooks/useApi';

const { Title, Text, Paragraph } = Typography;

const index: React.FC = () => {
    const [apiKey, setApiKey] = useState(localStorage.getItem('api_key') || '');
    const { getApiKey } = useApi();

    const handleGenerate = async () => {
        const key = await getApiKey();
        setApiKey(key!);

        message.success('API Key generated and saved!');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(apiKey || '');
        message.success('API Key copied to clipboard!');
    };

    return (
        <Row justify="center" >
            <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <Card
                    styles={{ body: { padding: '16px' } }}
                    variant='borderless'
                    title={<Title level={4}>API Keys</Title>}
                >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Paragraph type="secondary">
                            Manage your secret API keys here. Keep them safe and regenerate as needed.
                        </Paragraph>

                        <Text strong>Your API Key</Text>
                        <Input
                            value={apiKey}
                            readOnly
                            placeholder="No API Key generated yet"
                            suffix={
                                <Button
                                    icon={<CopyOutlined />}
                                    onClick={handleCopy}
                                    disabled={!apiKey}
                                    size="small"
                                    type="text"
                                >
                                    Copy
                                </Button>
                            }
                        />

                        <Button
                            type="primary"
                            onClick={handleGenerate}
                            className="responsive-button"
                        >
                            Generate New API Key
                        </Button>
                    </Space>
                </Card>
            </Col>
        </Row>
    );
};

export default index;
