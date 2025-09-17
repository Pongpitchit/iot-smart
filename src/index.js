import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ✅ สร้าง user ใหม่จาก LINE Login
app.post("/api/users", async (req, res) => {
  const { userId, displayName, pictureUrl } = req.body; // ใช้ camelCase ตรงกันหมด

  try {
    const { data, error } = await supabase
      .from("users")
      .insert([{ userId, displayName, pictureUrl }]) // field ต้องตรงกับ column ใน Supabase
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ✅ เพิ่มอุปกรณ์ใหม่ให้ users
app.post("/api/users/:userId/devices", async (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;

  try {
    // หา user id (uuid) จาก LINE userId
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("userId", userId)
      .single();

    if (userError || !user) throw userError || new Error("User not found");

    const { data, error } = await supabase
      .from("devices")
      .insert([{ name, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ ดึงอุปกรณ์ทั้งหมดของ users
app.get("/api/users/:userId/devices", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("userId", userId)
      .single();

    if (userError || !user) throw userError || new Error("User not found");

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ บันทึกค่า temperature/humidity
app.post("/api/devices/:deviceId/data", async (req, res) => {
  const { deviceId } = req.params;
  const { temperature, humidity } = req.body;

  try {
    const { data, error } = await supabase
      .from("device_data")
      .insert([{ device_id: deviceId, temperature, humidity }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ ดึงค่า sensor ล่าสุดของอุปกรณ์
app.get("/api/devices/:deviceId/data", async (req, res) => {
  const { deviceId } = req.params;

  try {
    const { data, error } = await supabase
      .from("device_data")
      .select("*")
      .eq("device_id", deviceId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
