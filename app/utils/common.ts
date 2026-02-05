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

export function removeNull(
    data: unknown,
    blacklist: string[] = [],
    whitelist: string[] = [],
): unknown {
    if (data === null || data === undefined) {
        return undefined;
    }
    if (Array.isArray(data)) {
        return data
            .map((item) => removeNull(item, blacklist, whitelist));
    }
    if (typeof data === 'object') {
        return Object.keys(data).reduce(
            (acc, key) => {
                if (blacklist && blacklist.includes(key)) {
                    return acc;
                }

                const val = data[key as keyof typeof data];
                if (whitelist.includes(key)) {
                    return {
                        ...acc,
                        [key]: val,
                    }
                }

                const newEntry = removeNull(val, blacklist, whitelist);
                if (newEntry !== null && newEntry !== undefined) {
                    return {
                        ...acc,
                        [key]: newEntry,
                    };
                }
                return acc;
            },
            {},
        );
    }
    return data;
}

