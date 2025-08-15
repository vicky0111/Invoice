import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Input, Select, Space, Typography, InputNumber, message, Spin } from 'antd';
import { PlusOutlined, MinusOutlined, ShoppingCartOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product, CartItem, Sale } from '../types';
import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG } from '../config/email';

const { Title, Text } = Typography;
const { Option } = Select;

const categories = ['All', 'General', 'Beverages', 'Snacks', 'Electronics', 'Clothing', 'Other'];

export default function POS() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [category, setCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'digital'>('cash');

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Product));
      setProducts(prods);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addToCart = (product: Product) => {
    if (!product.id) return;
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      messageApi.error('Cart is empty');
      return;
    }

    try {
      messageApi.loading('Processing sale...', 0);

      const sale: Omit<Sale, 'id'> = {
        items: cart.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: getTotalAmount(),
        paymentMethod,
        timestamp: new Date(),
        cashier: customer || 'Anonymous'
      };

      const saleRef = await addDoc(collection(db, 'sales'), sale);

      const invoiceData = {
        client: customer || 'Walk-in Customer',
        email: customerEmail || '',
        amount: getTotalAmount(),
        description: `POS Sale - ${cart.map(item => `${item.name} (${item.quantity})`).join(', ')}`,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Paid' as const,
        createdAt: new Date(),
        saleId: saleRef.id
      };

      const invoiceRef = await addDoc(collection(db, 'invoices'), invoiceData);

      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product && product.id) {
          await updateDoc(doc(db, 'products', product.id), {
            stock: product.stock - item.quantity
          });
        }
      }
      messageApi.destroy();

      if (customerEmail && customer) {
        try {
          await sendInvoiceEmail(invoiceRef.id, customerEmail, cart, customer);
          messageApi.success('Invoice emailed successfully!');
        } catch (error) {
          console.error('Email error:', error);
          messageApi.error('Failed to send email');
        }
      }

      messageApi.success('Sale completed successfully!', 3);

      setCart([]);
      setCustomer('');
      setCustomerEmail('');
      
    } catch (error) {
      messageApi.destroy();
      console.error('Error processing sale:', error);
      messageApi.error('Error processing sale. Please try again.');
    }
  };

  const sendInvoiceEmail = async (invoiceId: string, email: string, cartItems?: CartItem[], customerName?: string) => {
    try {
      console.log('🔄 Starting email send process...');
      console.log('📧 Email config:', EMAIL_CONFIG);
      console.log('📨 Recipient email:', email);
      
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

      console.log('🔧 Initializing EmailJS...');
      emailjs.init(EMAIL_CONFIG.PUBLIC_KEY);
      
      const templateParams = {
        to_email: email.trim(),
        to_name: customerName || customer || 'Valued Customer',
        customer_name: customerName || customer || 'Valued Customer',
        invoice_id: invoiceId,
        total_amount: getTotalAmount().toFixed(2),
        invoice_url: `${window.location.origin}/print/${invoiceId}`,
        items: (cartItems || cart).map(item => 
          `${item.name} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`
        ).join('\n')
      };

      console.log('Template parameters:', templateParams);
      console.log('Sending email...');

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
      
      if (error?.text) {
        console.error('Error details:', error.text);
      }
      if (error?.status) {
        console.error('HTTP Status:', error.status);
      }
      
      throw error;
    }
  };

  const filteredProducts = category === 'All' 
    ? products 
    : products.filter(product => product.category === category);

  const cartColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `₹${price.toLocaleString('en-IN')}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: CartItem) => (
        <Space>
          <Button 
            size="small" 
            icon={<MinusOutlined />}
            onClick={() => updateQuantity(record.id, quantity - 1)}
          />
          <InputNumber 
            min={1} 
            value={quantity} 
            onChange={(value) => updateQuantity(record.id, value || 1)}
            style={{ width: 60 }}
          />
          <Button 
            size="small" 
            icon={<PlusOutlined />}
            onClick={() => updateQuantity(record.id, quantity + 1)}
          />
        </Space>
      ),
    },
    {
      title: 'Total',
      key: 'total',
      render: (record: CartItem) => `₹${(record.price * record.quantity).toLocaleString('en-IN')}`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: CartItem) => (
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.id)}
        />
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: 24, overflow: 'auto', height: 'calc(100vh - 64px)' }}>
        <Row gutter={24}>
          <Col span={16}>
            <Card>
              <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
                <Title level={3} style={{ margin: 0 }}>Products</Title>
                <Select 
                  value={category} 
                  onChange={setCategory}
                  style={{ width: 150 }}
                >
                  {categories.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Space>
              
              <Spin 
                spinning={loading} 
                indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                tip="Loading products..."
              >
                <Row gutter={[16, 16]} style={{ minHeight: loading ? '200px' : 'auto' }}>
                  {filteredProducts.map((product) => (
                    <Col span={8} key={product.id}>
                      <Card 
                        size="small"
                        title={product.name}
                        extra={<span style={{ color: '#10b981', fontWeight: 'bold' }}>₹{product.price.toLocaleString('en-IN')}</span>}
                        actions={[
                          <Button 
                            type="primary" 
                            icon={<PlusOutlined />}
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                          >
                            Add to Cart
                          </Button>
                        ]}
                      >
                        <Text type="secondary">Stock: {product.stock}</Text>
                        <br />
                        <Text type="secondary">Category: {product.category}</Text>
                      </Card>
                    </Col>
                  ))}
                  {!loading && filteredProducts.length === 0 && (
                    <Col span={24}>
                      <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                        <ShoppingCartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                        <div>No products found in this category</div>
                      </div>
                    </Col>
                  )}
                </Row>
              </Spin>
            </Card>
          </Col>

          <Col span={8}>
            <Card 
              title={<><ShoppingCartOutlined /> Cart</>}
              style={{ marginBottom: 16 }}
            >
              <Table
                columns={cartColumns}
                dataSource={cart}
                rowKey="id"
                pagination={false}
                size="small"
                locale={{
                  emptyText: (
                    <div style={{ padding: '20px', color: '#8c8c8c' }}>
                      <ShoppingCartOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                      <div>Your cart is empty</div>
                    </div>
                  )
                }}
              />
              
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Title level={4}>
                  Total: ₹{getTotalAmount().toLocaleString('en-IN')}
                </Title>
              </div>
            </Card>

            <Card title="Payment">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder="Customer Name (Optional)"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                />
                
                <Input
                  placeholder="Customer Email (Optional)"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
                
                <Select 
                  value={paymentMethod} 
                  onChange={setPaymentMethod}
                  style={{ width: '100%' }}
                >
                  <Option value="cash">Cash</Option>
                  <Option value="card">Card</Option>
                  <Option value="digital">Digital</Option>
                </Select>

                <Button 
                  type="primary" 
                  size="large"
                  block
                  onClick={processSale}
                  disabled={cart.length === 0}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    height: 48
                  }}
                >
                  Complete Sale - ₹{getTotalAmount().toLocaleString('en-IN')}
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}