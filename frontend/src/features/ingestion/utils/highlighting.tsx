import { isValidElement, cloneElement, ReactNode } from "react";

export const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const getSearchRegex = (query: string, caseSensitive: boolean, useRegex: boolean) => {
  if (!query) return null;
  try {
    const pattern = useRegex ? query : escapeRegExp(query);
    const flags = caseSensitive ? "g" : "gi";
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
};

export const getMatchCount = (text: string, query: string, caseSensitive: boolean, useRegex: boolean) => {
  if (!query) return 0;
  const regex = getSearchRegex(query, caseSensitive, useRegex);
  if (!regex) return 0;
  return (text.match(regex) || []).length;
};

export const highlightRawText = (
  text: string,
  query: string,
  currentMatchIndex: number,
  caseSensitive: boolean,
  useRegex: boolean
) => {
  if (!query) return text;
  const regex = getSearchRegex(query, caseSensitive, useRegex);
  if (!regex) return text;
  const pattern = useRegex ? query : escapeRegExp(query);
  let captureRegex: RegExp;
  try {
    captureRegex = new RegExp(`(${pattern})`, caseSensitive ? "g" : "gi");
  } catch (e) {
    return text;
  }
  const parts = text.split(captureRegex);
  let matchIdx = 0;
  return parts.map((part, index) => {
    const matchesQuery = useRegex
      ? new RegExp(`^${pattern}$`, caseSensitive ? "" : "i").test(part)
      : part.toLowerCase() === query.toLowerCase();

    if (matchesQuery) {
      const currentIdx = matchIdx++;
      const isActive = currentIdx === currentMatchIndex;
      return (
        <mark
          key={index}
          id={`raw-match-${currentIdx}`}
          className={`transition-colors duration-200 ${
            isActive
              ? "bg-amber-400 text-black font-bold ring-2 ring-primary border border-amber-500"
              : "bg-amber-500/30 text-white border border-amber-500/40"
          } px-0.5 rounded-sm`}
        >
          {part}
        </mark>
      );
    }
    return part;
  });
};

export const highlightNodes = (
  node: ReactNode,
  query: string,
  caseSensitive: boolean,
  useRegex: boolean
): ReactNode => {
  if (!query) return node;
  if (typeof node === "string") {
    const pattern = useRegex ? query : escapeRegExp(query);
    let captureRegex: RegExp;
    try {
      captureRegex = new RegExp(`(${pattern})`, caseSensitive ? "g" : "gi");
    } catch {
      return node;
    }
    const parts = node.split(captureRegex);
    return parts.map((part, index) => {
      const matchesQuery = useRegex
        ? new RegExp(`^${pattern}$`, caseSensitive ? "" : "i").test(part)
        : part.toLowerCase() === query.toLowerCase();

      return matchesQuery ? (
        <mark
          key={index}
          className="bg-amber-500/30 text-white border border-amber-500/40 px-0.5 rounded-sm"
        >
          {part}
        </mark>
      ) : (
        part
      );
    });
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => <span key={i}>{highlightNodes(child, query, caseSensitive, useRegex)}</span>);
  }
  if (isValidElement<{ children?: ReactNode }>(node) && (node.props as { children?: ReactNode }).children) {
    return cloneElement(node, {}, highlightNodes((node.props as { children?: ReactNode }).children as ReactNode, query, caseSensitive, useRegex));
  }
  return node;
};

export const highlightChunkText = (
  text: string,
  query: string,
  caseSensitive: boolean,
  useRegex: boolean
) => {
  if (!query) return text;
  const pattern = useRegex ? query : escapeRegExp(query);
  let captureRegex: RegExp;
  try {
    captureRegex = new RegExp(`(${pattern})`, caseSensitive ? "g" : "gi");
  } catch (e) {
    return text;
  }
  const parts = text.split(captureRegex);
  return parts.map((part, index) => {
    const matchesQuery = useRegex
      ? new RegExp(`^${pattern}$`, caseSensitive ? "" : "i").test(part)
      : part.toLowerCase() === query.toLowerCase();

    return matchesQuery ? (
      <mark
        key={index}
        className="bg-indigo-500/30 text-white border border-indigo-500/40 px-0.5 rounded-sm"
      >
        {part}
      </mark>
    ) : (
      part
    );
  });
};
