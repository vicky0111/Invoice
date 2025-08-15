import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout, App as AntApp, message } from 'antd';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';
import Dashboard from './pages/Dashboard';
import AddEditInvoice from './pages/AddEditInvoice';
import InvoiceDetails from './pages/InvoiceDetails';
import PrintInvoice from './pages/PrintInvoice';
import Analytics from './pages/Analytics';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Products from './pages/Products';
import POS from './pages/POS';
import SalesHistory from './pages/SalesHistory';
import RequireAuth from './components/RequireAuth';

function App() {
  message.config({
    top: 100,
    duration: 3,
    maxCount: 3,
  });

  return (
    <AuthProvider>
      <ConfigProvider theme={theme}>
        <AntApp>
          <Layout style={{ 
            minHeight: '100vh', 
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            margin: 0,
            padding: 0,
          }}>
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/add" element={<RequireAuth><AddEditInvoice /></RequireAuth>} />
              <Route path="/invoice/:id" element={<RequireAuth><InvoiceDetails /></RequireAuth>} />
              <Route path="/print/:id" element={<RequireAuth><PrintInvoice /></RequireAuth>} />
              <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
              <Route path="/edit/:id" element={<RequireAuth><AddEditInvoice /></RequireAuth>} />
              <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
              <Route path="/pos" element={<RequireAuth><POS /></RequireAuth>} />
              <Route path="/sales" element={<RequireAuth><SalesHistory /></RequireAuth>} />
            </Routes>
          </Layout>
        </AntApp>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
