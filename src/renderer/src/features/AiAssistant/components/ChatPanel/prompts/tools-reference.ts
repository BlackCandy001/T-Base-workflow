// @ts-nocheck
export const TOOLS_REFERENCE = `# TOOLS REFERENCE

## File Operations

\`\`\`
read_file(file_path, start_line?, end_line?)
  -> STOP response immediately after — wait for content before editing.

write_to_file(file_path, content)
  -> Create or fully overwrite. Use for: new files, complete rewrites, small files.

replace_in_file(file_path, diff)
  -> Targeted patch. Requires prior read_file in previous turn.
  -> Format:
      <<<<<<< SEARCH
      exact_code_with_original_indentation
      =======
      replacement_code
      >>>>>>> REPLACE
  -> Multiple SEARCH/REPLACE blocks allowed in one call.
  -> Default choice for editing existing files.

list_files(folder_path, recursive?, type?)
  -> type: 'file' | 'directory' | undefined

search_files(folder_path, regex)
  -> Max 2 attempts -> then ASK user.

ask_bypass_gitignore(path)
  -> Request temporary gitignore bypass. Read .gitignore first to confirm rule.
\`\`\`

## Execution

\`\`\`
run_command(command)
  -> Executes DIRECTLY on user's machine. Output returned live. NOT simulated.
\`\`\`

## Context Management

\`\`\`
read_workspace_context()
  -> Read workspace.md

update_workspace_context(diff)
  -> Update workspace.md (same SEARCH/REPLACE format as replace_in_file)

<conversation_name>Title</conversation_name>
  -> Set conversation title (use in first response only)
\`\`\`

## Diagnostic Tools

\`\`\`
get_file_outline(file_path)
  -> Structure (classes, functions, exports) without reading full content.
  -> USE FIRST on large/unfamiliar files. Then: read_file(file, start_line, end_line).

get_symbol_definition(symbol, file_path?)
  -> Find where a function/class/type is defined.
  -> Prefer over full-file read when only the definition is needed.

get_references(symbol, file_path?)
  -> Find ALL usages across the project.
  -> REQUIRED before any rename/refactor/delete.
\`\`\`

## Workflow Manipulation (T-Base Workflow)

The assistant can model and generate professional workflows using 21 specialized node types. 

**Core Node Schema**:
- **id**: Unique string (e.g., "1", "trigger-1")
- **type**: One of the 21 strings listed below
- **position**: { x: number, y: number } (Spacing: ~150-300px)
- **data**: Configurable metadata (varies by type)

| Type | Data Schema (Common Fields) | Purpose |
|------|-------------|---------|
| **TriggerNode** | { label, type: "Manual" | "External" } | Start of a process |
| **TaskNode** | { title, description, deadline, progress: 0-100 } | A concrete action item |
| **DecisionNode** | { label, description } | Branching logic. **Handles: "true" (Right) / "false" (Bottom)** |
| **AiNode** | { label, provider, model } | Automated AI step |
| **ApiNode** | { label, endpoint, method, params } | External integration |
| **MemberNode** | { name, role, email, avatar? } | Assign to a person |
| **DatabaseNode** | { label, table, query } | Data persistence |
| **NotificationNode** | { label, channel: "Email" | "Slack", message } | Inform users |
| **LoopNode** | { label, condition, iteration } | Repetitive process |
| **GroupNode** | { label, description } | Visual container for other nodes |
| **LabelNode** | { text } | Plain text annotation |
| **NoteNode** | { content } | Post-it style note |
| **ExitNode** | { label, reason } | End of a process |
| **ProgressNode** | { label, percentage: 0-100 } | Visual progress tracker |
| **ProjectNode** | { name, status, owner } | Link to a sub-project |
| **TeamNode** | { name, department } | Assign to a department |
| **PermissionNode** | { label, scope, role } | Access control step |
| **CalculationNode** | { label, formula, result } | Mathematical operation |
| **ConfigNode** | { key, value, env } | Environment settings |
| **FileNode** | { name, type, path } | Document/File reference |
| **DelayNode** | { duration, unit: "ms" | "s" | "m" } | Pause the execution |

**Tools**:
\`\`\`
draw_workflow(workflow_nodes, workflow_edges)
  -> Redraw the entire workflow canvas.
  -> workflow_nodes: Array of workflow Node objects { id, type, position, data }
  -> workflow_edges: Array of workflow Edge objects { id, source, target, label?, sourceHandle?, data? }

add_node(type, position, data)
update_node(id, position?, data?)
delete_node(id)
add_edge(source, target, label?, sourceHandle?, data?)
delete_edge(id)
\`\`\`

**Connection Rules**:
- Connect nodes using \`add_edge\` or \`draw_workflow\` edges.
- For **DecisionNode**, you MUST specify \`sourceHandle: "true"\` or \`sourceHandle: "false"\` to map the branching logic correctly.

\`\`\`

| Situation | Tool |
|-----------|------|
| Large file, find specific function | \`get_file_outline\` -> \`read_file(start, end)\` |
| Unknown class/function location | \`get_symbol_definition\` |
| Before rename/refactor/delete | \`get_references\` |
| Understand file structure | \`get_file_outline\` |

---

## Response Tags

\`\`\`xml
<thinking>
  MANDATORY. Every response starts here.
  Plan actions, analyze code, reason through problems.
</thinking>

<markdown>
  Conversational output. Headers, tables, task lists, prose.
  Use <file>path/to/file</file> to cite files.
  Required for all questions. MAY include tool calls.
</markdown>

<code language="typescript">
  Read-only code display (examples, references only).
</code>

<task_progress>
  Tracks complex/multi-step tasks. Skip for trivial tasks.
</task_progress>
\`\`\`

## Tag Rules

| DO | DON'T |
|----|-------|
| Use \`<markdown>\` + \`<question>\` for decisions | Play-by-play commentary ("I will now read X") |
| Batch all independent ops in one message | Batch ops with dependencies |
| Skip tags when tool call is self-explanatory | Retry same failed search >2 times |
`;
