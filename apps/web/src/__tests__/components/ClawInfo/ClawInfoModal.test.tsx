import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClawInfoModal } from '@octo/contacts';

describe('ClawInfoModal', () => {
  const mockClawData = {
    agentName: '皮皮虾',
    gatewayName: 'Gateway-1',
    clawId: 'claw-a8f3d2e1',
    status: 'running' as const
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('弹窗显示时渲染正确内容', () => {
    render(
      <ClawInfoModal
        visible={true}
        onClose={mockOnClose}
        clawData={mockClawData}
      />
    );

    // 验证 Agent 名称
    expect(screen.getByTestId('agent-name')).toHaveTextContent('皮皮虾');

    // 验证运行状态
    expect(screen.getByTestId('status-text')).toHaveTextContent('运行中');
    expect(screen.getByTestId('status-dot')).toHaveStyle({ background: '#22c55e' });

    // 验证三个 Tab
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-session')).toBeInTheDocument();
    expect(screen.getByTestId('tab-files')).toBeInTheDocument();

    // 默认激活概览 Tab
    expect(screen.getByTestId('tab-overview')).toHaveClass('active');
  });

  test('点击关闭按钮调用 onClose', () => {
    render(
      <ClawInfoModal
        visible={true}
        onClose={mockOnClose}
        clawData={mockClawData}
      />
    );

    const closeBtn = screen.getByTestId('close-btn');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('按 ESC 键关闭弹窗', async () => {
    render(
      <ClawInfoModal
        visible={true}
        onClose={mockOnClose}
        clawData={mockClawData}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  test('Tab 切换正常工作', () => {
    render(
      <ClawInfoModal
        visible={true}
        onClose={mockOnClose}
        clawData={mockClawData}
      />
    );

    // 初始状态：概览 Tab 激活
    expect(screen.getByTestId('tab-overview')).toHaveClass('active');
    expect(screen.getByTestId('content-overview')).toHaveClass('active');

    // 点击 Session Tab
    fireEvent.click(screen.getByTestId('tab-session'));
    expect(screen.getByTestId('tab-session')).toHaveClass('active');
    expect(screen.getByTestId('content-session')).toHaveClass('active');
    expect(screen.getByTestId('content-overview')).not.toHaveClass('active');

    // 点击核心文件 Tab
    fireEvent.click(screen.getByTestId('tab-files'));
    expect(screen.getByTestId('tab-files')).toHaveClass('active');
    expect(screen.getByTestId('content-files')).toHaveClass('active');
    expect(screen.getByTestId('content-session')).not.toHaveClass('active');
  });

  test('不同运行状态显示不同样式', () => {
    const { rerender } = render(
      <ClawInfoModal
        visible={true}
        onClose={mockOnClose}
        clawData={{ ...mockClawData, status: 'running' }}
      />
    );

    expect(screen.getByTestId('status-text')).toHaveTextContent('运行中');
    expect(screen.getByTestId('status-dot')).toHaveStyle({ background: '#22c55e' });

    // 切换为 idle 状态
    rerender(
      <ClawInfoModal
        visible={true}
        onClose={mockOnClose}
        clawData={{ ...mockClawData, status: 'idle' }}
      />
    );

    expect(screen.getByTestId('status-text')).toHaveTextContent('空闲');
    expect(screen.getByTestId('status-dot')).toHaveStyle({ background: '#f59e0b' });

    // 切换为 closed 状态
    rerender(
      <ClawInfoModal
        visible={true}
        onClose={mockOnClose}
        clawData={{ ...mockClawData, status: 'closed' }}
      />
    );

    expect(screen.getByTestId('status-text')).toHaveTextContent('已关闭');
    expect(screen.getByTestId('status-dot')).toHaveStyle({ background: '#94a3b8' });
  });

  test('clawData 为空时不渲染', () => {
    const { container } = render(
      <ClawInfoModal
        visible={true}
        onClose={mockOnClose}
        clawData={undefined}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('visible=false 时通过 Semi Modal 控制隐藏', () => {
    render(
      <ClawInfoModal
        visible={false}
        onClose={mockOnClose}
        clawData={mockClawData}
      />
    );

    // Semi UI Modal 在 visible=false 时不渲染内容
    expect(screen.queryByTestId('agent-name')).not.toBeInTheDocument();
  });
});
