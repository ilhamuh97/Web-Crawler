import React from 'react';
import { Card, Space, Row, Col, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const index: React.FC = () => {

    return (
        <Row justify="center">
            <Col xs={24} sm={24} md={24} lg={24}>
                <Card
                    styles={{ body: { padding: '16px' } }}
                    variant='borderless'
                    title={<Title level={4}>Dashboard</Title>}
                >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Paragraph type="secondary">
                            This is Dashboard
                        </Paragraph>
                    </Space>
                </Card>
            </Col>
        </Row>
    );
};

export default index;
