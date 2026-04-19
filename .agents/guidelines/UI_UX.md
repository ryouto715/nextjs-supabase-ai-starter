# UI/UX 開発ガイドライン

> **参照タイミング**: UI/UX を含むプロジェクトの開発時にのみ本ファイルを参照する。
> CLI ツールやバックエンド API のみのプロジェクトでは参照不要。

---

## 1. プラットフォーム別ガイドライン

### 1.1 Web アプリケーション

#### 推奨スタック
- **フレームワーク**: React, Next.js, Vue, Svelte
- **コンポーネント**: shadcn/ui, Radix UI, Headless UI
- **スタイリング**: Tailwind CSS, CSS Modules
- **アニメーション**: framer-motion, react-spring
- **アイコン**: Lucide, Heroicons, Phosphor Icons

#### ブレークポイント
```css
/* モバイル */      @media (max-width: 639px)
/* タブレット */    @media (min-width: 640px) and (max-width: 1023px)
/* デスクトップ */  @media (min-width: 1024px)
/* 大画面 */        @media (min-width: 1280px)
```

#### 検証ツール
- ブラウザ DevTools
- MCP Playwright（スクリーンショット取得）
- Lighthouse（パフォーマンス）

---

### 1.2 React Native（iOS / Android）

#### 推奨スタック
- **フレームワーク**: React Native, Expo
- **コンポーネント**: React Native Paper, NativeBase, Tamagui
- **ナビゲーション**: React Navigation, Expo Router
- **アニメーション**: react-native-reanimated, Moti
- **アイコン**: @expo/vector-icons, react-native-vector-icons

#### プラットフォーム固有の考慮
```javascript
import { Platform } from 'react-native';

const styles = {
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
    android: { elevation: 4 },
  }),
};
```

#### 検証方法
- iOS Simulator / Android Emulator
- Expo Go（実機テスト）
- `npx react-native run-ios` / `npx react-native run-android`

---

### 1.3 Flutter（iOS / Android / Web / Desktop）

#### 推奨スタック
- **状態管理**: Riverpod, Bloc, Provider
- **ルーティング**: go_router, auto_route
- **アニメーション**: flutter_animate, animations パッケージ
- **UI コンポーネント**: Material 3, Cupertino（iOS風）

#### プラットフォーム適応
```dart
import 'dart:io' show Platform;

Widget build(BuildContext context) {
  if (Platform.isIOS) {
    return CupertinoButton(...);
  }
  return ElevatedButton(...);
}
```

#### 検証方法
- `flutter run -d ios` / `flutter run -d android`
- Flutter DevTools
- Widget テスト + Golden テスト（スナップショット）

---

### 1.4 SwiftUI（iOS / macOS）

#### 推奨パターン
- **アーキテクチャ**: MVVM, TCA (The Composable Architecture)
- **ナビゲーション**: NavigationStack（iOS 16+）
- **アニメーション**: withAnimation, matchedGeometryEffect

#### デザインシステム
```swift
extension Color {
    static let primary = Color("PrimaryColor")    // Assets.xcassets で定義
    static let secondary = Color("SecondaryColor")
}

extension Font {
    static let heading = Font.system(.title, design: .rounded).weight(.bold)
    static let body = Font.system(.body, design: .default)
}
```

#### 検証方法
- Xcode Previews（#Preview マクロ）
- Simulator（複数デバイスサイズ）
- UI テスト（XCUITest）

---

### 1.5 Jetpack Compose（Android）

#### 推奨パターン
- **アーキテクチャ**: MVVM + StateFlow
- **ナビゲーション**: Navigation Compose
- **アニメーション**: animateXxxAsState, AnimatedVisibility

#### デザインシステム
```kotlin
object AppColors {
    val primary = Color(0xFF6200EE)
    val secondary = Color(0xFF03DAC5)
}

object AppTypography {
    val heading = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp
    )
}
```

#### 検証方法
- Android Studio Preview
- Emulator（複数デバイスサイズ）
- Compose UI テスト

---

## 2. 共通デザイン原則

### 2.1 避けるべきパターン（AI slop 防止）

| カテゴリ | 避けるもの | 代わりに目指すもの |
|----------|-----------|-------------------|
| **色** | デフォルトの青・紫、真っ白な背景 | ブランドに合った独自のパレット |
| **フォント** | system font stack のみ | 特徴的なフォントの活用 |
| **アニメーション** | 無意味な fade-in、generic な動き | 状態変化を伝える意図的な動き |
| **レイアウト** | 中央揃えのカード羅列 | 非対称・大胆な構成 |
| **要素** | 過剰な角丸、stock photo 感 | シャープさと個性 |

### 2.2 目指すべき方向性

- **意図的で大胆、やや驚きのあるインターフェース**
- **表現力のあるタイポグラフィ**
- **明確なビジュアル方向性**（ブランドに合った一貫したトーン）
- **プラットフォームのデザインガイドライン尊重**
  - iOS: Human Interface Guidelines
  - Android: Material Design 3
  - Web: 独自性を出しやすい

---

## 3. デザイン仕様の明確化（フェーズ1）

REQUIREMENTS.md 作成時に、以下の情報を含める：

### 3.1 視覚的リファレンス
- スクリーンショット、スケッチ、モックアップ
- 参考にすべきアプリ・サイトの URL
- 避けるべきデザインパターンの例

### 3.2 デザインシステム定義
```yaml
colors:
  primary: "#..."
  secondary: "#..."
  background: "#..."
  text: "#..."
  
typography:
  heading: "Font Name / weight / size"
  body: "Font Name / weight / size"
  
spacing:
  unit: 8px  # 基本単位
  
radius:
  small: 4px
  medium: 8px
  large: 16px
```

### 3.3 インタラクション要件
- アニメーション・トランジションの方針
- ローディング状態、エラー状態の表示
- ダークモード対応の有無
- 対応デバイス・画面サイズ

---

## 4. デザイン参考の取得

web_search が利用可能な場合、実装前にデザイン参考を取得：

```
web_search "modern [アプリ種別] UI dribbble 2026"
web_search "[プラットフォーム] app design trends"
```

- 取得した参考の URL を Decision Log に記録
- 具体的なスタイル要素を抽出して適用

---

## 5. 自己検証ループ

UI 実装後、以下の検証を行う：

### 5.1 視覚的確認
- [ ] デザイン仕様と一致しているか
- [ ] 「AI slop」チェックリストをパスしているか
- [ ] スクリーンショットを取得して記録

### 5.2 レスポンシブ / マルチデバイス確認
- [ ] 最小サポートサイズで崩れていないか
- [ ] 大画面で余白が適切か
- [ ] 各プラットフォームで自然に見えるか

### 5.3 ダークモード確認（対応する場合）
- [ ] ライト/ダーク両方で視認性が確保されているか
- [ ] コントラスト比が WCAG 基準を満たしているか

### 5.4 インタラクション確認
- [ ] タップ/クリック領域が適切か（モバイル: 44pt以上）
- [ ] フィードバック（hover, press）が明確か
- [ ] アニメーションが滑らかか

---

## 6. UI Polish Phase（実装完了後）

機能実装が完了したら、UI を磨くフェーズを設ける：

1. **自己評価**: 「AI slop」チェックリストで評価
2. **参考との比較**: Dribbble/Behance の参考と見比べ
3. **改善実施**:
   - タイポグラフィの調整（ウェイト、行間、文字間隔）
   - 色のニュアンス調整（彩度、明度）
   - スペーシングの統一（グリッドシステム）
   - 意味のあるアニメーション追加
4. **Polish Commit**: `style: polish UI for [component]`

---

## 7. アニメーション方針

### 原則
- **意味のあるアニメーション**: 状態変化を伝える目的で使用
- **過剰禁止**: 装飾目的の無意味なアニメーションは避ける
- **パフォーマンス**: transform と opacity を優先
- **アクセシビリティ**: prefers-reduced-motion / Reduce Motion を尊重

### プラットフォーム別実装

**Web (framer-motion)**
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
/>
```

**React Native (reanimated)**
```javascript
const animatedStyle = useAnimatedStyle(() => ({
  opacity: withTiming(isVisible ? 1 : 0),
  transform: [{ translateY: withSpring(isVisible ? 0 : 20) }],
}));
```

**Flutter**
```dart
AnimatedOpacity(
  opacity: isVisible ? 1.0 : 0.0,
  duration: Duration(milliseconds: 300),
  child: widget,
)
```

**SwiftUI**
```swift
Text("Hello")
  .opacity(isVisible ? 1 : 0)
  .animation(.easeInOut(duration: 0.3), value: isVisible)
```

---

## 8. UI/UX 品質基準

ExecPlan の自己評価に以下を追加：

| 基準 | 評価ポイント |
|------|-------------|
| **デザイン一貫性** | コンポーネント間でスタイルが統一されているか |
| **ユーザビリティ** | 直感的に操作できるか |
| **アクセシビリティ** | キーボード操作、スクリーンリーダー対応 |
| **パフォーマンス** | FCP, LCP（Web）/ 起動時間、フレームレート（モバイル） |
| **プラットフォーム適合** | 各OSのデザインガイドラインに沿っているか |

---

## 9. ブラウザ自動検証（Web のみ）

### 9.1 MCP Playwright 設定

各 AI ツールの MCP 設定に Playwright を登録する。設定ファイル名はツールごとに異なる:

- Claude Code: `.claude/mcp.json` または `~/.claude.json`
- Codex CLI: `.codex/config.toml`
- Cursor: `.cursor/mcp.json`

設定例（Codex CLI の TOML 形式）:

```toml
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@anthropic/mcp-playwright"]
tool_allowlist = [
    "browser_navigate",
    "browser_screenshot",
    "browser_click",
    "browser_fill",
    "browser_evaluate",
    "browser_select",
    "browser_hover",
    "browser_resize",
]
```

Claude Code / Cursor はそれぞれの JSON 形式で同等の設定を記述する。プロジェクト固有の設定は各ツールの公式ドキュメントを参照。

### 9.2 UI 検証ワークフロー

**Step 1: 開発サーバー起動**
```bash
npm run dev  # または yarn dev / pnpm dev
```

**Step 2: ページ確認とスクリーンショット取得**
```
# MCP Playwright を使用
browser_navigate → http://localhost:3000
browser_screenshot → 全体確認
```

**Step 3: レスポンシブテスト**
```
# モバイル（375px）
browser_resize → width: 375, height: 667
browser_screenshot → mobile_view.png

# タブレット（768px）
browser_resize → width: 768, height: 1024
browser_screenshot → tablet_view.png

# デスクトップ（1440px）
browser_resize → width: 1440, height: 900
browser_screenshot → desktop_view.png
```

**Step 4: インタラクション確認**
```
browser_hover → ボタン要素 → hover 状態確認
browser_click → ナビゲーション → 遷移確認
browser_fill → フォーム入力テスト
```

### 9.3 自動検証チェックリスト

各 UI コンポーネント実装後：

- [ ] デスクトップ（1440px）でスクリーンショット取得
- [ ] モバイル（375px）でスクリーンショット取得
- [ ] 主要なインタラクション（クリック、ホバー）の動作確認
- [ ] ダークモード対応の場合、両テーマでスクリーンショット取得
- [ ] 取得したスクリーンショットを Decision Log に参照記録

### 9.4 ビジュアルリグレッション防止

変更前後でスクリーンショットを比較：

1. 変更前のスクリーンショットを保存
2. 変更実施
3. 変更後のスクリーンショットを取得
4. 意図しない UI 変更がないか確認
5. 問題があれば即時修正

---

## 10. モバイルアプリの検証

### 10.1 シミュレーター/エミュレーター

**React Native / Expo**
```bash
# iOS
npx expo run:ios
# または
npx react-native run-ios --simulator="iPhone 15 Pro"

# Android
npx expo run:android
# または
npx react-native run-android
```

**Flutter**
```bash
# 利用可能なデバイス一覧
flutter devices

# 特定デバイスで実行
flutter run -d <device_id>
```

### 10.2 スクリーンショット取得（モバイル）

**iOS Simulator**
```bash
xcrun simctl io booted screenshot screenshot.png
```

**Android Emulator**
```bash
adb exec-out screencap -p > screenshot.png
```

### 10.3 複数デバイスサイズでのテスト

最低限以下のサイズでテスト：

| デバイス | サイズ | 用途 |
|----------|--------|------|
| iPhone SE | 375 x 667 | 小型スマートフォン |
| iPhone 15 Pro | 393 x 852 | 標準スマートフォン |
| iPhone 15 Pro Max | 430 x 932 | 大型スマートフォン |
| iPad | 768 x 1024 | タブレット |
| Pixel 7 | 412 x 915 | Android 標準 |

---

## 11. トラブルシューティング

### MCP Playwright が動作しない場合

1. **Node.js バージョン確認**: v18 以上が必要
2. **ブラウザインストール**: `npx playwright install chromium`
3. **ポート確認**: 開発サーバーが正しいポートで起動しているか

### スクリーンショットが取得できない場合

1. **URL 確認**: localhost の場合、`http://` を明示
2. **タイムアウト**: ページ読み込み完了を待つ
3. **ヘッドレスモード**: 環境によっては `headless: false` で確認
