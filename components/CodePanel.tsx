'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CodePanel({
  title,
  code,
  language
}: {
  title: string;
  code: string;
  language: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-slate-400">{language}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition',
            copied
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
              : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
          )}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="max-h-[520px] overflow-auto p-4 text-sm leading-6">{code}</pre>
    </div>
  );
}
