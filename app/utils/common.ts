export function validateCommaSeparatedUrls(value: string) {
  return value.split(",").map((url) => {
    const sanitizedUrl = url.trim();
    if (sanitizedUrl === '') {
        return '';
    }
    new URL(sanitizedUrl);
    return sanitizedUrl;
  }).filter((item) => item != '')
}
