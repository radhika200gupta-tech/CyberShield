import { useState } from 'react';
import { 
  FiSearch, FiCopy, FiCheck, FiCode 
} from 'react-icons/fi';

export default function RawHeadersViewer({ rawHeaders = '', parsedHeaders = {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'raw'

  const headerEntries = Object.entries(parsedHeaders || {});
  
  const filteredEntries = headerEntries.filter(([key, val]) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const keyMatch = key.toLowerCase().includes(term);
    const valMatch = Array.isArray(val)
      ? val.some(v => String(v).toLowerCase().includes(term))
      : String(val).toLowerCase().includes(term);
    return keyMatch || valMatch;
  });

  const handleCopyHeader = (key, value) => {
    const text = Array.isArray(value) ? value.join('\n') : String(value);
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAllRaw = () => {
    navigator.clipboard.writeText(rawHeaders);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 shadow-sm space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-accent">
            <FiCode size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary tracking-tight">
              Parsed RFC 5322 Headers ({headerEntries.length} Unique Fields)
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary">
              Searchable catalog of unfolded headers extracted from the message metadata block
            </p>
          </div>
        </div>

        {/* View mode toggle and copy all */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border bg-bg-surface p-1 text-xs font-mono">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-accent text-white font-medium' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'raw' ? 'bg-accent text-white font-medium' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Raw Unfolded
            </button>
          </div>

          <button
            onClick={handleCopyAllRaw}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-bg-surface text-xs font-mono text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer"
          >
            {copiedAll ? (
              <>
                <FiCheck size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Copied All</span>
              </>
            ) : (
              <>
                <FiCopy size={13} />
                <span>Copy Headers</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Input */}
      {viewMode === 'table' && (
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by header name (e.g. 'Authentication-Results', 'DKIM', 'Received') or value..."
            className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-border rounded-lg text-xs sm:text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
        </div>
      )}

      {/* Content Area */}
      {viewMode === 'raw' ? (
        <div className="p-4 sm:p-5 rounded-xl bg-bg-surface border border-border font-mono text-xs sm:text-sm text-text-primary overflow-x-auto max-h-[500px]">
          <pre className="whitespace-pre-wrap break-all leading-relaxed">
            {rawHeaders || 'No raw headers provided.'}
          </pre>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-bg-surface/90 border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 font-mono text-xs uppercase tracking-wider text-text-muted w-1/4 font-semibold">
                    Header Field
                  </th>
                  <th className="py-3 px-4 font-mono text-xs uppercase tracking-wider text-text-muted font-semibold">
                    Parsed Value
                  </th>
                  <th className="py-3 px-3 font-mono text-xs uppercase tracking-wider text-text-muted w-16 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-xs sm:text-sm">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-text-muted text-xs sm:text-sm">
                      No headers matching &quot;{searchTerm}&quot;
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map(([key, val]) => {
                    const isArray = Array.isArray(val);
                    return (
                      <tr key={key} className="hover:bg-bg-surface/50 transition-colors">
                        <td className="py-3 px-4 align-top font-semibold text-accent break-all text-xs sm:text-sm">
                          {key}
                          {isArray && (
                            <span className="ml-1.5 text-xs font-mono px-1.5 py-0.5 rounded bg-bg-surface border border-border text-text-muted">
                              x{val.length}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-top text-text-primary break-all leading-relaxed text-xs sm:text-sm">
                          {isArray ? (
                            <div className="space-y-1.5">
                              {val.map((item, i) => (
                                <div key={i} className="p-2 rounded-lg bg-bg-surface border border-border/50 text-xs sm:text-sm whitespace-pre-wrap break-all leading-relaxed">
                                  {item}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap [overflow-wrap:anywhere] break-words leading-relaxed">{String(val)}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top text-right">
                          <button
                            onClick={() => handleCopyHeader(key, val)}
                            className="p-1.5 rounded hover:bg-bg-surface text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                            title={`Copy ${key} value`}
                          >
                            {copiedKey === key ? (
                              <FiCheck size={14} className="text-emerald-400" />
                            ) : (
                              <FiCopy size={14} />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
