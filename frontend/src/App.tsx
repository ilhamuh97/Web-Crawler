import React from 'react';
import { Layout, Menu, Grid, Dropdown, Button } from 'antd';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  KeyOutlined,
  LinkOutlined,
  MenuOutlined,
} from '@ant-design/icons';

import URLManager from './pages/URLManager';
import APIKeyPage from './pages/APIKey';
import Dashboard from './pages/Dashboard'

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

const App: React.FC = () => {
  const screens = useBreakpoint();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <LinkOutlined />,
      label: <Link to="/">URL Management</Link>,
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Results Dashboard</Link>,
    },
    {
      key: '/apikey',
      icon: <KeyOutlined />,
      label: <Link to="/apikey">API Key</Link>,
    },
  ];

  const mobileMenu = (
    <Menu selectedKeys={[location.pathname]} items={menuItems} />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {screens.md ? (
        <Sider breakpoint="md" collapsedWidth="0">
          <div style={{ height: 64, margin: 16, color: 'white', fontWeight: 'bold', fontSize: 20 }}>
            WebCrawler
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
          />
        </Sider>
      ) : (
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#001529',
            padding: '0 24px',
          }}
        >
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>WebCrawler</div>
          <Dropdown overlay={mobileMenu} trigger={['click']}>
            <Button icon={<MenuOutlined />} type="text" style={{ color: 'white' }} />
          </Dropdown>
        </Header>
      )}
      <Layout>
        {!screens.md && (
          <Header style={{ height: 0, padding: 0, background: 'transparent' }} />
        )}
        <Content
          style={{
            background: '#fff',
            borderRadius: 8,
            maxWidth: '1440px',
            margin: 'auto',
            padding: '16px 0',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Routes>
            <Route path="/" element={<URLManager />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/details/:id" element={<URLManager />} />
            <Route path="/apikey" element={<APIKeyPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
