# MCP 创建来源标识：技术方案与静态原型说明

## 目标与范围

本阶段只验证 octo-web 的信息架构和交互，不实现后端、数据库迁移、真实鉴权判定或管理端。原型以 `packages/dmworkmcp/src/mock/mcpMock.ts` 的静态数据运行，覆盖列表卡片、来源筛选和详情展示。

## 用户体验

- 列表卡片：名称右侧显示轻量来源徽标。人工为 `👤 + 创建者`，Bot 为 `🤖 + Bot 名称`，Git 导入为 `📥 + 导入来源`。
- 来源筛选：分类筛选右侧增加多选项（人工创建 / Bot 创建 / Git 导入）；来源内部采用 OR，与关键词、分类采用 AND。切换到隐藏筛选器的“我的”模式时清空来源和分类，避免无提示条件残留。
- 详情：头部元信息新增“创建来源”，同时展示来源类型和创建者名称。后续存在 Bot 详情页时，可将名称升级为链接。
- 可用性：人工来源展示姓名首字头像；徽标向读屏器朗读来源类型和名称；空结果展示生效条件数量并提供一键清除；720px 以下改为单列卡片、可换行工具栏和单列详情工具区。
- 历史数据：缺少来源字段时前端降级为 `human`，名称优先使用旧的 `creatorName`，再降级为“未知创建者”。

## 前端设计

### 类型

```ts
type McpCreatedByType = "human" | "bot" | "import";

interface McpListItem {
  createdByType?: McpCreatedByType;
  createdByName?: string;
}
```

字段在过渡期保持可选，以兼容尚未升级的接口和历史 fixtures。`CreatedByBadge` 是纯展示组件，不读取接口或全局状态；卡片和详情共用。

### 数据流

```text
mock fixtures
  -> mcpService（keyword + category + createdByType）
  -> McpMarketListPage
  -> McpCard / McpDetailModal
  -> CreatedByBadge
```

原型临时将 `USE_MOCK` 设为 `true`，避免任何真实创建、编辑、删除或列表请求。正式接入时应由环境配置或真实 API 发布节奏替代源码常量。

## 后端契约建议（本阶段不实现）

### 持久化

- `created_by_type`: 非空枚举 `human | bot | import`，默认 `human`，建立索引。
- `created_by_id`: 创建主体的稳定 ID；允许历史数据为空，新数据必须由服务端写入。
- `created_by_name`: 创建时展示名快照，避免列表联表；主体改名后是否回填需产品决策。
- 历史记录回填 `created_by_type=human`，名称可沿用现有创建者快照。

### 写入安全

- 客户端提交的三个来源字段一律忽略，来源只能由服务端根据可信鉴权上下文判定。
- 用户 Session -> `human`；Bot/API Key -> `bot`；受控 Git 导入任务 -> `import`。
- Bot 创建必须有 `owner_id`，服务端强制 `visibility=private`、`status=draft`，公开发布必须由有权限的人确认。
- 记录审计事件，至少包含认证主体、归属主体、来源类型和请求追踪 ID。

### API

- 列表/详情响应新增 `created_by_type`、`created_by_id`、`created_by_name`。
- `GET /api/mcps?created_by_type=human,bot` 支持枚举多选，并与关键词、分类、可见性做 AND 组合。
- 非法枚举返回结构化 400；未传参数表示全部。
- OpenAPI 明确字段只读，创建/更新 request schema 不暴露来源字段。

## 后续实施拆分

1. 后端 migration、模型、鉴权来源判定与安全默认值。
2. 列表/详情响应和来源过滤，补权限、伪造与历史兼容测试。
3. 前端移除强制 mock，接线真实字段和多选查询参数，补组件与页面测试。
4. octo-admin 来源列、筛选与详情展示。
5. 联调验证 human/bot/import、组合筛选、历史数据和 Bot 发布门槛。

## 验收与风险

- 原型验收：三类来源均能在卡片和详情辨识；筛选结果正确；中英文布局可用；暗色主题沿用语义 token。
- 正式验收：客户端无法伪造来源；Bot 创建始终 draft/private；历史记录无空类型；API 多选与其他条件组合正确。
- 风险：创建者改名导致快照不一致、主体删除后的展示策略、数据迁移锁表、枚举扩展兼容、来源过滤索引选择。上线前需用真实数据量评估迁移和查询计划。
