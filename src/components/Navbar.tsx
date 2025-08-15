import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Dropdown, Space } from 'antd';
import { 
  DashboardOutlined, 
  ShopOutlined, 
  ProductOutlined, 
  BarChartOutlined, 
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const { Header } = Layout;
const { Title } = Typography;

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '/pos',
      icon: <ShopOutlined />,
      label: <Link to="/pos">POS</Link>,
    },
    {
      key: '/products',
      icon: <ProductOutlined />,
      label: <Link to="/products">Products</Link>,
    },
    {
      key: '/sales',
      icon: <FileTextOutlined />,
      label: <Link to="/sales">Sales</Link>,
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: <Link to="/analytics">Analytics</Link>,
    },
  ];

  return (
    <Header style={{ 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      justifyContent: 'space-between'
    }}>
      <Space>
        <Title level={4} style={{ 
          margin: 0, 
          marginRight: 32, 
          color: '#6366f1',
          fontWeight: 700 
        }}>
          POS System
        </Title>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#1e293b'
          }}
          theme="light"
        />
      </Space>
      
      <Dropdown 
        menu={{ items: userMenuItems }} 
        placement="bottomRight"
        trigger={['click']}
      >
        <Button 
          type="text" 
          icon={<UserOutlined />}
          style={{ color: '#475569' }}
        >
          {user?.email?.split('@')[0] || 'User'}
        </Button>
      </Dropdown>
    </Header>
  );
}