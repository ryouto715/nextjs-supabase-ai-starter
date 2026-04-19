---
name: test-writing
description: 読みやすく保守しやすいテストコードを作成するためのスキル。単体/統合/E2E テストに適用。AAA パターン、命名規則、モック戦略、アンチパターンを含む。Python / TypeScript / JavaScript / Java のベストプラクティスを併記。
---

# テストコード作成スキル

## 概要
このスキルは、読みやすく保守しやすいテストコードを作成するための原則とベストプラクティスを提供します。単体テスト、統合テスト、E2Eテストなど、あらゆる種類のテストコード作成に適用できます。

## 核心原則
**テストコードは読みやすく、変更しやすく、信頼できるものでなければならない。**
- 他の開発者がテストを理解し、変更できるようにする
- テスト失敗時に問題を素早く特定できるようにする
- テストの追加を容易にし、テストカバレッジの向上を促進する

## このスキルを使用するタイミング
- 新しい機能のテストを作成するとき
- 既存のテストをリファクタリングするとき
- バグ修正のための回帰テストを書くとき
- テストコードレビューを行うとき
- テストが失敗した際の原因調査時

## テストコードの可読性原則

### 1. テストは最小限の記述で本質を表現する

**悪い例：詳細が多すぎる**
```python
def test_sort_and_filter():
    docs = []
    doc1 = ScoredDocument()
    doc1.url = "http://example.com"
    doc1.score = -5.0
    docs.append(doc1)
    doc2 = ScoredDocument()
    doc2.url = "http://example.com"
    doc2.score = 1
    docs.append(doc2)
    # ... さらに続く
    
    sort_and_filter_docs(docs)
    
    assert len(docs) == 3
    assert docs[0].score == 4
```

**良い例：本質のみを表現**
```python
def test_sort_and_filter():
    check_scores_before_after("-5, 1, 4, -99998.7, 3", "4, 3, 1")
```

ヘルパー関数を作成して、テストの意図を1行で表現できるようにします。

### 2. テストの意図を明確にする

各テストは「この入力/状況に対して、この振る舞い/出力を期待する」という形で表現されるべきです。

**テスト構造のパターン（AAA）**
- **Arrange（準備）**: テストに必要なデータやオブジェクトを準備
- **Act（実行）**: テスト対象の機能を実行
- **Assert（検証）**: 期待される結果を確認

```typescript
describe('UserService', () => {
  it('should create a new user with valid data', () => {
    // Arrange
    const userData = { name: 'Alice', email: 'alice@example.com' };
    
    // Act
    const user = userService.create(userData);
    
    // Assert
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@example.com');
  });
});
```

### 3. ヘルパー関数で重複を排除

**悪い例：コピー&ペースト**
```typescript
it('should handle empty input', () => {
  const input = createTestInput();
  input.data = [];
  const result = processor.process(input);
  expect(result.success).toBe(true);
});

it('should handle null input', () => {
  const input = createTestInput();
  input.data = null;
  const result = processor.process(input);
  expect(result.success).toBe(false);
});
```

**良い例：ヘルパー関数を使用**
```typescript
function expectProcessResult(inputData: any, expectedSuccess: boolean) {
  const input = createTestInput();
  input.data = inputData;
  const result = processor.process(input);
  expect(result.success).toBe(expectedSuccess);
}

it('should handle empty input', () => {
  expectProcessResult([], true);
});

it('should handle null input', () => {
  expectProcessResult(null, false);
});
```

## テスト入力値の選び方

### シンプルで効果的な入力値を選ぶ

**原則**
- 最もシンプルな値で完全にコードを検証する
- 不必要に複雑な値を避ける
- エッジケースを明確に示す値を使用

**悪い例：複雑すぎる**
```python
def test_voting():
    check_vote_change(123014, -1082342, 823423)  # 意味不明な数値
```

**良い例：シンプルで意図が明確**
```python
def test_voting():
    check_vote_change(1, 2, -1)  # 1から2に変更、-1はネガティブケース
```

### 複数のテストケースで機能を検証

1つの完璧なテストより、複数の小さなテストの方が効果的です。

```typescript
describe('SortAndFilterDocs', () => {
  it('should sort in descending order', () => {
    checkScoresBeforeAfter('2, 1, 3', '3, 2, 1');
  });

  it('should remove negative values', () => {
    checkScoresBeforeAfter('0, -0.1, -10', '0');
  });

  it('should handle duplicates', () => {
    checkScoresBeforeAfter('1, -2, 1, -2', '1, 1');
  });

  it('should handle empty input', () => {
    checkScoresBeforeAfter('', '');
  });
});
```

### テスト入力の境界値

以下のケースを必ず含める：
- **空の入力**: `[]`, `""`, `null`, `undefined`
- **最小値**: `0`, `-1`, `Number.MIN_VALUE`
- **最大値**: `Number.MAX_VALUE`, 配列の最大サイズ
- **境界値**: `0`と`1`の間、`-1`と`0`の間
- **重複**: 同じ値が複数ある場合
- **不正な入力**: 期待される型以外の値

## エラーメッセージの作成

### 詳細なアサーションを使用

**悪い例：情報不足**
```python
assert output == expected_output  # 失敗時: AssertionError
```

**良い例：詳細なメッセージ**
```python
# Pythonの場合
self.assertEqual(output, expected_output)
# 失敗時: AssertionError: '1, 3, 4' != '4, 3, 1'

# TypeScriptの場合
expect(output).toEqual(expectedOutput);
// 失敗時: Expected '4, 3, 1' but received '1, 3, 4'
```

### カスタムエラーメッセージ

複雑なケースでは、カスタムメッセージを追加：

```typescript
function checkScoresBeforeAfter(input: string, expectedOutput: string) {
  const docs = parseScores(input);
  sortAndFilterDocs(docs);
  const output = scoresToString(docs);
  
  if (output !== expectedOutput) {
    throw new Error(
      `checkScoresBeforeAfter() failed
Input: "${input}"
Expected: "${expectedOutput}"
Actual: "${output}"`
    );
  }
}
```

```python
def check_scores_before_after(input_str, expected_output):
    docs = parse_scores(input_str)
    sort_and_filter_docs(docs)
    output = scores_to_string(docs)
    
    assert output == expected_output, \
        f"check_scores_before_after() failed\n" \
        f"Input: {input_str}\n" \
        f"Expected: {expected_output}\n" \
        f"Actual: {output}"
```

## テスト関数の命名規則

### 命名に含めるべき情報

1. **テスト対象**: クラス名、関数名
2. **テストするシナリオ/状況**: 入力条件、状態
3. **期待される結果**: 何が起こるべきか

### 命名パターン

**パターン1: `test_<機能>_<シナリオ>_<期待結果>`**
```python
def test_sort_and_filter_negative_values_are_removed():
    pass

def test_sort_and_filter_empty_input_returns_empty():
    pass
```

**パターン2: `should_<期待結果>_when_<シナリオ>`（BDD形式）**
```typescript
describe('UserService', () => {
  it('should return null when user not found', () => {});
  
  it('should throw error when email is invalid', () => {});
  
  it('should create user when all data is valid', () => {});
});
```

**パターン3: `given_<前提>_when_<操作>_then_<結果>`**
```java
@Test
public void given_validUser_when_login_then_returnsToken() {}

@Test
public void given_invalidPassword_when_login_then_throwsException() {}
```

### 悪い命名例
```python
def test1():  # ❌ 何をテストするか不明
def test_user():  # ❌ 曖昧すぎる
def test_method():  # ❌ どのメソッド？何をテスト？
```

## 言語別ベストプラクティス

### Python (unittest/pytest)

```python
import unittest
from unittest.mock import Mock, patch

class TestUserService(unittest.TestCase):
    def setUp(self):
        """各テストの前に実行される準備処理"""
        self.service = UserService()
        self.test_user_data = {
            'name': 'Alice',
            'email': 'alice@example.com'
        }
    
    def tearDown(self):
        """各テストの後に実行されるクリーンアップ処理"""
        self.service.cleanup()
    
    def test_create_user_with_valid_data_succeeds(self):
        """有効なデータでユーザー作成が成功する"""
        user = self.service.create_user(self.test_user_data)
        
        self.assertIsNotNone(user.id)
        self.assertEqual(user.name, 'Alice')
        self.assertEqual(user.email, 'alice@example.com')
    
    def test_create_user_with_duplicate_email_raises_error(self):
        """重複メールアドレスでエラーが発生する"""
        self.service.create_user(self.test_user_data)
        
        with self.assertRaises(DuplicateEmailError):
            self.service.create_user(self.test_user_data)
    
    @patch('user_service.EmailValidator')
    def test_create_user_validates_email(self, mock_validator):
        """ユーザー作成時にメールが検証される"""
        mock_validator.is_valid.return_value = True
        
        self.service.create_user(self.test_user_data)
        
        mock_validator.is_valid.assert_called_once_with('alice@example.com')

# pytestスタイル
import pytest

def test_divide_by_zero_raises_error():
    """ゼロ除算でエラーが発生する"""
    with pytest.raises(ZeroDivisionError):
        result = 10 / 0

@pytest.mark.parametrize("input,expected", [
    (2, 4),
    (3, 9),
    (4, 16),
])
def test_square_numbers(input, expected):
    """数値の二乗を計算する"""
    assert square(input) == expected

@pytest.fixture
def user_service():
    """テスト用のUserServiceインスタンスを提供"""
    service = UserService()
    yield service
    service.cleanup()
```

### TypeScript (Jest/Vitest)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// または import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('UserService', () => {
  let userService: UserService;
  let mockDatabase: any;

  beforeEach(() => {
    // 各テストの前に実行
    mockDatabase = {
      save: vi.fn(),
      find: vi.fn(),
    };
    userService = new UserService(mockDatabase);
  });

  afterEach(() => {
    // 各テストの後に実行
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = { name: 'Alice', email: 'alice@example.com' };
      mockDatabase.save.mockResolvedValue({ id: '123', ...userData });

      const user = await userService.createUser(userData);

      expect(user.id).toBe('123');
      expect(user.name).toBe('Alice');
      expect(user.email).toBe('alice@example.com');
      expect(mockDatabase.save).toHaveBeenCalledWith(userData);
    });

    it('should throw error when email is invalid', async () => {
      const userData = { name: 'Bob', email: 'invalid-email' };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });

    it('should validate email before saving', async () => {
      const validateSpy = vi.spyOn(userService, 'validateEmail');
      const userData = { name: 'Charlie', email: 'charlie@example.com' };

      await userService.createUser(userData);

      expect(validateSpy).toHaveBeenCalledWith('charlie@example.com');
    });
  });

  describe('findUser', () => {
    it('should return null when user not found', async () => {
      mockDatabase.find.mockResolvedValue(null);

      const user = await userService.findUser('999');

      expect(user).toBeNull();
    });

    it('should return user when found', async () => {
      const mockUser = { id: '123', name: 'Alice' };
      mockDatabase.find.mockResolvedValue(mockUser);

      const user = await userService.findUser('123');

      expect(user).toEqual(mockUser);
    });
  });
});

// パラメータ化テスト
describe.each([
  { input: 2, expected: 4 },
  { input: 3, expected: 9 },
  { input: 4, expected: 16 },
])('square function', ({ input, expected }) => {
  it(`should return ${expected} when input is ${input}`, () => {
    expect(square(input)).toBe(expected);
  });
});

// 非同期テストのパターン
it('should handle async operations', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

// タイムアウト処理
it('should timeout after 5 seconds', async () => {
  await expect(longRunningOperation()).rejects.toThrow('Timeout');
}, 5000);
```

### JavaScript (Jest)

```javascript
const { UserService } = require('./user-service');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  test('creates user with valid data', () => {
    const userData = { name: 'Alice', email: 'alice@example.com' };
    
    const user = userService.createUser(userData);
    
    expect(user).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
    });
    expect(user.id).toBeDefined();
  });

  test('throws error for duplicate email', () => {
    const userData = { name: 'Bob', email: 'bob@example.com' };
    userService.createUser(userData);
    
    expect(() => {
      userService.createUser(userData);
    }).toThrow('Email already exists');
  });

  // スナップショットテスト
  test('renders user profile correctly', () => {
    const profile = renderUserProfile({ name: 'Alice', age: 30 });
    expect(profile).toMatchSnapshot();
  });
});
```

### Java (JUnit 5)

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserServiceTest {
    private UserService userService;
    private Database mockDatabase;

    @BeforeEach
    void setUp() {
        mockDatabase = mock(Database.class);
        userService = new UserService(mockDatabase);
    }

    @AfterEach
    void tearDown() {
        userService.cleanup();
    }

    @Test
    @DisplayName("有効なデータでユーザーを作成できる")
    void testCreateUserWithValidData() {
        UserData userData = new UserData("Alice", "alice@example.com");
        
        User user = userService.createUser(userData);
        
        assertNotNull(user.getId());
        assertEquals("Alice", user.getName());
        assertEquals("alice@example.com", user.getEmail());
    }

    @Test
    @DisplayName("無効なメールアドレスで例外が発生する")
    void testCreateUserWithInvalidEmail() {
        UserData userData = new UserData("Bob", "invalid-email");
        
        assertThrows(InvalidEmailException.class, () -> {
            userService.createUser(userData);
        });
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "invalid", "@example.com", "user@"})
    @DisplayName("不正なメールフォーマットを検出する")
    void testInvalidEmailFormats(String email) {
        assertFalse(userService.isValidEmail(email));
    }

    @ParameterizedTest
    @CsvSource({
        "alice@example.com, true",
        "bob@test.org, true",
        "invalid, false",
        "@example.com, false"
    })
    void testEmailValidation(String email, boolean expected) {
        assertEquals(expected, userService.isValidEmail(email));
    }

    @Test
    void testCreateUserCallsDatabase() {
        UserData userData = new UserData("Charlie", "charlie@example.com");
        when(mockDatabase.save(any())).thenReturn(new User("123", userData));
        
        userService.createUser(userData);
        
        verify(mockDatabase).save(any(User.class));
    }
}
```

## テスト設計のベストプラクティス

### 1. 独立したテスト

各テストは他のテストに依存せず、独立して実行可能であるべきです。

**悪い例：テスト間の依存**
```typescript
let userId: string;

it('should create user', () => {
  userId = userService.create({ name: 'Alice' }).id;
  expect(userId).toBeDefined();
});

it('should find created user', () => {
  // 前のテストに依存している！
  const user = userService.find(userId);
  expect(user.name).toBe('Alice');
});
```

**良い例：独立したテスト**
```typescript
it('should create user', () => {
  const user = userService.create({ name: 'Alice' });
  expect(user.id).toBeDefined();
});

it('should find created user', () => {
  const createdUser = userService.create({ name: 'Alice' });
  const foundUser = userService.find(createdUser.id);
  expect(foundUser.name).toBe('Alice');
});
```

### 2. 決定的なテスト

テストは常に同じ結果を返すべきです（非決定的な動作を避ける）。

**悪い例：非決定的**
```python
def test_user_creation_time():
    user = create_user()
    # 実行時刻に依存！
    assert user.created_at == datetime.now()
```

**良い例：決定的**
```python
def test_user_creation_time():
    fixed_time = datetime(2024, 1, 1, 12, 0, 0)
    with freeze_time(fixed_time):
        user = create_user()
        assert user.created_at == fixed_time
```

### 3. テストのスコープ

単体テストは1つの機能単位に焦点を当てるべきです。

**悪い例：複数の機能をテスト**
```typescript
it('should handle user lifecycle', () => {
  // ユーザー作成
  const user = userService.create({ name: 'Alice' });
  expect(user.id).toBeDefined();
  
  // ユーザー更新
  userService.update(user.id, { name: 'Alice Smith' });
  expect(user.name).toBe('Alice Smith');
  
  // ユーザー削除
  userService.delete(user.id);
  expect(userService.find(user.id)).toBeNull();
});
```

**良い例：機能ごとに分離**
```typescript
describe('User lifecycle', () => {
  it('should create user', () => {
    const user = userService.create({ name: 'Alice' });
    expect(user.id).toBeDefined();
  });
  
  it('should update user', () => {
    const user = userService.create({ name: 'Alice' });
    userService.update(user.id, { name: 'Alice Smith' });
    const updated = userService.find(user.id);
    expect(updated.name).toBe('Alice Smith');
  });
  
  it('should delete user', () => {
    const user = userService.create({ name: 'Alice' });
    userService.delete(user.id);
    expect(userService.find(user.id)).toBeNull();
  });
});
```

### 4. モックとスタブの使い分け

**モック**: 呼び出しの検証が重要な場合
```typescript
it('should send email on user creation', () => {
  const emailService = { send: vi.fn() };
  const userService = new UserService(emailService);
  
  userService.create({ email: 'alice@example.com' });
  
  expect(emailService.send).toHaveBeenCalledWith({
    to: 'alice@example.com',
    subject: 'Welcome'
  });
});
```

**スタブ**: 戻り値の制御が重要な場合
```typescript
it('should handle database error', () => {
  const database = {
    save: vi.fn().mockRejectedValue(new Error('DB Error'))
  };
  const userService = new UserService(database);
  
  expect(() => userService.create({ name: 'Alice' }))
    .rejects.toThrow('DB Error');
});
```

## カスタムマッチャー/アサーション

### TypeScript/Jest カスタムマッチャー

```typescript
expect.extend({
  toBeValidEmail(received: string) {
    const pass = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received);
    return {
      pass,
      message: () => 
        pass
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`
    };
  }
});

// 使用例
it('should validate email format', () => {
  expect('alice@example.com').toBeValidEmail();
  expect('invalid').not.toBeValidEmail();
});
```

### Python カスタムアサーション

```python
class CustomAssertions:
    @staticmethod
    def assert_valid_email(email):
        pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        assert re.match(pattern, email), f"{email} is not a valid email"
    
    @staticmethod
    def assert_between(value, min_val, max_val):
        assert min_val <= value <= max_val, \
            f"{value} is not between {min_val} and {max_val}"

# 使用例
def test_user_age():
    user = create_user(age=25)
    CustomAssertions.assert_between(user.age, 18, 100)
```

## テストの構成とファイル構造

### 推奨ディレクトリ構造

```
project/
├── src/
│   ├── user-service.ts
│   ├── email-service.ts
│   └── database.ts
└── tests/
    ├── unit/
    │   ├── user-service.test.ts
    │   ├── email-service.test.ts
    │   └── database.test.ts
    ├── integration/
    │   ├── user-flow.test.ts
    │   └── api.test.ts
    ├── e2e/
    │   └── complete-flow.test.ts
    └── helpers/
        ├── test-data.ts
        └── assertions.ts
```

### テストヘルパーの整理

```typescript
// tests/helpers/test-data.ts
export const createTestUser = (overrides = {}) => ({
  name: 'Test User',
  email: 'test@example.com',
  age: 25,
  ...overrides
});

export const createTestUsers = (count: number) => 
  Array.from({ length: count }, (_, i) => 
    createTestUser({ email: `user${i}@example.com` })
  );

// tests/helpers/assertions.ts
export function expectUserToBeValid(user: User) {
  expect(user.id).toBeDefined();
  expect(user.name).toBeTruthy();
  expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
}
```

## テストカバレッジの考え方

### カバレッジの目標

- **重要なビジネスロジック**: 90-100%
- **ユーティリティ関数**: 80-90%
- **UIコンポーネント**: 60-80%
- **設定ファイル**: カバレッジ不要な場合も

### カバレッジより重要なこと

1. **意味のあるテスト**: 行カバレッジより、重要なシナリオをカバー
2. **エッジケースのテスト**: 境界値、エラーケースを確実にテスト
3. **保守性**: テストが壊れにくく、変更しやすいこと

## アンチパターン

### 避けるべきパターン

**1. テストで実装の詳細をテストする**
```typescript
// ❌ 悪い例：実装の詳細に依存
it('should call internal method', () => {
  const spy = vi.spyOn(userService, '_internalMethod');
  userService.createUser({ name: 'Alice' });
  expect(spy).toHaveBeenCalled();
});

// ✅ 良い例：公開インターフェースをテスト
it('should create user successfully', () => {
  const user = userService.createUser({ name: 'Alice' });
  expect(user.name).toBe('Alice');
});
```

**2. 過度なモック**
```typescript
// ❌ 悪い例：すべてをモック
it('should add two numbers', () => {
  const mockMath = { add: vi.fn().mockReturnValue(5) };
  expect(mockMath.add(2, 3)).toBe(5);
});

// ✅ 良い例：実際のロジックをテスト
it('should add two numbers', () => {
  expect(add(2, 3)).toBe(5);
});
```

**3. 巨大なテストケース**
```python
# ❌ 悪い例：1つのテストで多くをテスト
def test_entire_user_system():
    # 100行以上のテストコード...
    pass

# ✅ 良い例：小さく分割
def test_user_creation():
    pass

def test_user_validation():
    pass

def test_user_update():
    pass
```

**4. テスト名が不明確**
```typescript
// ❌ 悪い例
it('test1', () => {});
it('works', () => {});

// ✅ 良い例
it('should create user with valid data', () => {});
it('should throw error when email is duplicate', () => {});
```

## 出力フォーマット

テストコードを作成・改善する際は、以下を提供してください：

1. **テストの目的**: 何をテストしているか
2. **テストケースのリスト**: カバーするシナリオ
3. **完全なテストコード**: すぐに実行可能な形式
4. **使用しているパターン**: AAA、モック、カスタムマッチャーなど
5. **改善のポイント**: 元のコードと比較して何が良くなったか

## チェックリスト

新しいテストを書く前に確認：
- [ ] テスト名は明確で説明的か？
- [ ] テストは1つの機能に焦点を当てているか？
- [ ] テストは他のテストから独立しているか？
- [ ] テスト入力はシンプルで意図が明確か？
- [ ] 失敗時のエラーメッセージは有用か？
- [ ] エッジケース（空、null、境界値）をカバーしているか？
- [ ] テストは高速に実行されるか？
- [ ] モックは必要最小限か？

読みやすく、保守しやすく、信頼できるテストコードを目指しましょう！
