import { Router, type IRouter } from "express";

const router: IRouter = Router();

const MAX_LOGS = 500;
const logs: { ts: string; msg: string }[] = [];

router.post("/debuglog", (req, res) => {
  const msg = typeof req.body?.msg === "string" ? req.body.msg : JSON.stringify(req.body);
  const entry = { ts: new Date().toISOString(), msg };
  logs.push(entry);
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
  res.json({ ok: true });
});

router.get("/debuglog", (_req, res) => {
  res.json({ count: logs.length, logs });
});

router.delete("/debuglog", (_req, res) => {
  logs.splice(0, logs.length);
  res.json({ ok: true, cleared: true });
});

export default router;
