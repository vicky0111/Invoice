import { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Statistic, Progress } from 'antd';
import { 
  ShoppingCartOutlined, 
  UserOutlined
} from '@ant-design/icons';
import { collection, onSnapshot, query, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Sale, Product, Invoice } from '../types';

const { Title } = Typography;

export default function Analytics() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubSales = onSnapshot(
      query(
        collection(db, 'sales'), 
        where('userId', '==', user.uid),
        limit(100)
      ),
      (snapshot) => {
        const salesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Sale));
        // Sort on the client side to avoid index requirements
        salesData.sort((a, b) => {
          const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return bTime.getTime() - aTime.getTime();
        });
        setSales(salesData);
      }
    );

    const unsubProducts = onSnapshot(
      query(collection(db, 'products'), where('userId', '==', user.uid)), 
      (snapshot) => {
        setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product)));
      }
    );

    const unsubInvoices = onSnapshot(
      query(collection(db, 'invoices'), where('userId', '==', user.uid)), 
      (snapshot) => {
        setInvoices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invoice)));
      }
    );

    return () => {
      unsubSales();
      unsubProducts();
      unsubInvoices();
    };
  }, [user]);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalSales = sales.length;
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending').length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue').length;

  const lowStockProducts = products.filter(product => 
    product.stock <= product.lowStockThreshold
  );

  const paymentMethods = sales.reduce((acc, sale) => {
    acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ padding: 24, overflow: 'auto', height: 'calc(100vh - 64px)' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        Analytics Dashboard
      </Title>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Sales Revenue"
              value={totalRevenue}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoice Amount"
              value={totalInvoiceAmount}
              prefix="₹"
              precision={2}
              valueStyle={{ color: '#6366f1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Sales"
              value={totalSales}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={totalInvoices}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Invoice Status">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Paid"
                  value={paidInvoices}
                  valueStyle={{ color: '#10b981' }}
                />
                <Progress 
                  percent={totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0} 
                  strokeColor="#10b981"
                  showInfo={false}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Pending"
                  value={pendingInvoices}
                  valueStyle={{ color: '#f59e0b' }}
                />
                <Progress 
                  percent={totalInvoices > 0 ? (pendingInvoices / totalInvoices) * 100 : 0} 
                  strokeColor="#f59e0b"
                  showInfo={false}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Overdue"
                  value={overdueInvoices}
                  valueStyle={{ color: '#ef4444' }}
                />
                <Progress 
                  percent={totalInvoices > 0 ? (overdueInvoices / totalInvoices) * 100 : 0} 
                  strokeColor="#ef4444"
                  showInfo={false}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Payment Methods">
            {Object.entries(paymentMethods).map(([method, count]) => (
              <div key={method} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ textTransform: 'capitalize' }}>{method}</span>
                  <span style={{ color: '#64748b' }}>{count} sales</span>
                </div>
                <Progress 
                  percent={totalSales > 0 ? (count / totalSales) * 100 : 0} 
                  strokeColor="#6366f1"
                  showInfo={false}
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {lowStockProducts.length > 0 && (
        <Card 
          title={`⚠️ Low Stock Alert (${lowStockProducts.length} items)`}
          style={{ borderColor: '#ef4444' }}
        >
          <Row gutter={[16, 16]}>
            {lowStockProducts.map((product) => (
              <Col xs={24} sm={12} lg={8} key={product.id}>
                <Card 
                  size="small"
                  style={{ borderColor: '#ef4444' }}
                >
                  <div>
                    <strong>{product.name}</strong>
                  </div>
                  <div style={{ color: '#ef4444' }}>
                    Stock: {product.stock} / Threshold: {product.lowStockThreshold}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>
                    Category: {product.category}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );
}
