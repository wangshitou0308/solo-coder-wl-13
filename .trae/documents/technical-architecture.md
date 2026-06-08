## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        FE["React + Vite + TailwindCSS<br/>Zustand 状态管理"]
        MAP["Leaflet 地图组件"]
        WS_CLIENT["WebSocket 客户端"]
    end

    subgraph "后端层"
        API["Go + Gin RESTful API"]
        WS_SERVER["WebSocket 服务"]
        AUTH["JWT 认证中间件"]
    end

    subgraph "数据层"
        PG["PostgreSQL<br/>用户/任务/评价/社区"]
        REDIS["Redis<br/>会话缓存/热点任务"]
    end

    subgraph "基础设施"
        DOCKER["Docker Compose"]
        NGINX["Nginx 反向代理"]
    end

    FE --> API
    FE --> MAP
    FE --> WS_CLIENT
    WS_CLIENT --> WS_SERVER
    API --> AUTH
    API --> PG
    API --> REDIS
    WS_SERVER --> REDIS
    NGINX --> FE
    NGINX --> API
    NGINX --> WS_SERVER
    DOCKER --> NGINX
    DOCKER --> FE
    DOCKER --> API
    DOCKER --> PG
    DOCKER --> REDIS
```

## 2. 技术说明

- **前端**: React@18 + TypeScript + Vite + TailwindCSS@3 + Zustand + Leaflet
- **后端**: Go@1.21 + Gin + GORM + gorilla/websocket
- **数据库**: PostgreSQL@15（主数据存储）+ Redis@7（缓存与会话）
- **认证**: JWT（访问令牌 + 刷新令牌）
- **实时通讯**: WebSocket（gorilla/websocket）
- **容器化**: Docker + docker-compose，Nginx 反向代理
- **地图**: Leaflet + OpenStreetMap 瓦片

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 首页/任务大厅 |
| /login | 登录页 |
| /register | 注册页 |
| /community/join | 加入社区 |
| /tasks | 任务大厅列表 |
| /tasks/map | 任务地图视图 |
| /tasks/new | 发布新任务 |
| /tasks/:id | 任务详情页 |
| /profile | 个人中心 |
| /profile/transactions | 收支明细 |
| /profile/withdraw | 提现申请 |
| /leaderboard | 社区排行榜 |
| /messages | 消息列表 |
| /admin | 管理后台首页 |
| /admin/tasks | 任务审核 |
| /admin/complaints | 投诉仲裁 |
| /admin/config | 费率与积分配置 |

## 4. API 定义

### 4.1 认证相关

```
POST   /api/v1/auth/register     注册
POST   /api/v1/auth/login        登录
POST   /api/v1/auth/refresh      刷新令牌
GET    /api/v1/auth/me           当前用户信息
```

### 4.2 社区相关

```
GET    /api/v1/communities           社区列表（附近搜索）
GET    /api/v1/communities/:id       社区详情
POST   /api/v1/communities/join      加入社区（邀请码）
POST   /api/v1/communities/join-by-location  基于定位加入
GET    /api/v1/communities/:id/members 社区成员列表
```

### 4.3 任务相关

```
GET    /api/v1/tasks                 任务列表（支持筛选排序）
GET    /api/v1/tasks/:id             任务详情
POST   /api/v1/tasks                 创建任务
PUT    /api/v1/tasks/:id             更新任务
POST   /api/v1/tasks/:id/claim       认领任务
POST   /api/v1/tasks/:id/complete    标记完成
POST   /api/v1/tasks/:id/confirm     确认验收
POST   /api/v1/tasks/:id/cancel      取消任务
```

### 4.4 评价相关

```
POST   /api/v1/tasks/:id/review      提交评价
GET    /api/v1/users/:id/reviews      用户评价列表
```

### 4.5 即时通讯

```
GET    /api/v1/conversations          会话列表
GET    /api/v1/conversations/:id/messages 消息历史
WS     /api/v1/ws                     WebSocket连接
```

### 4.6 用户相关

```
GET    /api/v1/users/:id              用户公开信息
GET    /api/v1/users/me/stats         我的统计数据
GET    /api/v1/users/me/transactions  收支明细
POST   /api/v1/users/me/withdraw      提现申请
GET    /api/v1/users/me/credit        信用评分
```

### 4.7 排行榜

```
GET    /api/v1/leaderboard/tasks      接单数排行
GET    /api/v1/leaderboard/rating     好评率排行
```

### 4.8 管理后台

```
GET    /api/v1/admin/tasks/pending    待审核任务
PUT    /api/v1/admin/tasks/:id/review 审核任务
GET    /api/v1/admin/complaints       投诉列表
PUT    /api/v1/admin/complaints/:id   处理投诉
GET    /api/v1/admin/config           获取平台配置
PUT    /api/v1/admin/config           更新平台配置
```

## 5. 服务端架构图

```mermaid
graph LR
    subgraph "Controller 层"
        C1["AuthController"]
        C2["TaskController"]
        C3["CommunityController"]
        C4["MessageController"]
        C5["AdminController"]
    end

    subgraph "Service 层"
        S1["AuthService"]
        S2["TaskService"]
        S3["CommunityService"]
        S4["MessageService"]
        S5["PaymentService"]
        S6["AdminService"]
    end

    subgraph "Repository 层"
        R1["UserRepo"]
        R2["TaskRepo"]
        R3["CommunityRepo"]
        R4["MessageRepo"]
        R5["ReviewRepo"]
        R6["TransactionRepo"]
    end

    subgraph "数据层"
        DB["PostgreSQL"]
        CACHE["Redis"]
    end

    C1 --> S1
    C2 --> S2
    C3 --> S3
    C4 --> S4
    C5 --> S5
    C5 --> S6

    S1 --> R1
    S2 --> R2
    S2 --> R5
    S2 --> S5
    S3 --> R3
    S4 --> R4
    S5 --> R6
    S6 --> R2

    R1 --> DB
    R2 --> DB
    R3 --> DB
    R4 --> DB
    R5 --> DB
    R6 --> DB

    S2 --> CACHE
    S4 --> CACHE
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "users" ||--o{ "tasks" : "publishes"
    "users" ||--o{ "tasks" : "claims"
    "users" ||--o{ "reviews" : "gives"
    "users" ||--o{ "transactions" : "has"
    "users" }o--|| "communities" : "belongs_to"
    "communities" ||--o{ "tasks" : "contains"
    "tasks" ||--o| "reviews" : "receives"
    "tasks" ||--o{ "messages" : "has"
    "users" ||--o{ "messages" : "sends"

    "users" {
        bigint id PK
        string username
        string email
        string phone
        string password_hash
        string avatar
        bigint community_id FK
        string role
        float credit_score
        float balance
        float latitude
        float longitude
        timestamp created_at
        timestamp updated_at
    }

    "communities" {
        bigint id PK
        string name
        string invite_code
        string address
        float latitude
        float longitude
        string description
        bigint admin_id FK
        timestamp created_at
    }

    "tasks" {
        bigint id PK
        bigint publisher_id FK
        bigint claimer_id FK
        bigint community_id FK
        string title
        text description
        string category
        float reward
        string reward_type
        string urgency
        timestamp deadline
        string status
        float latitude
        float longitude
        string address
        timestamp created_at
        timestamp updated_at
    }

    "reviews" {
        bigint id PK
        bigint task_id FK
        bigint reviewer_id FK
        bigint reviewee_id FK
        int rating
        text comment
        timestamp created_at
    }

    "messages" {
        bigint id PK
        bigint task_id FK
        bigint sender_id FK
        text content
        string type
        timestamp created_at
    }

    "transactions" {
        bigint id PK
        bigint user_id FK
        bigint task_id FK
        string type
        float amount
        string status
        timestamp created_at
    }

    "platform_config" {
        bigint id PK
        string key
        string value
        timestamp updated_at
    }
```

### 6.2 数据定义语言

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    community_id BIGINT REFERENCES communities(id),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    credit_score DECIMAL(5,2) NOT NULL DEFAULT 100.00,
    balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE communities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(255),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    description TEXT,
    admin_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
    id BIGSERIAL PRIMARY KEY,
    publisher_id BIGINT NOT NULL REFERENCES users(id),
    claimer_id BIGINT REFERENCES users(id),
    community_id BIGINT NOT NULL REFERENCES communities(id),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    reward DECIMAL(12,2) NOT NULL,
    reward_type VARCHAR(20) NOT NULL DEFAULT 'credit',
    urgency VARCHAR(20) NOT NULL DEFAULT 'normal',
    deadline TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    address VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL UNIQUE REFERENCES tasks(id),
    reviewer_id BIGINT NOT NULL REFERENCES users(id),
    reviewee_id BIGINT NOT NULL REFERENCES users(id),
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id),
    sender_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'text',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    task_id BIGINT REFERENCES tasks(id),
    type VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE platform_config (
    id BIGSERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value VARCHAR(500) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_community_status ON tasks(community_id, status);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_reward ON tasks(reward DESC);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_messages_task ON messages(task_id, created_at);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_users_community ON users(community_id);

INSERT INTO platform_config (key, value) VALUES
    ('service_fee_rate', '0.05'),
    ('min_withdraw_amount', '10.00'),
    ('credit_score_base', '100.00'),
    ('credit_score_task_complete_bonus', '2.00'),
    ('credit_score_task_fail_penalty', '5.00'),
    ('credit_score_five_star_bonus', '1.00');
```
