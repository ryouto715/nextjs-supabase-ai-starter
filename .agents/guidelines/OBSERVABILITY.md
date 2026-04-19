# オブザーバビリティ設計ガイドライン

> **目的**: エージェントの動作とアプリケーションの状態を可視化し、問題の早期発見・デバッグ・改善を支援する。

---

## 1. オブザーバビリティの 3 本柱

| 柱 | 目的 | 実装 |
|----|------|------|
| **ログ** | イベントの記録・デバッグ | 構造化ログ |
| **メトリクス** | 定量的な状態把握 | カウンター、ゲージ |
| **トレース** | リクエストの追跡 | 分散トレーシング |

---

## 2. Decision Log（エージェント動作の可視化）

### 2.1 Decision Log とは

エージェントが実装中に行った意思決定を記録するログ。
ExecPlan の「Decision Log」セクションに記載する。

### 2.2 記録すべき内容

```markdown
## Decision Log

### [YYYY-MM-DD HH:MM] [カテゴリ] タイトル

**コンテキスト**: 何を決める必要があったか
**選択肢**:
- A: [選択肢A] - メリット / デメリット
- B: [選択肢B] - メリット / デメリット

**決定**: [選択した内容]
**理由**: [なぜその選択をしたか]
**影響**: [この決定の影響範囲]
```

### 2.3 記録のカテゴリ

| カテゴリ | 記録するタイミング |
|---------|-------------------|
| `ARCHITECTURE` | アーキテクチャに関する決定 |
| `LIBRARY` | ライブラリ・ツールの選定 |
| `PATTERN` | 設計パターンの適用 |
| `TRADE-OFF` | トレードオフのある決定 |
| `DEVIATION` | REQUIREMENTS.md からの逸脱 |
| `ERROR` | エラー発生と対応 |

### 2.4 Decision Log の例

```markdown
### [2025-01-22 10:30] [LIBRARY] 状態管理ライブラリの選定

**コンテキスト**: グローバル状態管理が必要になった
**選択肢**:
- A: Redux - 実績豊富、学習コスト高
- B: Zustand - 軽量、シンプル
- C: Jotai - アトミック、細粒度

**決定**: Zustand を採用
**理由**:
- REQUIREMENTS.md で「シンプル」が重視されている
- 状態の複雑さが中程度で Redux はオーバーエンジニアリング
- チームの学習コストを抑えられる

**影響**: store/ ディレクトリを作成、Provider 不要
```

---

## 3. アプリケーションログ

### 3.1 構造化ログ形式

```typescript
// lib/logger.ts
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  service: string;
  requestId?: string;
  userId?: string;
  traceId?: string;
  spanId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private log(level: LogEntry['level'], message: string, meta?: Partial<LogEntry>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...meta,
    };

    // 本番: JSON 出力
    // 開発: 人間が読みやすい形式
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      const color = this.getColor(level);
      console.log(
        `${color}[${entry.timestamp}] [${level}] ${message}`,
        meta ? JSON.stringify(meta, null, 2) : ''
      );
    }
  }

  debug(message: string, meta?: Partial<LogEntry>) {
    this.log('DEBUG', message, meta);
  }

  info(message: string, meta?: Partial<LogEntry>) {
    this.log('INFO', message, meta);
  }

  warn(message: string, meta?: Partial<LogEntry>) {
    this.log('WARN', message, meta);
  }

  error(message: string, error?: Error, meta?: Partial<LogEntry>) {
    this.log('ERROR', message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } : undefined,
    });
  }

  private getColor(level: LogEntry['level']): string {
    const colors = {
      DEBUG: '\x1b[36m',
      INFO: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      FATAL: '\x1b[35m',
    };
    return colors[level] || '';
  }
}

export const logger = new Logger(process.env.SERVICE_NAME || 'app');
```

### 3.2 ログレベルガイドライン

| レベル | 使用場面 | 例 |
|--------|---------|-----|
| `DEBUG` | 開発時のみ必要な詳細情報 | 変数の値、SQL クエリ |
| `INFO` | 正常な操作の記録 | ユーザーログイン、注文完了 |
| `WARN` | 注意が必要だが継続可能 | レート制限接近、非推奨 API 使用 |
| `ERROR` | エラー発生（リカバリー可能） | API 呼び出し失敗、バリデーションエラー |
| `FATAL` | サービス停止レベル | DB 接続不可、必須環境変数未設定 |

### 3.3 ログ出力のベストプラクティス

**良い例**:
```typescript
logger.info('User created', {
  userId: user.id,
  email: user.email,  // センシティブでない範囲で
  duration: Date.now() - startTime,
});

logger.error('Payment failed', paymentError, {
  userId: user.id,
  orderId: order.id,
  amount: order.amount,
});
```

**悪い例**:
```typescript
// センシティブ情報を含めない
logger.info('User created', { password: user.password });

// 曖昧なメッセージを避ける
logger.error('Error occurred');

// コンソール直接使用を避ける
console.log('debug:', data);
```

---

## 4. リクエストトレーシング

### 4.1 Request ID の付与

```typescript
// middleware/requestId.ts
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';

export function requestIdMiddleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || uuidv4();

  // ヘッダーにセット
  const response = NextResponse.next();
  response.headers.set('x-request-id', requestId);

  // AsyncLocalStorage でリクエストコンテキストに保存
  return response;
}
```

### 4.2 AsyncLocalStorage でコンテキスト伝播

```typescript
// lib/context.ts
import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
  userId?: string;
  traceId?: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContext.getStore();
}

// ミドルウェアで設定
export function withContext<T>(context: RequestContext, fn: () => T): T {
  return requestContext.run(context, fn);
}
```

### 4.3 ログにコンテキストを自動付与

```typescript
// lib/logger.ts（拡張版）
class ContextAwareLogger extends Logger {
  private log(level: LogEntry['level'], message: string, meta?: Partial<LogEntry>) {
    const context = getRequestContext();

    super.log(level, message, {
      ...meta,
      requestId: context?.requestId,
      userId: context?.userId,
      traceId: context?.traceId,
    });
  }
}
```

---

## 5. メトリクス

### 5.1 収集すべきメトリクス

**アプリケーションメトリクス**:

| メトリクス | 種類 | 説明 |
|-----------|------|------|
| `http_requests_total` | Counter | HTTP リクエスト総数 |
| `http_request_duration_seconds` | Histogram | リクエスト処理時間 |
| `http_requests_in_progress` | Gauge | 処理中のリクエスト数 |
| `errors_total` | Counter | エラー発生数 |

**ビジネスメトリクス**:

| メトリクス | 種類 | 説明 |
|-----------|------|------|
| `users_registered_total` | Counter | ユーザー登録数 |
| `orders_created_total` | Counter | 注文作成数 |
| `active_sessions` | Gauge | アクティブセッション数 |

### 5.2 メトリクス収集の実装

```typescript
// lib/metrics.ts
interface MetricsCollector {
  increment(name: string, labels?: Record<string, string>): void;
  gauge(name: string, value: number, labels?: Record<string, string>): void;
  histogram(name: string, value: number, labels?: Record<string, string>): void;
}

// シンプルな実装（本番では Prometheus / DataDog 等を使用）
class SimpleMetrics implements MetricsCollector {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();

  increment(name: string, labels: Record<string, string> = {}) {
    const key = this.makeKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }

  gauge(name: string, value: number, labels: Record<string, string> = {}) {
    const key = this.makeKey(name, labels);
    this.gauges.set(key, value);
  }

  histogram(name: string, value: number, labels: Record<string, string> = {}) {
    // 簡易実装: ログ出力
    logger.debug(`Histogram: ${name}`, { value, labels });
  }

  private makeKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  // メトリクスをエクスポート（/metrics エンドポイント用）
  export(): string {
    let output = '';
    for (const [key, value] of this.counters) {
      output += `${key} ${value}\n`;
    }
    for (const [key, value] of this.gauges) {
      output += `${key} ${value}\n`;
    }
    return output;
  }
}

export const metrics = new SimpleMetrics();
```

### 5.3 HTTP メトリクスミドルウェア

```typescript
// middleware/metrics.ts
export async function metricsMiddleware(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  const start = Date.now();
  const method = request.method;
  const path = new URL(request.url).pathname;

  try {
    const response = await handler();
    const duration = (Date.now() - start) / 1000;

    metrics.increment('http_requests_total', {
      method,
      path,
      status: response.status.toString(),
    });

    metrics.histogram('http_request_duration_seconds', duration, {
      method,
      path,
    });

    return response;
  } catch (error) {
    metrics.increment('errors_total', { method, path });
    throw error;
  }
}
```

---

## 6. エージェント動作のデバッグ

### 6.1 デバッグ情報の出力

ExecPlan 実行中に問題が発生した場合、以下を確認：

1. **Decision Log**: 何を決定したか
2. **エラーログ**: どこで失敗したか
3. **テスト結果**: どのテストが失敗したか
4. **Git diff**: 何を変更したか

### 6.2 問題発生時の調査フロー

```
[問題発見]
    ↓
[ログ確認]
├─ エラーメッセージを特定
├─ スタックトレースを確認
└─ 関連する Request ID を特定
    ↓
[Decision Log 確認]
├─ 問題発生前後の意思決定を確認
└─ 想定と異なる決定がないか
    ↓
[コード確認]
├─ Git diff で変更内容を確認
├─ 影響を受けたファイルを特定
└─ テストカバレッジを確認
    ↓
[原因特定・修正]
```

### 6.3 よくある問題と調査ポイント

| 問題 | 調査ポイント |
|------|-------------|
| テストが通らない | テストの assertion、モックの設定 |
| 型エラー | 変更した interface、import パス |
| ランタイムエラー | null チェック、非同期処理 |
| UI が崩れる | CSS の競合、レスポンシブ対応 |
| API エラー | リクエスト/レスポンス形式、認証 |

---

## 7. アラート設定

### 7.1 アラート基準

| 条件 | 重要度 | 通知先 |
|------|--------|--------|
| エラー率 > 1% | High | Slack + PagerDuty |
| レスポンスタイム p95 > 2s | Medium | Slack |
| メモリ使用率 > 80% | Medium | Slack |
| ディスク使用率 > 90% | High | Slack + PagerDuty |
| 外部 API 障害 | High | Slack |

### 7.2 シンプルなアラート実装

```typescript
// lib/alerts.ts
interface AlertConfig {
  errorRateThreshold: number;
  responseTimeThreshold: number;
  checkIntervalMs: number;
}

class AlertManager {
  private errorCount = 0;
  private requestCount = 0;

  constructor(private config: AlertConfig) {
    setInterval(() => this.check(), config.checkIntervalMs);
  }

  recordRequest(duration: number, isError: boolean) {
    this.requestCount++;
    if (isError) this.errorCount++;

    // レスポンスタイム超過
    if (duration > this.config.responseTimeThreshold) {
      this.sendAlert('SLOW_RESPONSE', { duration });
    }
  }

  private check() {
    if (this.requestCount === 0) return;

    const errorRate = this.errorCount / this.requestCount;
    if (errorRate > this.config.errorRateThreshold) {
      this.sendAlert('HIGH_ERROR_RATE', { errorRate });
    }

    // リセット
    this.errorCount = 0;
    this.requestCount = 0;
  }

  private sendAlert(type: string, data: Record<string, unknown>) {
    logger.error(`ALERT: ${type}`, undefined, { metadata: data });

    // Slack 通知等
    // await slack.send({ text: `🚨 ${type}: ${JSON.stringify(data)}` });
  }
}
```

---

## 8. ダッシュボード

### 8.1 必須ダッシュボード

**アプリケーション概要**:
- リクエスト数（時系列）
- エラー率（時系列）
- レスポンスタイム（p50, p95, p99）
- アクティブユーザー数

**エラー分析**:
- エラー種別の内訳
- エラー発生箇所（エンドポイント別）
- 最新のエラーログ

**リソース**:
- CPU 使用率
- メモリ使用率
- DB 接続数

### 8.2 開発用ダッシュボード（推奨）

```
/admin/debug
├─ 最新ログ（リアルタイム）
├─ メトリクス概要
├─ Decision Log 一覧
└─ 環境変数（非機密のみ）
```

---

## 9. 本番環境でのログ管理

### 9.1 推奨構成

| コンポーネント | 推奨サービス |
|---------------|-------------|
| ログ収集 | Fluentd / Fluent Bit |
| ログ保存・検索 | Elasticsearch / Loki |
| 可視化 | Kibana / Grafana |
| アラート | PagerDuty / OpsGenie |
| APM | Datadog / New Relic |

### 9.2 ログ保持期間

| 環境 | 保持期間 |
|------|---------|
| 開発 | 7 日 |
| ステージング | 30 日 |
| 本番 | 90 日（法的要件に応じて延長） |

---

## 10. チェックリスト

### 実装時

- [ ] 構造化ログが実装されている
- [ ] Request ID がすべてのリクエストに付与されている
- [ ] エラーが適切にログ出力されている
- [ ] センシティブ情報がログに含まれていない
- [ ] Decision Log に意思決定が記録されている

### 運用時

- [ ] ログが中央集約されている
- [ ] アラートが設定されている
- [ ] ダッシュボードが構築されている
- [ ] ログ保持期間が適切に設定されている
- [ ] 定期的なログ分析が実施されている
