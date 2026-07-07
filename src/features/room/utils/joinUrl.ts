import "server-only";

import { headers } from "next/headers";

/**
 * 招待コードから学生用入室URLを生成します。
 *
 * NEXT_PUBLIC_APP_URLが設定されている場合はその値を優先し、
 * 未設定の場合は現在のリクエストのホスト名を使用します。
 */
export async function buildJoinUrl(inviteCode: string): Promise<string> {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredOrigin) {
    return new URL(
      `/join/${encodeURIComponent(inviteCode)}`,
      new URL(configuredOrigin).origin,
    ).toString();
  }

  const requestHeaders = await headers();

  const forwardedHost = getFirstHeaderValue(
    requestHeaders.get("x-forwarded-host"),
  );
  const host = forwardedHost ?? requestHeaders.get("host")?.trim();

  if (!host) {
    throw new Error("Request host is missing.");
  }

  const forwardedProtocol = getFirstHeaderValue(
    requestHeaders.get("x-forwarded-proto"),
  );

  const protocol =
    forwardedProtocol ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return new URL(
    `/join/${encodeURIComponent(inviteCode)}`,
    `${protocol}://${host}`,
  ).toString();
}

function getFirstHeaderValue(value: string | null): string | null {
  const firstValue = value?.split(",")[0]?.trim();

  return firstValue || null;
}
