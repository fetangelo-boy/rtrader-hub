interface MediaItem {
  type: "image" | "audio" | "video" | "link";
  url: string;
  label?: string;
}

interface Props {
  items: MediaItem[];
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);

    // YouTube
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let id = u.searchParams.get("v");
      if (!id && u.hostname === "youtu.be") id = u.pathname.slice(1);
      if (!id) {
        const match = u.pathname.match(/\/embed\/([^/?]+)/);
        if (match) id = match[1];
      }
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }

    // Rutube
    if (u.hostname.includes("rutube.ru")) {
      const match = url.match(/rutube\.ru\/(?:video|play\/embed)\/([a-f0-9]+)/i);
      if (match) return `https://rutube.ru/play/embed/${match[1]}/`;
    }

    // VK видео
    if (u.hostname.includes("vk.com") && u.pathname.includes("/video")) {
      const oid = u.searchParams.get("z") || url;
      const m = oid.match(/video(-?\d+)_(\d+)/);
      if (m) return `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2`;
    }

    return null;
  } catch {
    return null;
  }
}

export default function MediaGallery({ items }: Props) {
  if (!items || items.length === 0) return null;

  const images = items.filter(i => i.type === "image");
  const audios = items.filter(i => i.type === "audio");
  const videos = items.filter(i => i.type === "video");
  const links = items.filter(i => i.type === "link");

  return (
    <div className="flex flex-col gap-3 mt-3">
      {images.length > 0 && (
        <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {images.map((item, i) => (
            <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden border border-white/10 hover:border-white/25 transition-colors">
              <img src={item.url} alt={item.label || ""} className="w-full object-cover max-h-60" />
            </a>
          ))}
        </div>
      )}

      {audios.map((item, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
          {item.label && <p className="text-xs text-white/40 mb-2">{item.label}</p>}
          <audio controls className="w-full h-9">
            <source src={item.url} />
          </audio>
        </div>
      ))}

      {videos.map((item, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
          {item.label && <p className="text-xs text-white/40 px-3 pt-2">{item.label}</p>}
          <video controls className="w-full max-h-72">
            <source src={item.url} />
          </video>
        </div>
      ))}

      {links.map((item, i) => {
        const embedUrl = getEmbedUrl(item.url);
        if (embedUrl) {
          return (
            <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-black/30 aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="clipboard-write; autoplay; fullscreen"
                allowFullScreen
                style={{ border: "none" }}
              />
            </div>
          );
        }
        return (
          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#FFD700]/70 hover:text-[#FFD700] transition-colors group">
            <span className="w-4 h-4 rounded-full bg-[#FFD700]/10 flex items-center justify-center shrink-0 group-hover:bg-[#FFD700]/20 transition-colors">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="truncate">{item.label || item.url}</span>
          </a>
        );
      })}
    </div>
  );
}
