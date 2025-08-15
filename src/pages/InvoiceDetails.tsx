import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Tag, 
  Space, 
  Button, 
  Divider,
  Descriptions,
  Spin,
  message
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  PrinterOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Invoice, InvoiceStatus } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function InvoiceDetails() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (id) {
      fetchInvoice(id);
    }
  }, [id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const docRef = doc(db, 'invoices', invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setInvoice({ id: docSnap.id, ...docSnap.data() } as Invoice);
      } else {
        messageApi.error('Invoice not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      messageApi.error('Error fetching invoice');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async () => {
    if (!id || !invoice) return;
    
    try {
      await updateDoc(doc(db, 'invoices', id), { status: 'Paid' });
      setInvoice({ ...invoice, status: 'Paid' });
      messageApi.success('Invoice marked as Paid');
    } catch (error) {
      console.error('Error updating invoice:', error);
      messageApi.error('Error updating invoice');
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid': return 'green';
      case 'Pending': return 'orange';
      case 'Overdue': return 'red';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <Title level={3} style={{ textAlign: 'center' }}>
            Invoice not found
          </Title>
        </Card>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: 24, overflow: 'auto', height: 'calc(100vh - 64px)' }}>
        <Card>
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate('/')}
                >
                  Back to Dashboard
                </Button>
                <Title level={2} style={{ margin: 0 }}>
                  Invoice Details
                </Title>
              </Space>
            </Col>
            <Col>
              <Space>
                {invoice.status !== 'Paid' && (
                  <Button 
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={markAsPaid}
                  >
                    Mark as Paid
                  </Button>
                )}
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/edit/${invoice.id}`)}
                >
                  Edit
                </Button>
                <Button 
                  icon={<PrinterOutlined />}
                  onClick={() => navigate(`/print/${invoice.id}`)}
                >
                  Print
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} lg={16}>
              <Card title="Invoice Information" style={{ marginBottom: 24 }}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label="Invoice ID">
                    <Text code>{invoice.id}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Client Name">
                    <Text strong>{invoice.client}</Text>
                  </Descriptions.Item>
                  {invoice.email && (
                    <Descriptions.Item label="Client Email">
                      <Text>{invoice.email}</Text>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="Amount">
                    <Text strong style={{ fontSize: '18px', color: '#6366f1' }}>
                      ₹{invoice.amount?.toLocaleString('en-IN')}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(invoice.status)} style={{ fontSize: '14px' }}>
                      {invoice.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Due Date">
                    <Text>
                      {dayjs(invoice.dueDate).format('DD MMMM YYYY')}
                      {dayjs(invoice.dueDate).isBefore(dayjs()) && invoice.status !== 'Paid' && (
                        <Tag color="red" style={{ marginLeft: 8 }}>
                          Overdue
                        </Tag>
                      )}
                    </Text>
                  </Descriptions.Item>
                  {invoice.createdAt && (
                    <Descriptions.Item label="Created Date">
                      <Text>
                        {dayjs(invoice.createdAt.toDate ? invoice.createdAt.toDate() : invoice.createdAt)
                          .format('DD MMMM YYYY, HH:mm')}
                      </Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              <Card title="Description">
                <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {invoice.description}
                </Text>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title="Payment Summary" style={{ marginBottom: 24 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Subtotal:</Text>
                    <Text>₹{invoice.amount?.toLocaleString('en-IN')}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>Tax (0%):</Text>
                    <Text>₹0</Text>
                  </div>
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Total Amount:</Text>
                    <Text strong style={{ fontSize: '18px', color: '#6366f1' }}>
                      ₹{invoice.amount?.toLocaleString('en-IN')}
                    </Text>
                  </div>
                </Space>
              </Card>

              <Card title="Quick Actions">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {invoice.status !== 'Paid' && (
                    <Button 
                      type="primary"
                      block
                      icon={<CheckOutlined />}
                      onClick={markAsPaid}
                    >
                      Mark as Paid
                    </Button>
                  )}
                  <Button 
                    block
                    icon={<PrinterOutlined />}
                    onClick={() => navigate(`/print/${invoice.id}`)}
                  >
                    Print Invoice
                  </Button>
                  <Button 
                    block
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/edit/${invoice.id}`)}
                  >
                    Edit Invoice
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>
    </>
  );
}
