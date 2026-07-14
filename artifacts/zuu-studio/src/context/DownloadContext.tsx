import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from "react";

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  status: "pending" | "downloading" | "done" | "error";
  progress: number; // 0-100
  error?: string;
}

interface DownloadContextValue {
  downloads: DownloadItem[];
  addDownload: (url: string, filename: string) => void;
  removeDownload: (id: string) => void;
  clearCompleted: () => void;
}

const DownloadContext = createContext<DownloadContextValue>({
  downloads: [],
  addDownload: () => {},
  removeDownload: () => {},
  clearCompleted: () => {},
});

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const removeDownload = useCallback((id: string) => {
    setDownloads((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setDownloads((prev) => prev.filter((d) => d.status !== "done" && d.status !== "error"));
  }, []);

  const addDownload = useCallback((url: string, filename: string) => {
    const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const item: DownloadItem = { id, filename, url, status: "pending", progress: 0 };

    setDownloads((prev) => [item, ...prev]);

    // Use fetch + streaming to track progress
    void (async () => {
      try {
        setDownloads((prev) =>
          prev.map((d) => d.id === id ? { ...d, status: "downloading", progress: 5 } : d),
        );

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentLength = response.headers.get("Content-Length");
        const total = contentLength ? parseInt(contentLength) : 0;
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Stream not available");

        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          const pct = total > 0 ? Math.min(95, Math.round((received / total) * 100)) : 50;
          setDownloads((prev) =>
            prev.map((d) => d.id === id ? { ...d, progress: pct } : d),
          );
        }

        const blobParts = chunks.map((chunk) =>
  chunk.buffer.slice(
    chunk.byteOffset,
    chunk.byteOffset + chunk.byteLength,
  ) as ArrayBuffer,
);

const blob = new Blob(blobParts);
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = filename;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

        setDownloads((prev) =>
          prev.map((d) => d.id === id ? { ...d, status: "done", progress: 100 } : d),
        );
      } catch (err) {
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, status: "error", error: err instanceof Error ? err.message : "Unknown error" }
              : d,
          ),
        );
      }
    })();
  }, []);

  return (
    <DownloadContext.Provider value={{ downloads, addDownload, removeDownload, clearCompleted }}>
      {children}
    </DownloadContext.Provider>
  );
}

export const useDownloads = () => useContext(DownloadContext);
