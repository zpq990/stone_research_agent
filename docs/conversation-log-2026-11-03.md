# 对话记录摘要 · 2026-11-03

> 本文是会话要点摘要，不是逐字转录。完整建议见 [content-refresh-recommendations.md](content-refresh-recommendations.md)。
>
> 历史记录：文中「知野 ZHIYE」「5 块结构」「页面代码未做修改」等描述均为当天状态；后续品牌已改为「石头」，页面也已改为折叠结构，文案与术语已定稿。当前实现以 [CLAUDE.md](CLAUDE.md) 和 `index.html` 为准，正式方向与文案口径以 `document/项目方向定稿.md` 为准。

## 1. 项目扫描

- 使用 `/init` 扫描项目并生成项目开发指南。
- 结论：纯静态单页原型「知野 ZHIYE」，无构建、无依赖、无测试；源码为 `index.html` + `assets/app.js` + `assets/styles.css`，内容全为中文。
- 架构要点：`data-*` 属性作为 HTML/JS 接线层；调研弹窗为双视图状态机；打印依赖 `body.is-printing`；滚动 reveal 依赖 `html.js`；CSS 单文件分区，断点 1120/960/700/390/350。
- 产物：`docs/CLAUDE.md`（原根目录 `CLAUDE.md`），根目录保留同名入口文件并导入本文件。

## 2. 首页改版意见

用户要求：保留调研主题，但去掉“一小时”叙事；内容精简，用例子或文案吸引人。明确表示先不改代码。

### 标题

推荐主标题：

> 从完全陌生，到有自己的判断。

推荐 title：

> 知野 ZHIYE — 陌生领域，也要有自己的判断

理由：主打时间会被拿去和 ChatGPT / Perplexity 比速度；应把核心承诺从「快」换成「可信」（出处可查、能看到分歧）。用已有数字补位：14 个一手信源、3 处标出的分歧、置信度。

备选标题分为判断向、证据向、品牌向三组，详见建议文档。

### 内容精简

- 保留 5 块：Hero、一份完整示例报告、3 步方法、CTA、最多 3 条 FAQ。
- 删除：Marquee、Problem 三卡、Method 时间轴长文、Deliverable 六标签、Topics 六卡、Manifesto。
- 示例只做两次：Hero 露一行结论，示例区完整展开一份“固态电池”文档，具体到信源、日期、分歧与置信度。
- 时间文案散布在 `index.html` 约 20 处、`README.md` 2 处，已列清单。

### 附带影响

去掉时间叙事后，弹窗 2.8 秒四阶段进度演示失去意义，建议缩短或直接展示文档。

## 3. 文档整理

- 改版建议已记录为 `docs/content-refresh-recommendations.md`。
- 按用户要求，将所有文档与会话记录集中到 `docs/`：
  - `docs/README.md`（原根目录 `README.md`）
  - `docs/CLAUDE.md`（原根目录 `CLAUDE.md`）
  - `docs/content-refresh-recommendations.md`
  - 本文件
- 根目录 `CLAUDE.md` 保留为入口，内容为一行 `@docs/CLAUDE.md` 导入，确保 Claude Code 仍能自动加载指南。
- `assets/fonts/OFL.txt` 是字体许可证，按许可要求保留在字体文件旁，未移动。
- `.vercel/` 为生成产物，不在文档整理范围内。

## 4. 当前状态

- 页面代码（`index.html`、`assets/*`）未做任何修改。
- 待办：确认标题方向后，按 5 块结构产出具体文案与页面结构草案；随后统一清理时间文案。
