import { createApp } from "./app.js";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const app = createApp();

app.listen(port, () => {
  console.log(`Shortlist API listening on http://localhost:${port}`);
});
