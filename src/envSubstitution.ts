const VAR_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g;

export function substituteTemplate(
  template: string,
  env: Record<string, string>
): { result: string; warnings: string[] } {
  const warnings: string[] = [];
  const result = template.replace(VAR_PATTERN, (_match, rawKey: string) => {
    const key = String(rawKey).trim();
    if (!key) {
      return _match;
    }
    if (Object.prototype.hasOwnProperty.call(env, key)) {
      return env[key];
    }
    warnings.push(`variable '${key}' not found`);
    return _match;
  });
  return { result, warnings };
}

export function substituteAll(
  parts: { url: string; headers: Record<string, string>; body: string; params: Record<string, string> },
  env: Record<string, string>
): { url: string; headers: Record<string, string>; body: string; params: Record<string, string>; warnings: string[] } {
  const allWarnings: string[] = [];
  const urlSub = substituteTemplate(parts.url, env);
  allWarnings.push(...urlSub.warnings);

  const nextHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(parts.headers)) {
    const h = substituteTemplate(v, env);
    allWarnings.push(...h.warnings);
    nextHeaders[k] = h.result;
  }

  const bodySub = substituteTemplate(parts.body, env);
  allWarnings.push(...bodySub.warnings);

  const nextParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(parts.params)) {
    const p = substituteTemplate(v, env);
    allWarnings.push(...p.warnings);
    nextParams[k] = p.result;
  }

  return {
    url: urlSub.result,
    headers: nextHeaders,
    body: bodySub.result,
    params: nextParams,
    warnings: [...new Set(allWarnings)]
  };
}
