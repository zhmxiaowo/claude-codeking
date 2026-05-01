---
name: learn
description: 经验提取。回顾当前对话，将有价值的隐性知识追加到项目根目录 experience.md。在 init-project、change、work 每轮任务完成后自动调用。
user-invocable: true
---

# 经验提取

回顾当前对话或当前任务的开发过程，将有价值的经验追加到项目根目录的 `experience.md`（与 CLAUDE.md 同级）。

> **架构说明**：experience.md 通过 CLAUDE.md 的 `@experience.md` 在 session 启动时一次性挂载到 system prompt，session 内所有 skill / agent 共享，永不重复 Read。所以经验内容**只能写入 experience.md，绝对不要再追加到 spec.md**。

## 提取维度

1. **用户偏好**：用户表达的编码风格、交互方式、审美偏好、明确拒绝的方案
2. **技术发现**：框架/库的特殊配置、已知 bug、API 陷阱、版本兼容性要求
3. **踩坑记录**：遇到的问题 + 解决方案（或规避方案）

## 执行步骤

1. 检查项目根目录 `experience.md` 是否存在：
   - **不存在**：创建文件，写入初始模板：
     ```markdown
     # 项目经验与约束

     > 由 /learn skill 自动维护。session 启动时通过 CLAUDE.md `@experience.md` 加载到 system prompt。
     > 不要在 work 循环里 Read 此文件 —— 它已经在 system prompt 里。

     ## 用户偏好

     ## 技术发现

     ## 踩坑记录
     ```
   - **存在**：跳过此步
2. 回顾本次对话/当前任务中的关键信息
3. 筛选：只保留对未来 session 有指导意义的内容，跳过以下：
   - spec.md / DESIGN.md / rules 已覆盖的信息
   - 已存在于 experience.md 的条目
   - 显而易见的常识
4. **如有新内容**：用 Edit 工具追加到 experience.md 对应子栏目（用户偏好 / 技术发现 / 踩坑记录）
   - 每条格式：`- [YYYY-MM-DD task#id] 内容描述`（无关联任务时省略 task#id）
   - **不独立 git commit**，由调用方（/init-project、/change、/work）统一提交
5. **如无新内容**：跳过，不输出任何内容，不做任何操作

## 独立调用时

如果用户手动运行 `/learn`（非被其他 skill 调用），则在 Step 4 后自行提交：
```bash
git add experience.md && git commit -m "chore: update experience notes"
```
如果 experience.md 无变更（git diff 为空），跳过提交。

## 重要约束

- **绝对不要 Read experience.md 全文** —— 它已经在 system prompt 里。Edit 追加内容时直接定位末尾或对应子栏目即可。
- **绝对不要把经验写进 spec.md** —— 这会导致 spec.md 膨胀，破坏 @import 的优化收益。
- 旧项目如果 spec.md 已经有「经验与约束」章节，**保留不动**，新经验全部写入 experience.md；后续可由用户手动迁移。
