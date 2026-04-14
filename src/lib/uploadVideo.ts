/**
 * Chunked multipart upload видео через backend.
 * Делит файл на куски по CHUNK_SIZE, отправляет последовательно,
 * сообщает прогресс через onProgress(0..100).
 */

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 МБ — минимум для S3 multipart (кроме последнего)

export async function uploadVideo(
  file: File,
  videoUploadUrl: string,
  token: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const mime = file.type || "video/mp4";
  const base = `${videoUploadUrl}?token=${encodeURIComponent(token)}`;

  // Шаг 1: init
  const initRes = await fetch(
    `${base}&action=init&filename=${encodeURIComponent(file.name)}&mime=${encodeURIComponent(mime)}`,
    { method: "POST" },
  );
  if (!initRes.ok) {
    const d = await initRes.json().catch(() => ({}));
    throw new Error(d.error || `Ошибка инициализации: ${initRes.status}`);
  }
  const { upload_id, key } = await initRes.json();

  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const parts: { part: number; etag: string }[] = [];

  // Шаг 2: загружаем чанки
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const chunk = file.slice(start, start + CHUNK_SIZE);
    const partNumber = i + 1;

    const chunkRes = await fetch(
      `${base}&action=chunk&key=${encodeURIComponent(key)}&upload_id=${encodeURIComponent(upload_id)}&part=${partNumber}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: chunk,
      },
    );

    if (!chunkRes.ok) {
      // Отменяем upload при ошибке
      await fetch(
        `${base}&action=abort&key=${encodeURIComponent(key)}&upload_id=${encodeURIComponent(upload_id)}`,
        { method: "POST" },
      ).catch(() => {});
      const d = await chunkRes.json().catch(() => ({}));
      throw new Error(d.error || `Ошибка загрузки части ${partNumber}: ${chunkRes.status}`);
    }

    const { etag } = await chunkRes.json();
    parts.push({ part: partNumber, etag });
    onProgress?.(Math.round(((i + 1) / totalChunks) * 95));
  }

  // Шаг 3: завершение
  const completeRes = await fetch(
    `${base}&action=complete&key=${encodeURIComponent(key)}&upload_id=${encodeURIComponent(upload_id)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parts),
    },
  );

  if (!completeRes.ok) {
    const d = await completeRes.json().catch(() => ({}));
    throw new Error(d.error || `Ошибка завершения: ${completeRes.status}`);
  }

  const { cdn_url } = await completeRes.json();
  onProgress?.(100);
  return cdn_url;
}
