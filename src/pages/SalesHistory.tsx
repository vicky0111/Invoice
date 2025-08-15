import { useEffect, useState } from 'react';
import { Card, Table, Typography, Row, Col, DatePicker, Input, Button, Tag, Space, Statistic } from 'antd';
import { SearchOutlined, CalendarOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Sale } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function SalesHistory() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'sales'), 
        where('userId', '==', user.uid)
      ),
      (snapshot) => {
        const salesData = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        } as Sale));
        
        // Sort on the client side to avoid index requirements
        salesData.sort((a, b) => {
          const aTime = new Date(a.timestamp);
          const bTime = new Date(b.timestamp);
          return bTime.getTime() - aTime.getTime();
        });
        
        setSales(salesData);
        setFilteredSales(salesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching sales:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let filtered = sales;

    if (searchText) {
      filtered = filtered.filter(sale =>
        sale.items.some(item => 
          item.productName.toLowerCase().includes(searchText.toLowerCase())
        ) ||
        sale.paymentMethod.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(sale => {
        const saleDate = dayjs(sale.timestamp);
        return saleDate.isAfter(startDate.startOf('day')) && 
               saleDate.isBefore(endDate.endOf('day'));
      });
    }

    setFilteredSales(filtered);
  }, [sales, searchText, dateRange]);

  const clearFilters = () => {
    setSearchText('');
    setDateRange(null);
    setFilteredSales(sales);
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash': return 'green';
      case 'card': return 'blue';
      case 'upi': return 'orange';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Sale ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => id?.slice(-8),
      width: 100,
    },
    {
      title: 'Customer',
      dataIndex: 'cashier',
      key: 'cashier',
      render: (cashier: string) => cashier || 'Walk-in Customer',
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => (
        <div>
          {items.map((item, index) => (
            <div key={index} style={{ fontSize: '12px' }}>
              {item.productName} x {item.quantity}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      render: (amount: number) => `₹${amount.toLocaleString('en-IN')}`,
      sorter: (a: Sale, b: Sale) => a.total - b.total,
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => (
        <Tag color={getPaymentMethodColor(method)}>
          {method.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date & Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: Date) => (
        <div>
          <div>{dayjs(timestamp).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {dayjs(timestamp).format('HH:mm:ss')}
          </div>
        </div>
      ),
      sorter: (a: Sale, b: Sale) => 
        dayjs(a.timestamp).valueOf() - dayjs(b.timestamp).valueOf(),
    },
  ];

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalSales = filteredSales.length;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return (
    <div style={{ padding: 24, overflow: 'auto', height: 'calc(100vh - 64px)' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Sales History
          </Title>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Sales"
              value={totalSales}
              valueStyle={{ color: '#6366f1' }}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Order Value"
              value={averageOrderValue}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by product or payment method..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              placeholder={['Start Date', 'End Date']}
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
              suffixIcon={<CalendarOutlined />}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Space>
              <Button onClick={clearFilters}>
                Clear Filters
              </Button>
              <span style={{ color: '#64748b' }}>
                Showing {filteredSales.length} of {sales.length} sales
              </span>
            </Space>
          </Col>
        </Row>
      </Card>


      <Card>
        <Table
          columns={columns}
          dataSource={filteredSales}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} sales`,
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
