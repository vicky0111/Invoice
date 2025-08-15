import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Button, Row, Col, Spin, Space, Divider, Table } from 'antd';
import { PrinterOutlined, ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Invoice } from '../types';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PrintInvoice() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchInvoice(id);
    }
  }, [id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      const docRef = doc(db, 'invoices', invoiceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setInvoice({ id: docSnap.id, ...docSnap.data() } as Invoice);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
  
    doc.setFillColor(24, 144, 255);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #${invoice.id}`, pageWidth / 2, 35, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 65);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.client, 20, 77);
    if (invoice.email) {
      doc.text(invoice.email, 20, 87);
    }
    
    const rightX = pageWidth - 20;
    doc.setFont('helvetica', 'bold');
    
    const invoiceDate = invoice.createdAt?.toDate ? 
      dayjs(invoice.createdAt.toDate()).format('DD/MM/YYYY') : 
      dayjs(invoice.createdAt).format('DD/MM/YYYY');
    
    doc.text('Invoice Date:', rightX - 50, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceDate, rightX, 65, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', rightX - 50, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(dayjs(invoice.dueDate).format('DD/MM/YYYY'), rightX, 75, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', rightX - 50, 85);
    doc.setFont('helvetica', 'normal');
    if (invoice.status === 'Paid') {
      doc.setTextColor(76, 175, 80); 
    } else if (invoice.status === 'Overdue') {
      doc.setTextColor(244, 67, 54);
    } else {
      doc.setTextColor(33, 150, 243);
    }
    doc.text(invoice.status, rightX, 85, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, 100, pageWidth - 20, 100);
    
    let currentY = 115;
    
    if (invoice.items && invoice.items.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Items:', 20, currentY);
      currentY += 15;
      
      doc.setFillColor(245, 245, 245);
      doc.rect(20, currentY - 5, pageWidth - 40, 12, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('Item', 25, currentY + 3);
      doc.text('Qty', pageWidth - 120, currentY + 3, { align: 'center' });
      doc.text('Price', pageWidth - 80, currentY + 3, { align: 'center' });
      doc.text('Total', pageWidth - 25, currentY + 3, { align: 'right' });
      
      currentY += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      invoice.items.forEach((item, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(20, currentY - 3, pageWidth - 40, 10, 'F');
        }
        
        doc.setTextColor(0, 0, 0);
        doc.text(item.name.substring(0, 40), 25, currentY + 2);
        doc.text(item.quantity.toString(), pageWidth - 120, currentY + 2, { align: 'center' });
        doc.text(`₹${item.price.toLocaleString('en-IN')}`, pageWidth - 80, currentY + 2, { align: 'center' });
        doc.text(`₹${item.total.toLocaleString('en-IN')}`, pageWidth - 25, currentY + 2, { align: 'right' });
        currentY += 12;
      });
      
      currentY += 10;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Description:', 20, currentY);
      currentY += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      let descriptionText = invoice.description;
      if (invoice.description?.startsWith('POS Sale -')) {
        doc.setFont('helvetica', 'bold');
        doc.text('Point of Sale Transaction', 20, currentY);
        currentY += 10;
        doc.setFont('helvetica', 'normal');
        descriptionText = invoice.description.replace('POS Sale - ', 'Items: ');
      }
      
      const splitDescription = doc.splitTextToSize(descriptionText, pageWidth - 40);
      doc.text(splitDescription, 20, currentY);
      currentY += (splitDescription.length * 6) + 15;
    }
    
    const totalBoxY = currentY;
    const totalBoxHeight = 40;
    doc.setFillColor(248, 249, 250);
    doc.rect(pageWidth - 120, totalBoxY, 100, totalBoxHeight, 'F');
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.rect(pageWidth - 120, totalBoxY, 100, totalBoxHeight);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Subtotal:', pageWidth - 115, totalBoxY + 12);
    doc.text(`₹${invoice.amount.toLocaleString('en-IN')}`, pageWidth - 25, totalBoxY + 12, { align: 'right' });
    doc.text('Tax:', pageWidth - 115, totalBoxY + 22);
    doc.text('₹0.00', pageWidth - 25, totalBoxY + 22, { align: 'right' });
    doc.setLineWidth(0.3);
    doc.line(pageWidth - 115, totalBoxY + 26, pageWidth - 25, totalBoxY + 26);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(24, 144, 255);
    doc.text('Total:', pageWidth - 115, totalBoxY + 36);
    doc.text(`₹${invoice.amount.toLocaleString('en-IN')}`, pageWidth - 25, totalBoxY + 36, { align: 'right' });
    
    const footerY = pageHeight - 30;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
    
    doc.save(`invoice-${invoice.id}.pdf`);
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
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Card>
          <Title level={3}>Invoice not found</Title>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div className="no-print" style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/')}
            >
              Back
            </Button>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<PrinterOutlined />}
                onClick={handlePrint}
              >
                Print
              </Button>
              <Button 
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
              >
                Download PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={1} style={{ color: '#1890ff', marginBottom: 8 }}>
            INVOICE
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Invoice #{invoice.id}
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <div>
              <Title level={4}>Bill To:</Title>
              <Text strong style={{ fontSize: 16 }}>{invoice.client}</Text>
              {invoice.email && (
                <div>
                  <Text>{invoice.email}</Text>
                </div>
              )}
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Invoice Date: </Text>
                <Text>
                  {invoice.createdAt?.toDate ? 
                    dayjs(invoice.createdAt.toDate()).format('DD/MM/YYYY') : 
                    dayjs(invoice.createdAt).format('DD/MM/YYYY')
                  }
                </Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Due Date: </Text>
                <Text>{dayjs(invoice.dueDate).format('DD/MM/YYYY')}</Text>
              </div>
              <div>
                <Text strong>Status: </Text>
                <Text style={{ 
                  color: invoice.status === 'Paid' ? '#52c41a' : 
                        invoice.status === 'Overdue' ? '#ff4d4f' : '#1890ff'
                }}>
                  {invoice.status}
                </Text>
              </div>
            </div>
          </Col>
        </Row>

        <Divider />

        {invoice.items && invoice.items.length > 0 && (
          <>
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>Items:</Title>
              <Table
                dataSource={invoice.items}
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Item',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 100,
                    align: 'center',
                  },
                  {
                    title: 'Price',
                    dataIndex: 'price',
                    key: 'price',
                    width: 120,
                    align: 'right',
                    render: (price: number) => `₹${price.toLocaleString('en-IN')}`,
                  },
                  {
                    title: 'Total',
                    dataIndex: 'total',
                    key: 'total',
                    width: 120,
                    align: 'right',
                    render: (total: number) => `₹${total.toLocaleString('en-IN')}`,
                  },
                ]}
              />
            </div>
            <Divider />
          </>
        )}

        {(!invoice.items || invoice.items.length === 0) && (
          <>
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>Description:</Title>
              {invoice.description?.startsWith('POS Sale -') ? (
                <div>
                  <Text strong>Point of Sale Transaction</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>{invoice.description.replace('POS Sale - ', 'Items: ')}</Text>
                  </div>
                </div>
              ) : (
                <Text>{invoice.description}</Text>
              )}
            </div>
            <Divider />
          </>
        )}

        <Row justify="end">
          <Col xs={24} md={8}>
            <div style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 8,
              textAlign: 'right'
            }}>
              <div style={{ marginBottom: 8 }}>
                <Text>Subtotal: ₹{invoice.amount.toLocaleString('en-IN')}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text>Tax: ₹0.00</Text>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div>
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                  Total: ₹{invoice.amount.toLocaleString('en-IN')}
                </Title>
              </div>
            </div>
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: 32, color: '#666' }}>
          <Text type="secondary">
            Thank you for your business!
          </Text>
        </div>
      </Card>
    </div>
  );
}
