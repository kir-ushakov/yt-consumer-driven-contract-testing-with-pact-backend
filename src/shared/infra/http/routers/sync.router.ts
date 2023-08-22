import express from "express";
import { syncRouter } from "../../../../modules/sync/routers";
import { authRouter } from "../../../../modules/auth/routers";
import { middleware } from "../../http/_index";

const authMode = process.env.AUTH_TEST_MODE === "true" ? "TEST" : "NORMAL";
const apiRouters = express.Router();

apiRouters.get("/", (req, res) => {
  return res.json({ message: "BA backend up!" });
});

apiRouters.use("/api/auth", authRouter);
apiRouters.use("/api/sync", middleware.isAuthenticated(authMode), syncRouter);

export { apiRouters };
