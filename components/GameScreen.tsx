import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VariableSizeList as List } from 'react-window';
import type { Message, CombatState } from '../types';
import { MessageRole } from '../types';
import { CombatUI } from './CombatUI';

interface GameScreenProps {
  messages: Message[];
  combatState: CombatState;
}

const renderMessageContent = (msg: Message) => {
  if (msg.role === MessageRole.GAME_MASTER) {
    return (
      <div className="mb-6 prose prose-lg prose-invert max-w-none text-stone-300">
          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
      </div>
    );
  }
  if (msg.role === MessageRole.PLAYER) {
    return (
      <div className="mb-6 text-right">
        <p className="inline-block bg-amber-950/50 text-amber-100 rounded-lg px-4 py-2 italic border border-amber-800/50">
          &gt; {msg.content}
        </p>
      </div>
    );
  }
  return null;
};


export function GameScreen({ messages, combatState }: GameScreenProps) {
  const listRef = useRef<List | null>(null);
  const sizeMap = useRef<Record<number, number>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const items = combatState.isActive ? ["combat_ui", ...messages] : messages;
  const itemCount = items.length;

  useEffect(() => {
      const observer = new ResizeObserver(entries => {
          if (entries[0]) {
          const { width, height } = entries[0].contentRect;
          setContainerSize({ width, height });
          }
      });
      if (containerRef.current) {
          observer.observe(containerRef.current);
      }
      return () => observer.disconnect();
  }, []);

  useEffect(() => {
      if (listRef.current && itemCount > 0) {
          listRef.current.scrollToItem(itemCount - 1, 'end');
      }
  }, [itemCount, containerSize]);

  const setSize = useCallback((index: number, size: number) => {
      const currentSize = sizeMap.current[index];
      if (currentSize !== size) {
          sizeMap.current = { ...sizeMap.current, [index]: size };
          if (listRef.current) {
              listRef.current.resetAfterIndex(index);
          }
      }
  }, []);

  const getSize = (index: number) => sizeMap.current[index] || 100;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const rowRef = useRef<HTMLDivElement | null>(null);
      const item = items[index];
      const dependency = typeof item === 'string' ? combatState.log.length : item.content;

      useEffect(() => {
          if (rowRef.current) {
              setSize(index, rowRef.current.getBoundingClientRect().height);
          }
      }, [index, containerSize.width, dependency]);

      return (
          <div style={style}>
              <div ref={rowRef} className="max-w-4xl mx-auto">
                  {typeof item === 'string' && item === 'combat_ui'
                  ? <CombatUI combatState={combatState} />
                  : renderMessageContent(item as Message)}
              </div>
          </div>
      );
  };

  return (
    <div ref={containerRef} className="flex-grow overflow-hidden">
        {containerSize.height > 0 && containerSize.width > 0 && (
            <List
                className="custom-scrollbar pr-4"
                ref={listRef}
                height={containerSize.height}
                width={containerSize.width}
                itemCount={itemCount}
                itemSize={getSize}
                overscanCount={5}
            >
                {Row}
            </List>
        )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(41, 37, 36, 0.5);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(202, 138, 4, 0.6);
            border-radius: 10px;
            border: 1px solid rgba(41, 37, 36, 1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(202, 138, 4, 0.8);
        }
        .prose-invert {
            --tw-prose-body: #d6d3d1;
            --tw-prose-headings: #f5f5f4;
            --tw-prose-lead: #a8a29e;
            --tw-prose-links: #fbbf24;
            --tw-prose-bold: #fafaf9;
            --tw-prose-counters: #a8a29e;
            --tw-prose-bullets: #78716c;
            --tw-prose-hr: #44403c;
            --tw-prose-quotes: #f5f5f4;
            --tw-prose-quote-borders: #78716c;
            --tw-prose-captions: #a8a29e;
            --tw-prose-code: #fafaf9;
            --tw-prose-pre-code: #d6d3d1;
            --tw-prose-pre-bg: rgba(0,0,0,0.3);
            --tw-prose-th-borders: #44403c;
            --tw-prose-td-borders: #292524;
        }
      `}</style>
    </div>
  );
}