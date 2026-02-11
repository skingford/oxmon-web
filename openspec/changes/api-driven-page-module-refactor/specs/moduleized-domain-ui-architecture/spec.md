## ADDED Requirements

### Requirement: 页面采用三层模块架构
系统 MUST 将重构页面组织为路由容器层、业务功能层和基础 UI 层，并限制跨层直接依赖。

#### Scenario: 页面模块分层可识别
- **WHEN** 检查任一重构页面的实现结构
- **THEN** 其实现 SHALL 能明确区分路由容器、feature 模块与 UI 原子组件职责

### Requirement: 路由层不得承载复杂业务逻辑
路由容器层 MUST 仅负责参数解析、上下文注入与模块编排，不得直接实现复杂业务计算或视图转换逻辑。

#### Scenario: 路由层代码职责检查
- **WHEN** 审阅路由页面入口文件
- **THEN** 复杂业务逻辑 MUST 位于业务功能层而非路由层

### Requirement: 模块输入输出具备类型契约
业务模块 MUST 声明清晰的输入输出类型，并通过显式转换将接口 DTO 映射为页面 ViewModel。

#### Scenario: 模块消费接口响应
- **WHEN** 模块接收接口返回数据
- **THEN** 实现 SHALL 通过类型化转换步骤输出模块内部可消费的 ViewModel
