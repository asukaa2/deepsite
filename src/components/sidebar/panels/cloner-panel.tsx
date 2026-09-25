import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { TbLoader2, TbCopy } from "react-icons/tb";

interface ClonerPanelProps {
  onClone: (cloneData: any) => void;
}

export default function ClonerPanel({ onClone }: ClonerPanelProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [skeleton, setSkeleton] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSkeleton = async () => {
    if (!url) return;
    setLoading(true);
    setSkeleton(null);
    try {
      const res = await fetch("/api/clone/skeleton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.ok) {
        setSkeleton(data);
        toast.success(t("cloner.fetchOk"));
      } else {
        toast.error(data.message || t("cloner.fetchFailed"));
      }
    } catch (e: any) {
      toast.error(e.message || t("cloner.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const triggerClone = async () => {
    if (!url) return;
    setLoading(true);
    // Pass URL up to the parent; the chat stream will pick it up.
    onClone({ url });
    setLoading(false);
  };

  return (
    <div className="p-3 text-[#cccccc] space-y-3">
      <div>
        <label className="block text-xs uppercase text-[#9a9a9a] mb-1">
          {t("cloner.url")}
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("cloner.urlPlaceholder")}
          className="w-full bg-[#3c3c3c] border border-[#4c4c4c] text-white text-sm rounded px-2 py-1.5 font-code"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={fetchSkeleton}
          disabled={loading || !url}
          className="flex-1 flex items-center justify-center gap-2 text-sm bg-[#3c3c3c] hover:bg-[#4c4c4c] disabled:opacity-50 text-white py-2 rounded"
        >
          {loading ? <TbLoader2 size={16} className="animate-spin" /> : <TbCopy size={16} />}
          {t("cloner.fetchSkeleton")}
        </button>
        <button
          onClick={triggerClone}
          disabled={!url}
          className="flex-1 flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded"
        >
          {t("cloner.clone")}
        </button>
      </div>

      {skeleton && (
        <div className="space-y-3 bg-[#2d2d2d] border border-[#3c3c3c] rounded p-3">
          <div className="text-xs uppercase text-[#9a9a9a]">
            {t("cloner.previewSkeleton")}
          </div>

          <div>
            <div className="text-[11px] text-[#9a9a9a] uppercase">
              {t("cloner.title_field")}
            </div>
            <div className="text-sm text-white">{skeleton.title || "(none)"}</div>
          </div>

          {skeleton.colors?.length > 0 && (
            <div>
              <div className="text-[11px] text-[#9a9a9a] uppercase mb-1">
                {t("cloner.colors")}
              </div>
              <div className="flex flex-wrap gap-1">
                {skeleton.colors.slice(0, 20).map((c: string, i: number) => (
                  <div
                    key={i}
                    title={c}
                    style={{
                      background: c.startsWith("#") || c.startsWith("rgb") ? c : "#888",
                    }}
                    className="w-6 h-6 rounded border border-[#3c3c3c]"
                  />
                ))}
              </div>
            </div>
          )}

          {skeleton.images?.length > 0 && (
            <div>
              <div className="text-[11px] text-[#9a9a9a] uppercase mb-1">
                {t("cloner.images")}
              </div>
              <div className="flex flex-wrap gap-1">
                {skeleton.images.slice(0, 8).map((u: string, i: number) => (
                  <img
                    key={i}
                    src={u}
                    alt=""
                    className="w-10 h-10 object-cover rounded border border-[#3c3c3c]"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                ))}
              </div>
            </div>
          )}

          {skeleton.sections?.length > 0 && (
            <div>
              <div className="text-[11px] text-[#9a9a9a] uppercase mb-1">
                {t("cloner.sections")} ({skeleton.sections.length})
              </div>
              <div className="max-h-40 overflow-y-auto text-xs space-y-1 font-code">
                {skeleton.sections.slice(0, 50).map((s: any, i: number) => (
                  <div key={i} className="text-[#bbb] truncate">
                    <span className="text-[#8a8a8a]">&lt;{s.tag}&gt;</span>{" "}
                    {s.text?.slice(0, 80)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
