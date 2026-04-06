import { getAdminToken } from "@/hooks/useAdminAuth";

export const CMS_URL = "https://functions.poehali.dev/0232c19c-b467-4fa1-8e83-0eefe03b467c";

function headers() {
  return { "Content-Type": "application/json", "X-Admin-Token": getAdminToken() };
}

export async function cmsGet(section: string) {
  const res = await fetch(`${CMS_URL}?section=${section}`, { headers: headers() });
  return res.json();
}

export async function cmsCreate(section: string, data: Record<string, unknown>) {
  const res = await fetch(CMS_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ section, ...data }),
  });
  return res.json();
}

export async function cmsUpdate(section: string, id: number, data: Record<string, unknown>) {
  const res = await fetch(`${CMS_URL}?section=${section}&id=${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function cmsToggleVisible(section: string, id: number, is_visible: boolean) {
  const res = await fetch(`${CMS_URL}?section=${section}&id=${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ is_visible }),
  });
  return res.json();
}

export async function cmsDelete(section: string, id: number) {
  const res = await fetch(`${CMS_URL}?section=${section}&id=${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  return res.json();
}
