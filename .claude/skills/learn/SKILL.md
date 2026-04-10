---
name: learn
description: 经验提取。回顾当前对话，将有价值的隐性知识追加到 spec.md 的「经验与约束」章节。在 init-project、change、work 每轮任务完成后自动调用。
user-invocable: true
---

# 经验提取

回顾当前对话或当前任务的开发过程，将有价值的经验追加到 spec.md 的「经验与约束」章节。

## 提取维度

1. **用户偏好**：用户表达的编码风格、交互方式、审美偏好、明确拒绝的方案
2. **技术发现**：框架/库的特殊配置、已知 bug、API 陷阱、版本兼容性要求
3. **踩坑记录**：遇到的问题 + 解决方案（或规避方案）

## 执行步骤

1. 读取当前 `spec.md`，重点查看「经验与约束」章节已有条目
2. 回顾本次对话/当前任务中的关键信息
3. 筛选：只保留对未来 session 有指导意义的内容，跳过以下内容：
   - spec.md 其他章节已覆盖的信息
   - 已存在于「经验与约束」中的条目
   - 显而易见、不需要记录的常识
4. **如有新内容**：追加到 spec.md 对应子栏目（用户偏好 / 技术发现 / 踩坑记录）
   - 每条格式：`- [YYYY-MM-DD task#id] 内容描述`（无关联任务时省略 task#id）
   - **不独立 git commit**，由调用方（/init-project、/change、/work）统一提交
5. **如无新内容**：跳过，不输出任何内容，不做任何操作

## 独立调用时

如果用户手动运行 `/learn`（非被其他 skill 调用），则在 Step 4 后自行提交：
```bash
git add spec.md && git commit -m "chore: update experience notes"
```
如果 spec.md 无变更（git diff 为空），跳过提交。
