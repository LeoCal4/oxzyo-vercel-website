import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

type Props = {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: Props) {
  return (
    <div className={cn('prose prose-neutral max-w-none', className)}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
