import express from "express";
import cors from "cors";
import resultRouter from "./routes/result.js";

const app = express();
app.use(cors());
app.use(express.json());

// Use the result route
app.use("/api", resultRouter);

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
