import http from "node:http";

const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `item-${i + 1}` }));

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/items") {
    const page = Number(url.searchParams.get("page") ?? 1);
    const size = 10;
    // BUG (see issue): page=1 should return items 1-10, but this skips them.
    const start = page * size;
    const slice = items.slice(start, start + size);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(slice));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3000, () => console.log("api on :3000"));
