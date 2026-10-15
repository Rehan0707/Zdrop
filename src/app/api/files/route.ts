// Original documents never leave server-side storage through this legacy route.
// Operators use authenticated, no-store raster pages at POST /api/print/page.
export async function GET() {
  return new Response(
    "Original file downloads are disabled. Use the restricted print desk.",
    {
      status: 403,
      headers: {
        "Cache-Control": "no-store, private, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
