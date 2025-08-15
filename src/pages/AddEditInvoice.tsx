import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Button, 
  Typography, 
  Row, 
  Col,
  Space,
  message
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, MailOutlined } from '@ant-design/icons';
import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Invoice } from '../types';
import dayjs from 'dayjs';
import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG } from '../config/email';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function AddEditInvoice() {
  const { user } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchInvoice(id);
    }
  }, [id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setLoading(true);
      const docRef = doc(db, 'invoices', invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const invoiceData = docSnap.data() as Invoice;
        form.setFieldsValue({
          ...invoiceData,
          dueDate: dayjs(invoiceData.dueDate)
        });
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

  const sendInvoiceEmail = async (invoiceId: string, email: string, clientName: string, amount: number) => {
    try {
      console.log('🔄 Starting email send process...');
      
      if (!EMAIL_CONFIG.PUBLIC_KEY || EMAIL_CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
        throw new Error('EmailJS not configured. Please update EMAIL_CONFIG in /src/config/email.ts');
      }

      if (!email || email.trim() === '') {
        throw new Error('Email address is required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email address format');
      }

      console.log('Initializing EmailJS...');
      emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
      
      const templateParams = {
        to_email: email.trim(),
        to_name: clientName,
        customer_name: clientName,
        invoice_id: invoiceId,
        total_amount: amount.toFixed(2),
        invoice_url: `${window.location.origin}/print/${invoiceId}`,
        items: 'Please check the attached invoice for details'
      };

      console.log('📤 Sending email...');
      const result = await emailjs.send(
        EMAIL_CONFIG.SERVICE_ID,
        EMAIL_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAIL_CONFIG.PUBLIC_KEY
      );

      console.log('✅ Email sent successfully:', result);
      return Promise.resolve(result);
    } catch (error: any) {
      console.error('Email error:', error);
      throw error;
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      const invoiceData: Omit<Invoice, 'id'> = {
        client: values.client,
        email: values.email || '',
        amount: values.amount,
        description: values.description,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        status: values.status || 'Pending',
        createdAt: isEdit ? undefined : new Date(),
        userId: user?.uid
      };

      let invoiceId: string;

      if (isEdit && id) {
        await updateDoc(doc(db, 'invoices', id), invoiceData);
        messageApi.success('Invoice updated successfully');
        invoiceId = id;
      } else {
        const docRef = await addDoc(collection(db, 'invoices'), {
          ...invoiceData,
          createdAt: new Date()
        });
        messageApi.success('Invoice created successfully');
        invoiceId = docRef.id;
      }

      if (values.email && values.email.trim()) {
        try {
          messageApi.loading('Sending email...', 0);
          await sendInvoiceEmail(invoiceId, values.email, values.client, values.amount);
          messageApi.destroy();
          messageApi.success('📧 Invoice emailed successfully!');

          setTimeout(() => {
            navigate('/')
          }, 1000);
        } catch (error) {
          console.error('Email error:', error);
          messageApi.destroy();
          messageApi.error('Failed to send email');
        }
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      messageApi.error('Error saving invoice');
    } finally {
      setLoading(false);
    }
  };

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
                Back
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                {isEdit ? 'Edit Invoice' : 'Add New Invoice'}
              </Title>
            </Space>
          </Col>
        </Row>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: 'Pending',
            dueDate: dayjs().add(30, 'days')
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Client Name"
                name="client"
                rules={[{ required: true, message: 'Please enter client name' }]}
              >
                <Input placeholder="Enter client name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Client Email (Recommended for auto-send)"
                name="email"
                rules={[{ type: 'email', message: 'Please enter valid email' }]}
              >
                <Input 
                  placeholder="Enter client email to auto-send invoice" 
                  size="large"
                  prefix={<MailOutlined style={{ color: '#8c8c8c' }} />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Amount (₹)"
                name="amount"
                rules={[
                  { required: true, message: 'Please enter amount' },
                  { type: 'number', min: 0, message: 'Amount must be positive' }
                ]}
              >
                <InputNumber
                  placeholder="Enter amount"
                  style={{ width: '100%' }}
                  size="large"
                  formatter={(value) => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/₹\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Due Date"
                name="dueDate"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size="large"
                  format="DD/MM/YYYY"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status" size="large">
                  <Option value="Pending">Pending</Option>
                  <Option value="Paid">Paid</Option>
                  <Option value="Overdue">Overdue</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter invoice description or details"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                {isEdit ? 'Update Invoice' : 'Create Invoice'}
              </Button>
              <Button 
                size="large"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
    </>
  );
}
