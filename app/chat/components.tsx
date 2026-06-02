import { ExternalLink , Loader2,Globe ,} from "lucide-react";


interface Source{
    url : string,
    title : string
}


// Fav Icon for each icon of the file
export function Favicon({ url }: { url: string }) {
  const host = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${host}&sz=16`}
      alt=""
      className="w-3.5 h-3.5 rounded-sm shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}


function getHostname(url: string): string {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

// ─── Source Bar ───────────────────────────────────────────────────────────────
export function SourceBar({
  sources,
  streaming,
  historical = false,
}: {
  sources:     Source[];
  streaming:   boolean;
  /** true when sources were loaded from DB history rather than a live stream */
  historical?: boolean;
}) {
  return (
    <aside className="w-[220px] shrink-0 border-l border-zinc-800/40 flex flex-col bg-[#0c0c0d]">
      {/* Header */}
      <div className="h-12 px-4 border-b border-zinc-800/40 flex items-center gap-2 shrink-0">
        <Globe size={12} className="text-zinc-600" />
        <p className="text-zinc-500 text-[11px] font-medium">Sources</p>
        {streaming ? (
          <Loader2 size={10} className="animate-spin text-violet-500 ml-auto" />
        ) : sources.length > 0 ? (
          <span className="ml-auto flex items-center gap-1.5">
            {historical && (
              <span className="text-[9px] text-zinc-700 italic">prev</span>
            )}
            <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full tabular-nums">
              {sources.length}
            </span>
          </span>
        ) : null}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto thin-scroll px-2.5 py-3 space-y-1.5">
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-3 gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center">
              <Globe size={14} className="text-zinc-700" />
            </div>
            <p className="text-zinc-700 text-[10px] leading-relaxed">
              {historical
                ? "Sources weren't saved for this thread"
                : "Sources appear after a response"}
            </p>
          </div>
        ) : (
          sources.map((src, i) => {
            const host = getHostname(src.url);
            return (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 bg-[#111112] border border-zinc-800/50 rounded-xl px-3 py-2.5 hover:border-zinc-700/70 hover:bg-[#161617] transition-all group fade-up"
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-[9px] text-zinc-700 font-medium tabular-nums mt-0.5 w-3 shrink-0">
                    {i + 1}
                  </span>
                  <Favicon url={src.url} />
                  <p className="text-[11px] text-zinc-300 leading-[1.35] line-clamp-2 group-hover:text-white transition-colors flex-1">
                    {src.title || host}
                  </p>
                </div>
                <div className="flex items-center justify-between pl-5">
                  <p className="text-[10px] text-zinc-700 truncate">{host}</p>
                  <ExternalLink size={9} className="text-zinc-800 group-hover:text-zinc-500 transition-colors shrink-0" />
                </div>
              </a>
            );
          })
        )}
      </div>
    </aside>
  );
}

// ─── Shimmer Skeleton ─────────────────────────────────────────────────────────
// Shared between ConversationPanel and future loading states.

function ConversationSkeleton({ title }: { title: string }) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 px-6 border-b border-zinc-800/40 flex items-center shrink-0">
          <p className="text-zinc-400 text-[12px] truncate">{title}</p>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
            {/* Assistant skeleton */}
            <div className="space-y-3">
              <div className="flex gap-1.5">
                {[80, 120, 96].map((w, i) => (
                  <div key={i} className="h-6 rounded-lg shimmer" style={{ width: w }} />
                ))}
              </div>
              <div className="space-y-2">
                {[100, 85, 95, 70].map((pct, i) => (
                  <div key={i} className="h-3.5 rounded shimmer" style={{ width: `${pct}%` }} />
                ))}
              </div>
            </div>
            {/* User skeleton */}
            <div className="flex justify-end">
              <div className="h-10 w-48 rounded-2xl shimmer" />
            </div>
            {/* Assistant skeleton 2 */}
            <div className="space-y-2">
              {[100, 88, 76, 55].map((pct, i) => (
                <div key={i} className="h-3.5 rounded shimmer" style={{ width: `${pct}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <SourceBar sources={[]} streaming={false} />
    </div>
  );
}
