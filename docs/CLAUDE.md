# 项目开发指南

> 根目录 `CLAUDE.md` 通过 `@docs/CLAUDE.md` 导入本文件。

## Project overview

「石头」是一个纯静态的 AI 调研产品单页原型：用户输入一个陌生主题，页面展示一份「每个结论都能复查」的调研文档，并用几秒钟演示拆题、检索、验证、成稿的过程。全部文案为中文（`lang="zh-CN"`），没有后端、AI 接口或数据存储，交互均为前端模拟。

核心承诺是可信而非快：示例报告把核心判断、出处、把握程度和一处 A/B 分歧放在同一份文档里；页面上的报告、信源、机构判断均为结构示例，不是真实调研结果。对外文案统一说「把握」，「置信度」「数据权重」不出现在用户可见文案里。

正式口径以 `document/项目方向定稿.md` 为准；`docs/` 只放草稿、建议与会话记录。后续产品说明、用户手册、部署文档也放 `document/`。

没有构建步骤、包管理或运行时依赖。源码是 `index.html`（全部结构与文案）、`assets/styles.css`（视觉系统）、`assets/app.js`（交互），外加自托管字体和四张本地照片。`.taste-skill/verify.mjs` 是开发期的交互验收脚本，不参与部署。

## Commands

```bash
# 直接查看：双击 index.html，或启动静态服务器
python -m http.server 4173 --bind 127.0.0.1
# 访问 http://127.0.0.1:4173
```

```bash
# 交互验收：23 项检查，需要 Node 22+ 与本机 Chrome/Edge
node .taste-skill/verify.mjs

# 视觉静态扫描与真实浏览器检查（design-taste-frontend skill）
node "$HOME/.claude/skills/design-taste-frontend/scripts/lint.mjs" .
node "$HOME/.claude/skills/design-taste-frontend/scripts/inspect.mjs" index.html
```

`verify.mjs` 覆盖导航顺序、折叠互斥、hash 直达、FAQ 单开、表单校验、弹窗流程、打印、移动菜单和减少动效；`inspect.mjs` 的截图与报告写到 `.taste-skill/inspect/`。两者都是开发辅助，不是项目依赖。

部署为 Vercel 静态站点（`.vercel/project.json` 已关联项目）。`.vercel/` 被 `.gitignore` 忽略，其中的 `.vercel/output/` 是生成的静态构建产物（含 `index.html`、`assets/` 的副本），不要手改——修改源码不会自动同步到那里。

## Page structure

单页从上到下是：页头、Hero、对照区、折叠区、材料带、页脚，另加一个调研弹窗。三段主要内容放在折叠里，默认全部收起；Hero 与对照区常显：

1. 页头：品牌标识与副标「AI 调研 agent」、三个导航链接（示例报告 / 怎么做 / 常见问题）和移动端菜单，没有 CTA 按钮。
2. `#top`：Hero。H1「给我一个陌生主题，还你一份有出处的报告。」+ 一句口语化说明 + 唯一的主题表单 + 4 个快捷主题；右侧 `.hero-report` 是样本报告摘录卡（核心判断 / 来源 / 把握 / 分歧 / 展开链接），不再是照片。
3. `.contrast`：常显的「通用 agent vs 石头」五行对照表（开始、过程、证据、冲突、不确定），标题「不是多查一点，是先把范围定清楚。」对照表是原生 `<table>`，移动端隐藏表头并在单元格前用 `data-label` 显示列名。
4. `.fold-stack[data-fold-group]`：三个 `<details class="fold">`，顺序必须与页头/页脚导航一致：
   - `#report`（示例报告）：完整样本报告——执行摘要、核心判断及出处、A/B 分歧、把握程度、信源列表。
   - `#method`（怎么做）：`class="fold fold--dark"`，胡桃木深色区块，三个 `.exchange` 动作：拆问题 → 找证据 → 标分歧并写成文档。
   - `#faq`（常见问题）：3 条 `.faq-item`，同时只开一条。
5. `.material-band`：`.material-strip` 四张本地照片（海边石墙、雾中林地、多尔多涅老石墙、碎石小路）+ `.material-copy` 一句收束文案和示例声明。图注只写画面内容，署名集中在页脚。
6. `.site-footer`：品牌语、导航、版权、照片署名。
7. `#research-dialog`：调研弹窗，包含互斥的 `[data-run-view]` 与 `[data-result-view]`。

旧的 marquee、Problem 三卡、Topics 六卡、Manifesto、四步时间轴、报告标签页、第二个 CTA 表单均已删除。所有「60 分钟 / 一小时」叙事已移除；不要再把它们写回来。

## Architecture

### HTML/JS contract via `data-*` attributes

`index.html` 里的 `data-*` 属性就是 `app.js` 的接线层：`data-header`、`data-nav-toggle`、`data-mobile-nav`、`data-fold-group`、`data-research-form`（页面只有一个）、`data-topic`、`data-run-view`、`data-result-view`、`data-run-topic`、`data-doc-topic`、`data-doc-date`、`data-run-phase`、`data-run-percent`、`data-progressbar`、`data-progress-fill`、`data-run-step`、`data-skip-run`、`data-print`、`data-print-area`、`data-reset`、`data-close-dialog`。

新增交互时必须同时改 HTML 属性与 `app.js` 中对应小节；状态类只用于样式：`is-scrolled`、`is-visible`、`is-active`、`is-done`、`is-invalid`、`is-locked`、`is-printing`。

### Fold sections

折叠是页面的主结构，由 `app.js` 的「Fold sections」小节维护：

- `folds` 只收集 `[data-fold-group]` 的直接子级 `:scope > details.fold`。新增折叠必须放在 `.fold-stack` 内，并给它 `id` 与对应导航链接。
- 每个 fold 监听 `toggle`：展开时关闭其他 fold。点击 `<summary>` 走的是同一套逻辑。
- 所有以 `#` 开头的链接都会被拦截；目标是 `details.fold` 时，先 `openFold(target)`，再用 `history.replaceState` 更新 hash，最后 `scrollIntoView`。`file://` 下历史更新可能失败，已用 `try/catch` 包住，折叠仍会打开。
- 加载时与 `hashchange` 时，`openFoldFromHash()` 会展开与 hash 匹配的 fold。
- **`.fold:not([open]) > .fold-body { display: none; }` 不能删。** 关闭的 `<details>` 内容，Chrome 仍可能参与布局与绘制；显式移出布局后，折叠背后的文字才不会进入对比度、行宽等测量，也避免被误判为「被遮挡的文字」。
- 深色方法区必须写 `fold--dark`（双连字符），不是 `fold-dark`。写错时 CSS 不命中，区块会变成浅色。

### Research dialog state machine

`#research-dialog` 是原生 `<dialog>`，内部有两个互斥视图：

- `[data-run-view]`：模拟调研。`startRun(topic)` 把主题写入所有 `[data-run-topic]` / `[data-doc-topic]`，按 320 / 640 / 960 / 1280ms 推进「界定边界 → 检索与阅读 → 交叉验证 → 组织文档」，进度到 100% 后 340ms 调用 `revealResult()`；`prefers-reduced-motion` 下阶段压到 ≤120ms、结果延迟 60ms。
- `[data-result-view]`：文档预览。`[data-skip-run]` 直接跳过演示。

所有定时器存入 `timerIds`，关闭弹窗（`close` / `cancel` / 关闭按钮 / 点击 backdrop）时由 `clearTimers()` 清理。

页面只有一个 `[data-research-form]`（Hero）。提交时读取它自己的输入框，空值显示 `.field-error` 且不打开弹窗；快捷主题只填入 Hero 输入框、清错误并聚焦，不自动提交。「再研究一个」关闭弹窗、清空输入并回到表单。

### Printing

`[data-print]` 先给 `body` 加 `is-printing` 再调用 `window.print()`。打印样式依赖这个类：除 `.research-dialog` 外整页隐藏，并隐藏 `.dialog-header`、`.result-toolbar`、`.run-view`，把 `.generated-doc` 展开为普通文档流。不要移除这段 JS/CSS 的配合。

### Scroll reveal

`.reveal` 元素由 `IntersectionObserver` 添加 `.is-visible`；隐藏样式是 `.js .reveal { opacity: 0 }`，显示由 `.js .reveal.is-visible` 上的 `revealUp` keyframe 完成（`.d1` / `.d2` 使用 animation-delay 错开）。`<head>` 内联脚本先加 `html.js`，保证无 JS 时内容仍可见。开启 `prefers-reduced-motion` 时 JS 直接给所有 `.reveal` 加 `is-visible`，CSS 同时关闭动画。新增 `.reveal` 区块会在初始化时被收集，动态插入的元素不会被观察。

### Other interactions

- FAQ：原生 `<details class="faq-item">`，监听 `toggle` 以同时只展开一项。
- 移动端菜单：`aria-expanded` / `aria-hidden` 同步；点击外部、Escape、窗口宽度 >960px 时关闭。
- 主题快捷词：只清错误、填入表单并聚焦，不自动提交。

## CSS conventions

- 设计令牌集中在 `:root`：纸张 `--paper*`、石色 `--stone`、墨色 `--ink*`、`--muted*`、胡桃木 `--walnut*`、`--cream`、深色区块 `--dark-line` / `--dark-surface`、印章色 `--seal-ink`；字体栈 `--serif` / `--sans`；字号阶梯 `--t-small` / `--t-body` / `--t-lead` / `--t-head` / `--t-display`；布局 `--max: 1240px`、`--gutter`、`--ease`。
- 单文件约 2,240 行，用 `/* ---------- 区块名 ---------- */` 横幅按页面区块排列；新增规则放到对应区块，而不是文件末尾。
- Hero：`.hero` 是左右两栏；右侧 `.hero-report` 是纸色报告摘录卡，不再是图片。`--t-display` 为 `clamp(1.95rem, 1rem + 2.45vw, 3.25rem)`，保证 H1 在 1440–390px 都是两行（两行各有 11 个汉字，改动 H1 文案后需重新量行数）。
- 对照区：`.contrast-inner` 左标题右表格；`.contrast-table` 用原生 `<table>`，`thead` 为胡桃木深色，`tbody` 隔行用 `--paper` 区分。700px 以下表格改为块级堆叠，隐藏 `thead`，用 `td[data-label]::before` 显示「通用 agent / 石头」。
- 折叠区：`.fold-stack` 纵向排列；`.fold-summary` 桌面是三列（标签 / 标题+说明 / 加号），700px 以下改为 `grid-template-areas` 的堆叠布局。展开动画是 `foldIn`，加号由 `.fold-toggle::after` 旋转。
- 材料带：`.material-strip` 四列等宽，图片 `object-fit: cover` 并有 30s 的轻微 `imageDrift`；图注只显示画面标题，署名统一放页脚。700px 以下改为 2×2 排列。
- 响应式断点：1120px、960px（移动导航切换、Hero 单列、对照区单列）、700px（表单竖排、折叠标题堆叠、对照表堆叠、照片带 2×2）、520px（内边距收紧）；末尾是 `prefers-reduced-motion` 与 `@media print` 两个全局块。
- 中文衬线/无衬线字体是自托管 Noto 子集（`assets/fonts/*.woff2`，OFL 1.1），`@font-face` 族名为 `"Stone Serif"` / `"Stone Sans"`。子集外的字符会回退到系统字体，大量新增中文文案时注意视觉一致性。
- 风格约束：简约木质风。不要引入 lime / orange 强调色、monospace 小标签、渐变、外发光、细分割线或彩色阴影；层级用纸色 / 石色 / 胡桃木的填充块和留白表达。表单控件的边框和弹窗遮罩是少数合法例外，已在 CSS 中标注 `taste-skill-ignore`。

## Assets

- `assets/images/stone-wall.jpg`：Jill Heyer / Unsplash；`fog-forest.jpg`：Paul Jarvis / Unsplash；`stone-wall-dordogne.jpg`：Jebulon / CC0；`stone-path.jpg`：Billy McCrorie / geograph，CC BY-SA 2.0。均已本地化；图注只写画面内容，完整署名集中在页脚，替换时同步更新页脚。
- `assets/fonts/noto-serif-sc-subset.woff2`、`noto-sans-sc-subset.woff2`：OFL 1.1 子集。
- 品牌标记是页头、页脚、弹窗共用的内联 SVG 印章（深色圆角方块 + 米色「石」形笔画），颜色走 `currentColor` / `--seal-ink`。

## Tool findings

最近一次验收（2026-11-03）：`verify.mjs` 23/23 通过；`lint.mjs` 0 FAIL、1 WARN（`padStart(2, "0")` 日期补零，属正常用法）；`inspect.mjs` 0 FAIL、3 WARN，均为可解释的基线：

- `palette-cream`：石色纸面 `#f3f1ed` 在 768 / 390px 被误判为奶油底色；页面底色是 `#e7e5e1`，纸面是低彩度石色，不是黄色奶油。
- `no-footage`：没有真实可用的视频素材；四张本地照片承担材料质感。
- `font-not-dealt`：自托管 Noto 子集是中文品牌字体，draw 给出的西文字体不适合中文正文。

不要为了消掉这些 WARN 去改结构或加不真实的素材；如果页面的实际结构变了，再重新评估。

## Product constraints

页面明确标注「当前为交互原型」。示例报告、进度阶段、文档结论、信源和机构判断都是演示内容，不要描述为真实调研结果，也不要编造客户、评价、媒体或业务数据。下一步接入后端任务、SSE 进度、结构化报告与 PDF 导出前，需要先新增后端，当前项目没有相应基础设施。

上级目录 `../../_acl-recovery_my-first-website/` 是 Windows ACL 修复工具留下的环境产物，不属于项目源码，忽略即可。
