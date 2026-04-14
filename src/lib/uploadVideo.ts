/**
 * Загрузка медиафайла (видео/аудио/фото) в S3 через backend.
 * Файл конвертируется в base64 и отправляется одним POST-запросом.
 */

export async function uploadVideo(
  file: File,
  videoUploadUrl: string,
  token: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  onProgress?.(5);

  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // убираем data:...;base64, префикс
      const b64 = result.split(",")[1];
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  onProgress?.(20);

  const res = await fetch(
    `${videoUploadUrl}?token=${encodeURIComponent(token)}&action=upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        mime: file.type || "video/mp4",
        data,
      }),
    },
  );

  onProgress?.(90);

  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || `Ошибка загрузки: ${res.status}`);
  }

  const { cdn_url } = await res.json();
  onProgress?.(100);
  return cdn_url;
}
