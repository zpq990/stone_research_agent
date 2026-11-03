# 项目开发指南

> 根目录 `CLAUDE.md` 通过 `@docs/CLAUDE.md` 导入本文件。

## Project overview

「石头」是一个纯静态的 AI 调研产品单页原型：用户输入一个陌生主题，页面展示一份「每个结论都能复查」的调研文档，并用几秒钟演示拆题、检索、验证、成稿的过程。全部文案为中文（`lang="zh-CN"`），没有后端、AI 接口或数据存储，交互均为前端模拟。

核心承诺是可信而非快：示例报告里出现「14 个一手信源」「3 处标出的分歧」「置信度：中」等可检查的数量。页面上的报告、信源、机构判断均为结构示例，不是真实调研结果。

没有构建步骤、包管理、依赖、测试或 lint 工具。源码是 `index.html`（全部结构与文案）、`assets/styles.css`（视觉系统）、`assets/app.js`（交互），外加自托管字体和两张 Unsplash 照片。

## Commands

```bash
# 直接查看：双击 index.html，或启动静态服务器
python -m http.server 4173 --bind 127.0.0.1
# 访问 http://127.0.0.1:4173
```

部署为 Vercel 静态站点（`.vercel/project.json` 已关联项目）。`.vercel/` 被 `.gitignore` 忽略，其中的 `.vercel/output/` 是生成的静态构建产物（含 `index.html`、`assets/` 的副本），不要手改——修改源码不会自动同步到那里。

## Page structure

单页从上到下只有六块，对应首页改版建议的「留一个足够深的例子，删掉泛泛的解释」：

1. `#top`：Hero。H1「从完全陌生，到有自己的判断。」+ 一句说明 + 主表单 + 4 个快捷主题，右侧是 `.report-peek` 报告缩略卡（只露最有力的三条判断）。
2. `#report`：完整示例报告。左侧 `.report-margins` 是出处 / 分歧 / 置信度三条读法，右侧 `.report-doc` 是完整文档（摘要、核心判断、带出处的结论、A/B 分歧、置信度、信源）。
3. `.material-band`：两张本地照片（海边石墙、雾中林地）+ 一句收束文案，作为报告与方法之间的呼吸段。
4. `#method`：深色胡桃木区块，三个动作：拆问题 → 找证据 → 分歧不抹平、写成文档。
5. `#faq`：3 条原生 `<details>`（一次调研包含什么 / 可信吗 / 和搜索有什么区别），同时只开一条。
6. `#start`：第二个输入框 + CTA；页脚一行品牌语、导航、版权和照片署名。

旧的 marquee、Problem 三卡、Topics 六卡、Manifesto、四步时间轴、报告标签页均已删除。所有「60 分钟 / 一小时」叙事已移除；不要再把它们写回来。

## Architecture

### HTML/JS contract via `data-*` attributes

`index.html` 里的 `data-*` 属性就是 `app.js` 的接线层：`data-header`、`data-nav-toggle`、`data-mobile-nav`、`data-research-form`（页面有两个）、`data-topic`、`data-open-research`、`data-run-view`、`data-result-view`、`data-run-topic`、`data-doc-topic`、`data-doc-date`、`data-run-phase`、`data-run-percent`、`data-progressbar`、`data-progress-fill`、`data-run-step`、`data-skip-run`、`data-print`、`data-reset`、`data-close-dialog`。

新增交互时必须同时改 HTML 属性与 `app.js` 中对应小节；状态类只用于样式：`is-scrolled`、`is-visible`、`is-active`、`is-done`、`is-invalid`、`is-locked`、`is-printing`。

### Research dialog state machine

`#research-dialog` 是原生 `<dialog>`，内部有两个互斥视图：

- `[data-run-view]`：模拟调研。`startRun(topic)` 把主题写入所有 `[data-run-topic]` / `[data-doc-topic]`，按 320 / 640 / 960 / 1280ms 推进「界定边界 → 检索与阅读 → 交叉验证 → 组织文档」，进度到 100% 后 340ms 调用 `revealResult()`；`prefers-reduced-motion` 下阶段压到 ≤120ms、结果延迟 60ms。
- `[data-result-view]`：文档预览。`[data-skip-run]` 直接跳过演示。

所有定时器存入 `timerIds`，关闭弹窗（`close` / `cancel` / 关闭按钮 / 点击 backdrop）时由 `clearTimers()` 清理。

页面有两个 `[data-research-form]`：Hero 的主表单和第二屏 CTA。每个表单提交时读取**自己**的输入框，空值时显示自己的 `.field-error`，不打开弹窗；`[data-open-research]` 按钮与快捷主题始终操作 Hero 主表单。「再研究一个」关闭弹窗并清空两个输入框。

### Printing

`[data-print]` 先给 `body` 加 `is-printing` 再调用 `window.print()`。打印样式依赖这个类：除 `.research-dialog` 外整页隐藏，并隐藏 `.dialog-header`、`.result-toolbar`、`.run-view`，把 `.generated-doc` 展开为普通文档流。不要移除这段 JS/CSS 的配合。

### Scroll reveal

`.reveal` 元素由 `IntersectionObserver` 添加 `.is-visible`；隐藏样式是 `.js .reveal { opacity: 0 }`，显示由 `.js .reveal.is-visible` 上的 `revealUp` keyframe 完成（`.d1` / `.d2` 使用 animation-delay 错开）。`<head>` 内联脚本先加 `html.js`，保证无 JS 时内容仍可见。开启 `prefers-reduced-motion` 时 JS 直接给所有 `.reveal` 加 `is-visible`，CSS 同时关闭动画。新增 `.reveal` 区块会在初始化时被收集，动态插入的元素不会被观察。

### Other interactions

- FAQ：原生 `<details class="faq-item">`，监听 `toggle` 以同时只展开一项。
- 移动端菜单：`aria-expanded` / `aria-hidden` 同步；点击外部、Escape、窗口宽度 >960px 时关闭。
- 主题快捷词：填入 Hero 输入框并滚动到表单；只清错误，不自动提交。

## CSS conventions

- 设计令牌集中在 `:root`：纸张 / 石灰 `--paper*`、`--stone`、墨色 `--ink*`、`--muted*`、胡桃木 `--walnut*`、`--cream`、深色区块 `--dark-*`、`--seal-ink`；字体栈 `--serif` / `--sans`；字号阶梯 `--t-small` / `--t-body` / `--t-lead` / `--t-head` / `--t-display`；布局 `--max: 1240px`、`--gutter`、`--ease`。
- 单文件约 2,200 行，用 `/* ---------- 区块名 ---------- */` 横幅按页面区块排列；新增规则放到对应区块，而不是文件末尾。
- 响应式断点：1120px、960px（移动导航切换、Hero 与报告单列）、700px（表单竖排、照片单列）、520px（内边距收紧）；末尾是 `prefers-reduced-motion` 与 `@media print` 两个全局块。
- 中文衬线/无衬线字体是自托管 Noto 子集（`assets/fonts/*.woff2`，OFL 1.1）。子集外的字符会回退到系统字体，大量新增中文文案时注意视觉一致性。
- 风格约束：简约木质风。不要引入 lime / orange 强调色、monospace 小标签、渐变、外发光、细分割线或彩色阴影；层级用纸色 / 石色 / 胡桃木的填充块和留白表达。表单控件的边框和弹窗遮罩是少数合法例外，已在 CSS 中标注 `taste-skill-ignore`。

## Assets

- `assets/images/stone-wall.jpg`：Jill Heyer / Unsplash；`assets/images/fog-forest.jpg`：Paul Jarvis / Unsplash。均已本地化，署名同时出现在图注和页脚；替换时同步更新两处。
- `assets/fonts/noto-serif-sc-subset.woff2`、`noto-sans-sc-subset.woff2`：OFL 1.1 子集。
- 品牌标记是页头、页脚、弹窗共用的内联 SVG 印章（深色圆角方块 + 米色「石」形笔画），颜色走 `currentColor` / `--seal-ink`。

## Product constraints

页面明确标注「当前为交互原型」。示例报告、进度阶段、文档结论、信源和机构判断都是演示内容，不要描述为真实调研结果，也不要编造客户、评价、媒体或业务数据。下一步接入后端任务、SSE 进度、结构化报告与 PDF 导出前，需要先新增后端，当前项目没有相应基础设施。

上级目录 `../../_acl-recovery_my-first-website/` 是 Windows ACL 修复工具留下的环境产物，不属于项目源码，忽略即可。
