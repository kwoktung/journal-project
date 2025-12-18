import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // Construct the API path
  const apiUrl = new URL(`/api${request.nextUrl.pathname}`, request.url);

  // Forward the GET request to the API route
  const response = await fetch(apiUrl.toString(), {
    method: "GET",
    headers: request.headers,
  });

  // Return the proxied response
  return response;
}
