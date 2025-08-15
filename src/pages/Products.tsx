import { useEffect, useState } from 'react';
import { 
  Card, 
  Typography, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Space, 
  Tag, 
  Popconfirm,
  Row,
  Col,
  Alert,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  WarningOutlined 
} from '@ant-design/icons';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../types';

const { Title } = Typography;
const { Option } = Select;

const categories = ['General', 'Beverages', 'Snacks', 'Electronics', 'Clothing', 'Other'];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsub = onSnapshot(
      collection(db, 'products'), 
      (snapshot) => {
        const prods = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        setProducts(prods);
        setLoading(false);
        clearTimeout(timeoutId);
      }, 
      (error) => {
        console.error('Error fetching products:', error);
        setLoading(false);
        clearTimeout(timeoutId);
        messageApi.error(`Failed to load products: ${error.message}`);
      }
    );
    
    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      messageApi.success('Product deleted successfully!');
    } catch (error) {
      console.error('Error deleting product:', error);
      messageApi.error('Error deleting product. Please try again.');
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitLoading(true);
    try {
      if (!values.name || !values.category || values.price === undefined || values.price === null || values.stock === undefined || values.stock === null) {
        messageApi.error('Please fill in all required fields');
        setSubmitLoading(false);
        return;
      }

      const price = Number(values.price);
      const stock = Number(values.stock);
      const lowStockThreshold = Number(values.lowStockThreshold) || 10;

      if (isNaN(price) || price < 0) {
        message.error('Please enter a valid price');
        setSubmitLoading(false);
        return;
      }

      if (isNaN(stock) || stock < 0) {
        message.error('Please enter a valid stock quantity');
        setSubmitLoading(false);
        return;
      }

      const productData: any = {
        name: values.name.trim(),
        category: values.category,
        price: price,
        stock: stock,
        lowStockThreshold: lowStockThreshold,
      };

      if (values.description && values.description.trim()) {
        productData.description = values.description.trim();
      }

      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        messageApi.success('Product updated successfully!');
      } else {
        await addDoc(collection(db, 'products'), productData);
        messageApi.success('Product added successfully!');
      }

      setModalVisible(false);
      form.resetFields();
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      messageApi.error(`Error saving product: ${errorMessage}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  const lowStockProducts = products.filter(product => {
    const validStock = product.stock != null && !isNaN(product.stock) ? product.stock : 0;
    const validThreshold = product.lowStockThreshold != null && !isNaN(product.lowStockThreshold) ? product.lowStockThreshold : 10;
    return validStock <= validThreshold;
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Product) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.description && (
            <div style={{ color: '#64748b', fontSize: '12px' }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => {
        const validPrice = price != null && !isNaN(price) ? price : 0;
        return `₹${validPrice.toFixed(2)}`;
      },
    },
    {
      title: 'Stock',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: Product) => {
        const validStock = stock != null && !isNaN(stock) ? stock : 0;
        const validThreshold = record.lowStockThreshold != null && !isNaN(record.lowStockThreshold) ? record.lowStockThreshold : 10;
        
        return (
          <div>
            <span style={{ 
              color: validStock <= validThreshold ? '#ef4444' : '#10b981',
              fontWeight: 'bold'
            }}>
              {validStock}
            </span>
            {validStock <= validThreshold && (
              <WarningOutlined style={{ color: '#ef4444', marginLeft: 8 }} />
            )}
          </div>
        );
      },
    },
    {
      title: 'Low Stock Alert',
      dataIndex: 'lowStockThreshold',
      key: 'lowStockThreshold',
      render: (threshold: number) => {
        const validThreshold = threshold != null && !isNaN(threshold) ? threshold : 10;
        return <span style={{ color: '#64748b' }}>≤ {validThreshold}</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Product) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditProduct(record)}
            style={{ color: '#6366f1' }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDeleteProduct(record.id!)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              icon={<DeleteOutlined />}
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: 24, overflow: 'auto', height: 'calc(100vh - 64px)' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ margin: 0, color: '#1e293b' }}>
              Products Management
            </Title>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              size="large"
              onClick={handleAddProduct}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
              }}
            >
              Add Product
            </Button>
          </Col>
        </Row>

        {products.length === 0 && !loading && (
          <Alert
            message="📦 No products found"
            description="No products in your inventory. Click 'Add Product' to get started."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {lowStockProducts.length > 0 && (
          <Alert
            message={`⚠️ ${lowStockProducts.length} product(s) running low on stock!`}
            description={`Products: ${lowStockProducts.map(p => p.name).join(', ')}`}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Card>
          <Table
            columns={columns}
            dataSource={products}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        </Card>

        <Modal
          title={editingProduct ? 'Edit Product' : 'Add Product'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
            setEditingProduct(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            style={{ marginTop: 24 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Product Name"
                  rules={[{ required: true, message: 'Please enter product name' }]}
                >
                  <Input placeholder="Enter product name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: true, message: 'Please select category' }]}
                >
                  <Select placeholder="Select category">
                    {categories.map(cat => (
                      <Option key={cat} value={cat}>{cat}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="price"
                  label="Price"
                  rules={[{ required: true, message: 'Please enter price' }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    precision={2}
                    style={{ width: '100%' }}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="stock"
                  label="Stock Quantity"
                  rules={[{ required: true, message: 'Please enter stock quantity' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="lowStockThreshold"
                  label="Low Stock Alert"
                  initialValue={10}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    placeholder="10"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description (Optional)"
            >
              <Input.TextArea
                rows={3}
                placeholder="Enter product description"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setEditingProduct(null);
                }}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={submitLoading}
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
}
