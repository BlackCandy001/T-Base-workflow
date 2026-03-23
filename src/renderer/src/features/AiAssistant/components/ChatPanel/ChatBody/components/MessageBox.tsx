import React, { useState } from 'react'
import { RotateCcw, Check, Circle, Globe } from 'lucide-react'
import * as marked from 'marked'
import * as DOMPurify from 'dompurify'
import { CodeBlock } from '../../../CodeBlock'
import { Message } from '../types'
import {
  ParsedResponse,
  ToolAction,
} from '../../../../services/ResponseParser'
import FollowupOptions from './FollowupOptions'
import ToolActionsList from './ToolActions/index'
import QuestionBlock from './QuestionBlock'
import { ToolHeader } from '../../../ToolHeader'
import FileIcon from '../../../common/FileIcon'
import { isDiff, parseDiff } from '../../../../utils/diffUtils'
import DiagramBlock from './DiagramBlock'
import './MarkdownContent.css'

interface MessageBoxProps {
  message: Message
  parsedContent: ParsedResponse
  clickedActions: Set<string>
  failedActions?: Set<string>
  onToolClick: (
    action: ToolAction | ToolAction[],
    message: Message,
    index: number,
    type: 'accept_all' | 'accept_once' | 'reject'
  ) => void
  executionState?: {
    total: number
    completed: number
    status: 'idle' | 'running' | 'error' | 'done'
  }
  toolOutputs?: Record<string, { output: string; isError: boolean }>
  terminalStatus?: Record<string, 'busy' | 'free'>
  nextUserMessage?: Message
  allMessages?: Message[]
  activeTerminalIds?: Set<string>
  attachedTerminalIds?: Set<string>
  conversationId?: string
  previousAssistantMessage?: Message
  isGenerating?: boolean
  onRevert?: (messageId: string) => void
  isRawMode?: boolean
  onSendMessage?: (
    content: string,
    files?: any[],
    model?: any,
    account?: any,
    skipLogic?: boolean,
    actionIds?: string[],
    uiHidden?: boolean,
    thinking?: boolean
  ) => void
  onSelectOption?: (messageId: string, option: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  isLastMessage?: boolean
}

const MessageBoxCodeBlock: React.FC<{
  code: string
  language?: string
  maxLines?: number
  lineHighlights?: any
  diffStats?: { added: number; removed: number }
  isDiffBlock: boolean
  prefix?: string
  statusColor?: string
}> = ({
  code,
  language,
  maxLines,
  lineHighlights,
  diffStats,
  isDiffBlock,
  prefix,
  statusColor,
}) => {
  const [innerCollapsed, setInnerCollapsed] = useState(isDiffBlock)

  return (
    <div className="message-code-block">
      <ToolHeader
        title={prefix || language || 'code'}
        statusColor={statusColor}
        diffStats={diffStats}
        isCollapsed={innerCollapsed}
        onToggleCollapse={
          isDiffBlock ? () => setInnerCollapsed(!innerCollapsed) : undefined
        }
        headerActions={
          <div className="message-code-header-actions">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(code)
              }}
              title="Copy Code"
            >
              <div
                className="codicon codicon-copy"
                style={{ fontSize: '14px' }}
              />
            </button>
          </div>
        }
      />
      <div className="message-code-container">
        <CodeBlock
          code={code}
          language={language}
          maxLines={maxLines}
          isCollapsed={innerCollapsed}
          showLineNumbers={isDiffBlock}
          lineHighlights={lineHighlights}
        />
      </div>
    </div>
  )
}

const MessageBox: React.FC<MessageBoxProps> = ({
  message,
  parsedContent,
  clickedActions,
  failedActions,
  onToolClick,
  executionState,
  toolOutputs,
  terminalStatus,
  nextUserMessage,
  allMessages,
  activeTerminalIds,
  attachedTerminalIds,
  conversationId,
  previousAssistantMessage,
  isGenerating,
  onRevert,
  isRawMode,
  onSendMessage,
  onSelectOption,
  isLastMessage,
}) => {
  // User Message Logic
  const userMsgRegex = /## User Message\n```\n([\s\S]*?)\n```/
  const userMatch = message.role === 'user' ? message.content.match(userMsgRegex) : null
  
  let userDisplayContent = ''
  if (message.role === 'user') {
    userDisplayContent = userMatch
      ? userMatch[1]
      : message.content.replace(/^[\s\S]*?## User Message\n/, '')

    if (!userMatch && userDisplayContent.startsWith('```') && userDisplayContent.includes('```', 3)) {
      userDisplayContent = userDisplayContent.split('```')[1].trim()
    }
  }

  const isUserLongMessage = message.role === 'user' && (userDisplayContent.split('\n').length > 10 || userDisplayContent.length > 500)
  const [isMessageCollapsed, setIsMessageCollapsed] = useState(isUserLongMessage)

  if (message.role === 'user') {
    if (!userMatch && !message.content.includes('## User Message')) return null

    const truncatedContent = isUserLongMessage && isMessageCollapsed
      ? '...' + userDisplayContent.split('\n').slice(-5).join('\n')
      : userDisplayContent

    return (
      <div className={`message-bubble message-user ${message.isCancelled ? 'is-cancelled' : ''}`}>
        <div style={{ position: 'relative' }}>
          {onRevert && (
            <div className="revert-button" onClick={() => onRevert(message.id)}>
              <RotateCcw size={14} />
            </div>
          )}
          <div className="markdown-content" style={{ whiteSpace: 'pre-wrap' }}>{truncatedContent}</div>
          {isUserLongMessage && (
            <div onClick={() => setIsMessageCollapsed(!isMessageCollapsed)} className="show-more-toggle">
              {isMessageCollapsed ? 'Show more' : 'Show less'}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Assistant Message Logic
  return (
    <div className={`assistant-message-container ${message.isError ? 'is-error' : ''} ${message.isCancelled ? 'is-cancelled' : ''}`}>
      {!isRawMode ? (
        (() => {
          const blocks = parsedContent.contentBlocks || []
          let isInteractionBlocked = false

          const metaChanged = !previousAssistantMessage || 
            message.modelId !== previousAssistantMessage.modelId || 
            message.providerId !== previousAssistantMessage.providerId

          let metadataBlock: React.ReactNode = null
          if (metaChanged && (message.modelId || message.providerId)) {
            const providerStr = message.providerId ? `${message.providerId} / ` : ''
            const modelStr = message.modelId || 'Unknown Model'
            const emailStr = message.email ? ` (${message.email})` : ''
            const faviconUrl = message.providerId ? `https://www.google.com/s2/favicons?domain=${
              message.providerId === 'openai' ? 'openai.com' : 
              message.providerId === 'anthropic' ? 'anthropic.com' : 'google.com'
            }&sz=32` : null

            metadataBlock = (
              <div key="metadata" className="message-metadata">
                <div className="timeline-dot metadata-dot">
                  {faviconUrl ? (
                    <img src={faviconUrl} alt="provider" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <Globe size={10} color="var(--secondary-text)" />
                  )}
                </div>
                <div className="metadata-text">Running with {providerStr}{modelStr}{emailStr}</div>
              </div>
            )
          }

          return (
            <>
              {metadataBlock}
              {blocks.map((block, idx) => {
                const key = `${message.id}-block-${idx}`
                switch (block.type) {
                  case 'markdown': {
                    const html = (DOMPurify as any).sanitize ? (DOMPurify as any).sanitize(marked.parse(block.content)) : block.content
                    return (
                      <div key={key} className="message-bubble message-ai">
                        <div className={`timeline-dot ai-dot ${message.isError ? 'is-error' : ''}`} />
                        <div className="markdown-content-inline ai-content" dangerouslySetInnerHTML={{ __html: html }} />
                      </div>
                    )
                  }
                  case 'thinking':
                    return (
                      <div key={key} className="message-bubble message-thinking">
                        <div className="timeline-dot thinking-dot" />
                        <div className="thinking-wrapper">
                          <ToolHeader title="Thinking Process" isCollapsed={isMessageCollapsed} onToggleCollapse={() => setIsMessageCollapsed(!isMessageCollapsed)} />
                          {!isMessageCollapsed && <div className="thinking-content">{block.content}</div>}
                        </div>
                      </div>
                    )
                  case 'tool': {
                    const actionIndex = block.actionIndex ?? idx
                    const actionId = `${message.id}-action-${actionIndex}`
                    const content = (
                      <div key={key} className="message-bubble message-tool">
                        <div className="timeline-dot tool-dot" />
                        <div className="tool-wrapper">
                          <ToolActionsList
                            message={message}
                            items={[{ action: block.action, index: actionIndex }]}
                            clickedActions={clickedActions}
                            failedActions={failedActions}
                            onToolClick={onToolClick}
                            executionState={executionState}
                            toolOutputs={toolOutputs}
                            terminalStatus={terminalStatus}
                            nextUserMessage={nextUserMessage}
                            allMessages={allMessages}
                            activeTerminalIds={activeTerminalIds}
                            attachedTerminalIds={attachedTerminalIds}
                            conversationId={conversationId}
                            allActions={parsedContent.actions}
                            isBlockedByPrecedingInteraction={isInteractionBlocked}
                            isLastMessage={isLastMessage}
                          />
                        </div>
                      </div>
                    )
                    if (!clickedActions.has(actionId)) isInteractionBlocked = true
                    return content
                  }
                  case 'code': {
                    const diff = isDiff(block.content, block.language)
                    const parsed = diff ? parseDiff(block.content) : { code: block.content, lineHighlights: undefined, stats: undefined }
                    return (
                      <div key={key} className="message-bubble message-code">
                        <div className="timeline-dot code-dot" />
                        <div className="code-wrapper">
                          <MessageBoxCodeBlock
                            code={parsed.code}
                            language={diff ? 'python' : block.language || 'text'}
                            lineHighlights={parsed.lineHighlights}
                            diffStats={parsed.stats}
                            isDiffBlock={diff}
                            prefix={diff ? 'Edit' : undefined}
                          />
                        </div>
                      </div>
                    )
                  }
                  case 'file':
                    return (
                      <div key={key} className="message-bubble message-file">
                        <div className="timeline-dot file-dot" />
                        <div className="file-content-block">
                          <FileIcon path={block.content} size={16} />
                          <span className="file-name">{block.content.split(/[\\/]/).pop()}</span>
                        </div>
                      </div>
                    )
                  case 'task_progress':
                    return (
                      <div key={key} className="message-bubble message-task">
                        <div className="timeline-dot task-dot" style={{ backgroundColor: 'var(--accent-color)' }} />
                        <div className="task-wrapper">
                          <div className="task-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span className="task-badge">{block.items.filter(i => i.completed).length}/{block.items.length}</span>
                            <span className="task-title" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-text)', letterSpacing: '0.02em' }}>{block.taskName || 'Task Progress'}</span>
                          </div>
                          <div className="task-items-container">
                            {block.items.map((item, i) => (
                              <div key={i} className={`task-item ${item.completed ? 'completed' : ''}`}>
                                {item.completed ? <Check size={14} color="#10b981" strokeWidth={3} /> : <Circle size={14} color="var(--secondary-text)" strokeWidth={3} />}
                                <span>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  case 'mixed_content':
                    return (
                      <div key={key} className="message-bubble message-mixed">
                        <div className="timeline-dot mixed-dot" />
                        <div className="mixed-wrapper">
                          {block.segments.map((seg, i) => seg.type === 'code' ? 
                            <CodeBlock key={i} code={seg.content} language={seg.language || 'text'} /> :
                            <div key={i} className="markdown-content-inline" dangerouslySetInnerHTML={{ __html: (DOMPurify as any).sanitize(marked.parse(seg.content)) }} />
                          )}
                        </div>
                      </div>
                    )
                  case 'question':
                    return (
                      <div key={key} className="message-bubble message-question">
                        <div className="timeline-dot question-dot" />
                        <div className="question-wrapper">
                          <QuestionBlock
                            title={block.title || 'Question'}
                            options={block.options}
                            disabled={!!nextUserMessage || isGenerating}
                            selectedOption={message.selectedOption}
                            onOptionSelect={(option) => {
                              onSelectOption?.(message.id, option)
                              if (onSendMessage && !(parsedContent.actions?.length)) {
                                onSendMessage(`[Answer: ${option}]`, undefined, undefined, undefined, true)
                              }
                            }}
                          />
                        </div>
                      </div>
                    )
                  case 'diagram':
                    return (
                      <div key={key} className="message-bubble message-diagram">
                        <div className="timeline-dot diagram-dot" />
                        <div className="diagram-wrapper">
                          <DiagramBlock nodes={block.nodes} edges={block.edges} />
                        </div>
                      </div>
                    )
                  default: return null
                }
              })}
            </>
          )
        })()
      ) : (
        <div className="raw-message">
          <div className="timeline-dot" />
          {message.content}
        </div>
      )}

      {parsedContent.followupOptions && !parsedContent.contentBlocks.some(b => b.type === 'question') && (
        <div className="followup-wrapper" style={{ marginTop: '12px' }}>
          <FollowupOptions options={parsedContent.followupOptions} messageId={message.id} selectedOption={message.selectedOption} onOptionClick={(opt) => onSendMessage?.(opt)} />
        </div>
      )}
    </div>
  )
}

export default MessageBox
