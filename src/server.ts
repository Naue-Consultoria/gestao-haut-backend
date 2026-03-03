import { app } from './app';
import { env } from './config/env';

const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(`HAUT Backend running on http://localhost:${PORT}`);
});
