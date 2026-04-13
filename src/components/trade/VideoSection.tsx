import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import func2url from "../../../backend/func2url.json";

const CHAT_URL = (func2url as Record<string, string>).chat;
const UPLOAD_URL = (func2url as Record<string, string>)["upload-image"];
const POLL_INTERVAL = 30000;

interface VideoMessage {
  id: number;
  text: string;
  created_at: string;
  nickname: string;
  role: string;
  video_url: string | null;
  video_title: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function VideoSection() {
  const { user, token } = useAuth();
  const [videos, setVideos] = useState<VideoMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === "owner" || user?.role === "admin";

  const fetchVideos = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${CHAT_URL}?action=messages&channel=video&limit=100`, {
        headers: { "X-Auth-Token": token },
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const all: VideoMessage[] = data.messages || [];
      const withVideo = all.filter(m => m.video_url);
      setVideos(withVideo.reverse());
      if (withVideo.length > 0 && activeId === null) {
        setActiveId(withVideo[0].id);
      }
    } catch (_e) {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  useEffect(() => {
    const t = setInterval(fetchVideos, POLL_INTERVAL);
    return () => clearInterval(t);
  }, [fetchVideos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 200 * 1024 * 1024) {
      setUploadError("Максимальный размер файла — 200 МБ");
      return;
    }
    setVideoFile(f);
    setUploadError("");
    if (!titleInput) setTitleInput(f.name.replace(/\.[^.]+$/, ""));
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!videoFile || !token) return;
    if (!titleInput.trim()) { setUploadError("Введите название видео"); return; }
    setUploading(true);
    setUploadError("");
    setUploadProgress(10);
    try {
      const b64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => {
          setUploadProgress(40);
          res((reader.result as string).split(",")[1]);
        };
        reader.onerror = rej;
        reader.readAsDataURL(videoFile);
      });

      setUploadProgress(60);
      const upRes = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ file: b64, filename: videoFile.name }),
      });
      const upData = await upRes.json();
      if (!upRes.ok) { setUploadError(upData.error || "Ошибка загрузки"); return; }
      setUploadProgress(85);

      const sendRes = await fetch(`${CHAT_URL}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({
          channel: "video",
          text: descInput.trim(),
          video_url: upData.url,
          video_title: titleInput.trim(),
        }),
      });
      if (!sendRes.ok) { setUploadError("Ошибка сохранения"); return; }
      setUploadProgress(100);

      setVideoFile(null);
      setTitleInput("");
      setDescInput("");
      setShowUploadForm(false);
      setUploadProgress(0);
      await fetchVideos();
    } catch {
      setUploadError("Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !window.confirm("Удалить это видео?")) return;
    await fetch(`${CHAT_URL}?action=delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Auth-Token": token },
      body: JSON.stringify({ message_id: id }),
    });
    setVideos(prev => prev.filter(v => v.id !== id));
    if (activeId === id) setActiveId(videos.find(v => v.id !== id)?.id ?? null);
  };

  const activeVideo = videos.find(v => v.id === activeId);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">Видео-обзоры</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">только чтение</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowUploadForm(!showUploadForm); setUploadError(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Icon name="Upload" size={13} />
            Загрузить видео
          </button>
        )}
      </div>

      {isAdmin && showUploadForm && (
        <div className="border-b border-border bg-card p-4 space-y-3">
          <p className="text-xs font-medium text-foreground">Новое видео</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Название видео *"
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Описание (необязательно)"
              value={descInput}
              onChange={e => setDescInput(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
              videoFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <Icon name={videoFile ? "CheckCircle" : "Film"} size={24} className={videoFile ? "text-primary" : "text-muted-foreground"} />
            <span className="text-sm text-muted-foreground">
              {videoFile ? videoFile.name : "Нажмите или перетащите видеофайл (MP4, WebM, MOV · до 200 МБ)"}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Загрузка...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !videoFile}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <><div className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />Загружаю...</>
              ) : (
                <><Icon name="Upload" size={14} />Опубликовать</>
              )}
            </button>
            <button
              onClick={() => { setShowUploadForm(false); setVideoFile(null); setTitleInput(""); setDescInput(""); setUploadError(""); }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Icon name="PlayCircle" size={40} />
          <span className="text-sm">Видео-обзоров пока нет</span>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
            {activeVideo && (
              <>
                <div className="relative bg-black rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <video
                    key={activeVideo.video_url!}
                    src={activeVideo.video_url!}
                    controls
                    className="w-full h-full"
                    preload="metadata"
                  />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{activeVideo.video_title || "Без названия"}</h2>
                  {activeVideo.text && (
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{activeVideo.text}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{formatDate(activeVideo.created_at)}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{activeVideo.nickname}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-64 flex-shrink-0 border-l border-border overflow-y-auto">
            <div className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Все обзоры</p>
              <div className="space-y-2">
                {videos.map(v => (
                  <div
                    key={v.id}
                    onClick={() => setActiveId(v.id)}
                    className={`group flex gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                      activeId === v.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="w-20 h-12 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                      <video src={v.video_url!} className="w-full h-full object-cover" preload="metadata" muted />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Icon name="Play" size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">
                        {v.video_title || "Без названия"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(v.created_at)}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(v.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                      >
                        <Icon name="Trash2" size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}