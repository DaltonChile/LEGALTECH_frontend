// LEGALTECH_frontend/src/utils/fileDownload.ts

/**
 * Download a blob as a file
 * @param blob - The blob to download
 * @param filename - The filename to save as
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download a file from a URL
 * @param url - The URL to download from
 * @param filename - The filename to save as
 * @param isBlob - Whether the URL is a blob URL (will be revoked after download)
 */
export const downloadFromUrl = (url: string, filename: string, isBlob: boolean = false): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  if (!isBlob) {
    link.target = '_blank';
  }
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  if (isBlob) {
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
  }
};
