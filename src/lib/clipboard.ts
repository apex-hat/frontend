/**
 * navigator.clipboard는 secure context(HTTPS 또는 localhost)에서만 존재한다.
 * HTTP로 배포된 환경에서는 navigator.clipboard 자체가 undefined라 바로 에러가 나므로,
 * 옛 방식(document.execCommand)으로 폴백한다.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // secure context이지만 권한이 거부된 경우 등 — 아래 폴백을 시도한다.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
