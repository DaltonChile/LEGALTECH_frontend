import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { CheckCircle, Info } from 'lucide-react';

interface RichDescriptionProps {
  content: string;
  className?: string;
}

export function RichDescription({ content, className }: RichDescriptionProps) {
  // Si el contenido no tiene formato markdown (sin ## o - ), mostrarlo como texto plano
  const hasMarkdown = content.includes('##') || content.includes('- ') || content.includes('**') || content.includes('`badge:');
  
  if (!hasMarkdown) {
    return (
      <div className={`rich-description ${className || ''}`}>
        <p className="text-slate-700 leading-relaxed font-sans whitespace-pre-line">
          {content}
        </p>
      </div>
    );
  }

  return (
    <div className={`rich-description ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h2: ({ children, ...props }) => (
            <h2 
              className="text-xl font-serif font-bold text-navy-900 mb-3 mt-6 first:mt-0 flex items-center gap-2" 
              {...props}
            >
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 
              className="text-lg font-serif font-semibold text-navy-800 mb-2 mt-4" 
              {...props}
            >
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p 
              className="text-slate-700 leading-relaxed mb-4 font-sans" 
              {...props}
            >
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="space-y-2 mb-4" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="space-y-2 mb-4 list-decimal list-inside" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="flex items-start gap-3 text-slate-700 font-sans" {...props}>
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="flex-1">{children}</span>
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-navy-900" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-slate-600" {...props}>
              {children}
            </em>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="bg-navy-50 border-l-4 border-navy-900 p-4 rounded-r-lg my-4" 
              {...props}
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-navy-900 shrink-0 mt-0.5" />
                <div className="text-sm text-navy-800 [&>p]:mb-0">{children}</div>
              </div>
            </blockquote>
          ),
          code: ({ children, className: codeClassName, ...props }) => {
            const text = String(children).replace(/\n$/, '');
            
            // Convertir códigos especiales en badges
            if (text.startsWith('badge:')) {
              const badgeText = text.replace('badge:', '');
              return (
                <span className="inline-flex px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium mx-0.5">
                  {badgeText}
                </span>
              );
            }

            // Código inline normal
            return (
              <code 
                className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono" 
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre 
              className="bg-slate-100 p-4 rounded-lg overflow-x-auto mb-4" 
              {...props}
            >
              {children}
            </pre>
          ),
          a: ({ children, href, ...props }) => (
            <a 
              href={href}
              className="text-emerald-600 hover:text-emerald-700 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          hr: ({ ...props }) => (
            <hr className="my-6 border-slate-200" {...props} />
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-200 rounded-lg" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th 
              className="px-4 py-2 bg-slate-100 text-left text-sm font-semibold text-slate-700 border-b border-slate-200" 
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td 
              className="px-4 py-2 text-sm text-slate-700 border-b border-slate-200" 
              {...props}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default RichDescription;
