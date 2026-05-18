"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import SourceIcon from "../icons/sourceIcon";

interface SourceBarsPropsValidation{
    id?:string;
    url?:string;
    title?:string;
    content?:string;
    request_id?:string;
}

interface SourceBarsProps {
  loading?: boolean;
  SOURCES?:SourceBarsPropsValidation []
}

export function SourceBars({ loading , SOURCES =[]}: SourceBarsProps){
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? SOURCES : SOURCES.slice(0, 3);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <SourceIcon />
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Sources</span>
        <span className="text-xs text-zinc-400 dark:text-zinc-600 ml-1">{SOURCES.length}</span>
      </div>

      {/* Horizontal scrollable source cards */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {visible.map((src, i) => (
          <SourceCard key={src.id} source={src} index={i + 1} loading={loading} />
        ))}

        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex-shrink-0 flex flex-col items-center justify-center w-36 min-h-[88px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors gap-1"
          >
            <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              +{SOURCES.length - 3}
            </span>
            <span>more sources</span>
          </button>
        )}
      </div>
    </section>
  );
}

function SourceCard({
  source,
  index,
  loading,
}: {
  source: SourceBarsPropsValidation;
  index: number;
  loading?: boolean;
}) {

    const domain = source.url
    ? new URL(source.url).hostname
    : "";


  if (loading) {
    return (
      <div className="flex-shrink-0 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 animate-pulse">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-full mb-1" />
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-5/6" />
      </div>
    );
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex-shrink-0 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800",
        "bg-zinc-50 dark:bg-zinc-900 p-3 hover:bg-white dark:hover:bg-zinc-800",
        "hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
      )}
    >
      {/* Number + domain row */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-600 tabular-nums w-4">
          {index}
        </span>
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
          alt=""
          className="w-3.5 h-3.5 rounded-sm"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex-1">
          {domain}
        </span>
        <ExternalLink className="w-3 h-3 text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>

      {/* Title */}
      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-snug">
        {source.title}
      </p>
    </a>
  );
}



// Need useState import
import { useState } from "react";
import { url } from "inspector";import { Url } from "next/dist/shared/lib/router/router";

