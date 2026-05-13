import { useState } from "react"
import { supabase } from "./supabase"

export default function Auth({ onLogin }) {
  const [username, setUsername] = useState("")
  const [pin, setPin] = useState("")

  async function login() {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("pin", pin)

    if (data && data.length > 0) {
      localStorage.setItem("tracker_user", JSON.stringify(data[0]))
      onLogin(data[0])
    } else {
      alert("Invalid credentials")
    }
  }

  async function signup() {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          pin
        }
      ])
      .select()

    if (error) {
      alert(error.message)
      return
    }

    localStorage.setItem("tracker_user", JSON.stringify(data[0]))
    onLogin(data[0])
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07070f",
        color: "#e4e4f0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "monospace"
      }}
    >
      <div style={{ width: 300 }}>
        <h1 style={{ marginBottom: 20 }}>TRACKER ACCESS</h1>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 10,
            padding: 12,
            background: "#111",
            border: "1px solid #333",
            color: "white"
          }}
        />

        <input
          placeholder="PIN"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 20,
            padding: 12,
            background: "#111",
            border: "1px solid #333",
            color: "white"
          }}
        />

        <button
          onClick={login}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 10
          }}
        >
          LOGIN
        </button>

        <button
          onClick={signup}
          style={{
            width: "100%",
            padding: 12
          }}
        >
          CREATE ACCOUNT
        </button>
      </div>
    </div>
  )
}