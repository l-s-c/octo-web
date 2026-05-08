import React, { useEffect, useState } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import './ClawInfoModal.css';

export interface ClawInfoModalProps {
  visible: boolean;
  onClose: () => void;
  clawData?: {
    agentName: string;
    gatewayName: string;
    clawId: string;
    status: 'running' | 'idle' | 'closed';
  };
}

type TabType = 'overview' | 'session' | 'files';

const ClawInfoModal: React.FC<ClawInfoModalProps> = ({
  visible,
  onClose,
  clawData
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [visible, onClose]);

  if (!clawData) {
    return null;
  }

  const statusConfig = {
    running: { dot: '#22c55e', text: '运行中', color: '#16a34a' },
    idle: { dot: '#f59e0b', text: '空闲', color: '#d97706' },
    closed: { dot: '#94a3b8', text: '已关闭', color: '#64748b' }
  };

  const currentStatus = statusConfig[clawData.status];

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      maskClosable={true}
      width={960}
      height={720}
      className="claw-info-modal"
      bodyStyle={{ padding: 0, height: '100%' }}
    >
      <div className="claw-detail">
        {/* 关闭按钮 */}
        <button className="close-btn" onClick={onClose} data-testid="close-btn">
          ✕
        </button>

        {/* Header */}
        <div className="detail-header">
          <div className="detail-title-row">
            <div className="detail-info">
              <h1 data-testid="agent-name">{clawData.agentName}</h1>
              <div className="detail-meta">
                <span>所属 Gateway: {clawData.gatewayName}</span>
                <span className="sep">·</span>
                <span>ID: {clawData.clawId}</span>
                <span className="sep">·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span
                    className="dot"
                    style={{ background: currentStatus.dot }}
                    data-testid="status-dot"
                  />
                  <span style={{ color: currentStatus.color }} data-testid="status-text">
                    {currentStatus.text}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="detail-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            data-testid="tab-overview"
          >
            概览
          </button>
          <button
            className={`tab-btn ${activeTab === 'session' ? 'active' : ''}`}
            onClick={() => setActiveTab('session')}
            data-testid="tab-session"
          >
            Session 信息
          </button>
          <button
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
            data-testid="tab-files"
          >
            核心文件
          </button>
        </div>

        {/* Tab 内容区 */}
        <div className="tab-content-wrapper">
          <div
            className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}
            data-testid="content-overview"
          >
            <p style={{ padding: 32, color: '#666' }}>概览内容区域（待实现）</p>
          </div>
          <div
            className={`tab-content ${activeTab === 'session' ? 'active' : ''}`}
            data-testid="content-session"
          >
            <p style={{ padding: 32, color: '#666' }}>Session 信息区域（待实现）</p>
          </div>
          <div
            className={`tab-content ${activeTab === 'files' ? 'active' : ''}`}
            data-testid="content-files"
          >
            <p style={{ padding: 32, color: '#666' }}>核心文件区域（待实现）</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ClawInfoModal;
