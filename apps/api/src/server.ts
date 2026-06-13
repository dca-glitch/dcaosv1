import { createApp } from "./app";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`DCA OS v1 API listening on port ${port}`);
});
