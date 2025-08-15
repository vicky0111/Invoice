import type { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // Color tokens
    colorPrimary: '#6366f1',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    
    // Background colors
    colorBgContainer: '#ffffff',
    colorBgElevated: '#f8fafc',
    colorBgLayout: '#f1f5f9',
    
    // Text colors
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    
    // Border
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#cbd5e1',
    
    // Typography
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: 14,
    
    // Border radius
    borderRadius: 8,
    
    // Spacing
    padding: 16,
    margin: 16,
    
    // Box shadow
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 12px rgba(99, 102, 241, 0.15)',
  },
  components: {
    Button: {
      colorPrimary: '#6366f1',
    },
    Card: {
      headerBg: '#f8fafc',
    },
    Input: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d1d5db',
      colorText: '#1e293b',
    },
    Layout: {
      colorBgHeader: '#ffffff',
      colorBgBody: '#f1f5f9',
      colorBgTrigger: '#f8fafc',
    },
    Table: {
      colorBgContainer: '#ffffff',
      headerBg: '#f8fafc',
      rowHoverBg: '#f1f5f9',
      borderColor: '#e2e8f0',
      headerColor: '#1e293b',
      colorText: '#1e293b',
      colorTextHeading: '#1e293b',
    },
    Select: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d1d5db',
      colorText: '#1e293b',
    },
    DatePicker: {
      colorBgContainer: '#ffffff',
      colorBorder: '#d1d5db',
      colorText: '#1e293b',
    },
    Modal: {
      colorBgElevated: '#ffffff',
      colorBgMask: 'rgba(0, 0, 0, 0.45)',
      headerBg: '#f8fafc',
    },
    Form: {
      labelColor: '#374151',
    },
    Typography: {
      colorText: '#1e293b',
      colorTextSecondary: '#64748b',
    },
    Statistic: {
      colorTextHeading: '#1e293b',
      titleFontSize: 14,
    },
  },
};
