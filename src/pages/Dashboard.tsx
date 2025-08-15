import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Button, Tag, Space, Typography, Row, Col, message, Spin } from 'antd';
import { PlusOutlined, EyeOutlined, PrinterOutlined, CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Invoice, InvoiceStatus } from '../types';

const { Title } = Typography;

export default function Dashboard() {
  const [messageApi, contextHolder] = message.useMessage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<'All' | InvoiceStatus>('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const invoiceData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(invoiceData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching invoices:', error);
      setLoading(false);
    });
    
    return () => {
      unsub();
    };
  }, []);

  const markAsPaid = async (id?: string) => {
    if (!id) return;
    await updateDoc(doc(db, 'invoices', id), { status: 'Paid' });
    messageApi.success('Invoice marked as Paid');
  };

  const filteredInvoices = filter === 'All' ? invoices : invoices.filter(inv => inv.status === filter);

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid': return 'green';
      case 'Pending': return 'orange';
      case 'Overdue': return 'red';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => id?.slice(-5),
    },
    {
      title: 'Client',
      dataIndex: 'client',
      key: 'client',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `₹${amount?.toLocaleString('en-IN')}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: InvoiceStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Invoice) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => navigate(`/invoice/${record.id}`)}
          >
            View
          </Button>
          {record.status !== 'Paid' && (
            <Button 
              type="link" 
              icon={<CheckOutlined />}
              onClick={() => markAsPaid(record.id)}
            >
              Mark Paid
            </Button>
          )}
          <Button 
            type="link" 
            icon={<PrinterOutlined />}
            onClick={() => navigate(`/print/${record.id}`)}
          >
            Print
          </Button>
        </Space>
      ),
    },
  ];

  const filterButtons = [
    { key: 'All', label: 'All' },
    { key: 'Paid', label: 'Paid' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Overdue', label: 'Overdue' },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: 24, overflow: 'auto', height: 'calc(100vh - 64px)' }}>
        <Spin 
          spinning={loading} 
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
          tip="Loading invoices..."
        >
          <Card style={{ minHeight: loading ? '400px' : 'auto' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  Invoice Dashboard
                </Title>
              </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/add')}
              >
                Add Invoice
              </Button>
            </Col>
          </Row>

          <Space wrap style={{ marginBottom: 16 }}>
            {filterButtons.map((btn) => (
              <Button
                key={btn.key}
                type={filter === btn.key ? 'primary' : 'default'}
                onClick={() => setFilter(btn.key as 'All' | InvoiceStatus)}
              >
                {btn.label}
              </Button>
            ))}
          </Space>

          <Table
            columns={columns}
            dataSource={filteredInvoices}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        </Card>
        </Spin>
      </div>
    </>
  );
}
