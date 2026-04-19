# エラーハンドリングガイドライン

> **参照タイミング**: すべてのプロジェクトで参照する。
> 生のエラーをユーザーに見せることは**絶対に避ける**。

---

## 1. 基本原則

### 1.1 エラーの分類

| 種類 | 例 | ユーザーへの表示 | ログ出力 |
|------|-----|-----------------|---------|
| **ユーザーエラー** | バリデーション失敗、認証エラー | 具体的なメッセージ | INFO |
| **ビジネスロジックエラー** | 在庫切れ、権限不足 | 具体的なメッセージ | WARN |
| **システムエラー** | DB 接続失敗、外部 API エラー | 汎用メッセージ | ERROR |
| **予期しないエラー** | null reference、型エラー | 汎用メッセージ | ERROR + スタック |

### 1.2 絶対に守るべきルール

1. **生のエラーメッセージをフロントエンドに返さない**
2. **スタックトレースをユーザーに見せない**
3. **内部実装の詳細（テーブル名、カラム名等）を露出しない**
4. **すべてのエラーをログに記録する**

---

## 2. フロントエンド実装

### 2.1 Error Boundary（React）

```tsx
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーログサービスに送信
    console.error('Uncaught error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // 本番環境では外部サービスに送信
    // reportErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>エラーが発生しました</h2>
          <p>申し訳ありません。問題が発生しました。</p>
          <button onClick={() => this.setState({ hasError: false })}>
            再試行
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**使用方法**:
```tsx
// app/layout.tsx or pages/_app.tsx
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

### 2.2 API エラーハンドリング（フロントエンド）

```typescript
// lib/api-client.ts
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export async function apiClient<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: {
          code: data.code || 'UNKNOWN_ERROR',
          message: data.message || 'エラーが発生しました',
          details: data.details,
        },
      };
    }

    return { data };
  } catch (error) {
    // ネットワークエラー等
    console.error('API request failed:', error);
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: 'サーバーに接続できません。ネットワーク接続を確認してください。',
      },
    };
  }
}
```

### 2.3 エラー表示コンポーネント

```tsx
// components/ErrorMessage.tsx
interface ErrorMessageProps {
  error: ApiError | null;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, onDismiss }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div role="alert" className="error-message">
      <p>{error.message}</p>
      {error.details && (
        <ul>
          {Object.entries(error.details).map(([field, messages]) =>
            messages.map((msg, i) => (
              <li key={`${field}-${i}`}>{msg}</li>
            ))
          )}
        </ul>
      )}
      {onDismiss && (
        <button onClick={onDismiss} aria-label="閉じる">×</button>
      )}
    </div>
  );
}
```

### 2.4 フォームバリデーションエラー

```tsx
// hooks/useForm.ts
interface FieldError {
  field: string;
  message: string;
}

function mapApiErrorsToFields(apiError: ApiError): FieldError[] {
  if (!apiError.details) return [];

  return Object.entries(apiError.details).flatMap(([field, messages]) =>
    messages.map(message => ({ field, message }))
  );
}

// 使用例
const { error } = await apiClient('/api/users', {
  method: 'POST',
  body: JSON.stringify(formData),
});

if (error) {
  const fieldErrors = mapApiErrorsToFields(error);
  // フォームの各フィールドにエラーを設定
}
```

---

## 3. バックエンド実装

### 3.1 エラークラスの定義

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, string[]>,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// 具体的なエラークラス
export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>) {
    super('VALIDATION_ERROR', '入力内容に問題があります', 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = '認証に失敗しました') {
    super('AUTHENTICATION_ERROR', message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'この操作を行う権限がありません') {
    super('AUTHORIZATION_ERROR', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'リソース') {
    super('NOT_FOUND', `${resource}が見つかりません`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = '競合が発生しました') {
    super('CONFLICT', message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('RATE_LIMIT_EXCEEDED', 'リクエスト数が上限を超えました。しばらくお待ちください', 429);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string) {
    super('EXTERNAL_SERVICE_ERROR', 'サービスに一時的な問題が発生しています', 503);
    // 内部的には詳細を保持
    this.internalMessage = `External service error: ${service}`;
  }
  private internalMessage: string;
}
```

### 3.2 グローバルエラーハンドラー

**Next.js App Router**:
```typescript
// app/api/[...route]/route.ts または middleware
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';

export function handleError(error: unknown): NextResponse {
  // ログ出力（本番では外部サービスに送信）
  console.error('API Error:', error);

  // AppError の場合は安全にレスポンス
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // 予期しないエラーは汎用メッセージ
  return NextResponse.json(
    {
      code: 'INTERNAL_ERROR',
      message: 'サーバーエラーが発生しました',
    },
    { status: 500 }
  );
}

// API ルートのラッパー
export function withErrorHandler(
  handler: (req: Request) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      return handleError(error);
    }
  };
}
```

**Express**:
```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  // 予期しないエラー
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'サーバーエラーが発生しました',
  });
}

// app.ts
app.use(errorHandler);
```

### 3.3 バリデーションエラーの返し方

```typescript
// Zod を使用した例
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  name: z.string().min(1, '名前を入力してください'),
});

function validateUser(data: unknown) {
  const result = userSchema.safeParse(data);

  if (!result.success) {
    const details: Record<string, string[]> = {};

    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      if (!details[field]) {
        details[field] = [];
      }
      details[field].push(issue.message);
    }

    throw new ValidationError(details);
  }

  return result.data;
}
```

---

## 4. エラーメッセージ設計

### 4.1 ユーザーフレンドリーなメッセージ

| 内部エラー | ユーザー向けメッセージ |
|-----------|----------------------|
| `ECONNREFUSED` | サーバーに接続できません |
| `ETIMEDOUT` | 接続がタイムアウトしました |
| `23505 (unique violation)` | この○○は既に使用されています |
| `23503 (foreign key)` | 関連するデータが存在しません |
| `ENOENT` | ファイルが見つかりません |
| `JWT expired` | セッションが切れました。再度ログインしてください |

### 4.2 エラーメッセージの国際化

```typescript
// lib/error-messages.ts
const errorMessages: Record<string, Record<string, string>> = {
  ja: {
    VALIDATION_ERROR: '入力内容に問題があります',
    AUTHENTICATION_ERROR: '認証に失敗しました',
    AUTHORIZATION_ERROR: 'この操作を行う権限がありません',
    NOT_FOUND: 'リソースが見つかりません',
    INTERNAL_ERROR: 'サーバーエラーが発生しました',
    NETWORK_ERROR: 'ネットワーク接続を確認してください',
  },
  en: {
    VALIDATION_ERROR: 'Invalid input',
    AUTHENTICATION_ERROR: 'Authentication failed',
    AUTHORIZATION_ERROR: 'You do not have permission for this action',
    NOT_FOUND: 'Resource not found',
    INTERNAL_ERROR: 'An internal error occurred',
    NETWORK_ERROR: 'Please check your network connection',
  },
};

export function getErrorMessage(code: string, locale = 'ja'): string {
  return errorMessages[locale]?.[code] || errorMessages['ja'][code] || 'エラーが発生しました';
}
```

---

## 5. ログ設計

### 5.1 ログレベル

| レベル | 用途 | 例 |
|--------|------|-----|
| `DEBUG` | 開発時のデバッグ情報 | リクエストパラメータ |
| `INFO` | 正常な操作の記録 | ユーザーログイン |
| `WARN` | 注意が必要だが継続可能 | レート制限接近 |
| `ERROR` | エラー発生 | API 呼び出し失敗 |
| `FATAL` | サービス停止レベル | DB 接続不可 |

### 5.2 構造化ログ

```typescript
// lib/logger.ts
interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  duration?: number;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

export function logError(message: string, error: Error, context: LogContext = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message,
    ...context,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
  };

  // 本番では JSON 形式で出力（ログ収集サービス向け）
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logEntry));
  } else {
    console.error(logEntry);
  }
}
```

### 5.3 センシティブ情報のマスキング

```typescript
// lib/sanitize.ts
const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

export function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLog(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
```

---

## 6. 外部サービスエラーのハンドリング

### 6.1 リトライ戦略

```typescript
// lib/retry.ts
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === options.maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        options.maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

### 6.2 Circuit Breaker

```typescript
// lib/circuit-breaker.ts
enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private lastFailure?: Date;

  constructor(
    private threshold: number = 5,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailure!.getTime() > this.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new ExternalServiceError('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = new Date();

    if (this.failures >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }
}
```

---

## 7. テスト

### 7.1 エラーハンドリングのテスト

```typescript
// __tests__/error-handling.test.ts
describe('Error Handling', () => {
  describe('API Error Response', () => {
    it('should return user-friendly message for validation error', async () => {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid' }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
      expect(data.message).not.toContain('Zod'); // 内部実装を露出しない
      expect(data.details?.email).toBeDefined();
    });

    it('should not expose stack trace in production', async () => {
      const response = await fetch('/api/crash');
      const data = await response.json();

      expect(data.stack).toBeUndefined();
      expect(data.message).toBe('サーバーエラーが発生しました');
    });
  });
});
```

---

## 8. チェックリスト

### 実装時の確認事項

- [ ] すべての API エンドポイントに try-catch がある
- [ ] グローバルエラーハンドラーが設定されている
- [ ] Error Boundary がルートに配置されている
- [ ] バリデーションエラーは詳細をユーザーに返す
- [ ] システムエラーは汎用メッセージを返す
- [ ] すべてのエラーがログに記録される
- [ ] センシティブ情報がログに含まれていない
- [ ] 外部サービス呼び出しにタイムアウトが設定されている
- [ ] 適切なリトライ戦略が実装されている

### レビュー時の確認事項

- [ ] 生のエラーメッセージがフロントに漏れていないか
- [ ] スタックトレースがレスポンスに含まれていないか
- [ ] エラーメッセージがユーザーにとって理解可能か
- [ ] エラー時の UI/UX が適切か（ローディング解除、フォーム再送信可能等）
