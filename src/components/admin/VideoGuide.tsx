import { useState } from "react";
import Icon from "@/components/ui/icon";

export default function VideoGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-white/3 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors text-left"
      >
        <Icon name="Info" size={13} />
        <span>Памятка по подготовке видео</span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={13} className="ml-auto" />
      </button>

      {open && (
        <div className="px-3 pb-3 text-xs text-white/50 flex flex-col gap-2.5 border-t border-white/10 pt-2.5">
          <div className="flex gap-4 flex-wrap">
            <div>
              <div className="text-white/70 font-medium mb-1">Формат</div>
              <div>MP4 + кодек H.264</div>
            </div>
            <div>
              <div className="text-white/70 font-medium mb-1">Разрешение</div>
              <div>1080p (1920×1080)</div>
            </div>
            <div>
              <div className="text-white/70 font-medium mb-1">Битрейт</div>
              <div>4–8 Мбит/с</div>
            </div>
            <div>
              <div className="text-white/70 font-medium mb-1">Длительность</div>
              <div>до 20–30 мин (длиннее — делить на части)</div>
            </div>
          </div>

          <div>
            <div className="text-white/70 font-medium mb-1">Примерный размер файла</div>
            <div className="grid grid-cols-3 gap-1 text-white/40">
              <span>10 мин → ~300–600 МБ</span>
              <span>20 мин → ~600 МБ–1.2 ГБ</span>
              <span>30 мин → ~1–1.8 ГБ</span>
            </div>
          </div>

          <div>
            <div className="text-white/70 font-medium mb-1">Программы</div>
            <div className="flex flex-col gap-0.5">
              <span><span className="text-white/60">OBS Studio</span> — запись экрана, бесплатно, сразу пишет в нужном формате</span>
              <span><span className="text-white/60">HandBrake</span> — сжатие готового видео, бесплатно. Настройки: MP4, H.264, качество RF 22–24</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
