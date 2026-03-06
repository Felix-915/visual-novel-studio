import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";

export default function EditorPanel({ scene, onUpdate }) {

  const [showModal, setShowModal] = useState(false);
  const [tempChoices, setTempChoices] = useState(["", "", ""]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (field, value) => onUpdate({ ...scene, [field]: value });

  const handleFile = async (field, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('game-images')
      .upload(filePath, file);

    if (error) {
      alert("アップロードに失敗しました: " + error.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('game-images')
      .getPublicUrl(filePath);

    handleChange(field, publicUrl);
  };

  const applyChoices = () => { onUpdate({ ...scene, choices: tempChoices }); setShowModal(false); };

  const labelStyle = { display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#d02090", marginBottom: "5px", marginTop: "15px", letterSpacing: "0.05em" };
  const inputBaseStyle = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ffdae9", background: "#fff9fb", boxSizing: "border-box", fontSize: "1rem", outline: "none", color: "#444" };

  // --- カスタムファイルボタンのスタイル ---
  const fileButtonStyle = (hasFile) => ({
    ...inputBaseStyle,
    fontSize: "0.8rem",
    border: hasFile ? "1px solid #ffb6c1" : "1px dashed #ffb6c1",
    background: hasFile ? "#fff0f5" : "#fff9fb",
    color: hasFile ? "#ff1493" : "#999",
    textAlign: "center",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "38px"
  });

  return (
    <div style={{
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
      background: "linear-gradient(135deg, #fff 0%, #fff0f5 100%)",
      padding: "25px",
      borderRadius: "20px",
      boxShadow: "0 10px 25px rgba(255, 182, 193, 0.2)",
      border: "1px solid #ffe4ed",
      boxSizing: "border-box"
    }}>
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
        gap: "20px" 
      }}>
        <div>
          <label style={labelStyle}>💖 キャラクター名</label>
          <input type="text" value={scene.name} onChange={(e) => handleChange("name", e.target.value)} style={inputBaseStyle} placeholder="名前を入力..." />
          <label style={labelStyle}>💬 セリフ</label>
          <textarea value={scene.text} onChange={(e) => handleChange("text", e.target.value)} style={{ ...inputBaseStyle, height: "100px", resize: "none" }} placeholder="（ここにセリフを入力）" />
        </div>
        <div>
          <label style={labelStyle}>🖼️ キャラ画像</label>
          <label style={fileButtonStyle(!!scene.charImg)}>
            {scene.charImg ? "（タップで変更）" : "📁 ファイルを選択"}
            <input 
              type="file" 
              onChange={(e) => handleFile("charImg", e)} 
              style={{ display: "none" }} // 本物のボタンは隠す
            />
          </label>

          <label style={labelStyle}>🌄 背景画像</label>
          <label style={fileButtonStyle(!!scene.bgImg)}>
            {scene.bgImg ? "（タップで変更）" : "📁 ファイルを選択"}
            <input 
              type="file" 
              onChange={(e) => handleFile("bgImg", e)} 
              style={{ display: "none" }} // 本物のボタンは隠す
            />
          </label>

          <button onClick={() => { setTempChoices(scene.choices.length > 0 ? [...scene.choices] : ["", "", ""]); setShowModal(true); }}
            style={{ width: "100%", marginTop: "25px", padding: "12px", background: "linear-gradient(to right, #ff69b4, #ff1493)", color: "white", border: "none", borderRadius: "25px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(255, 20, 147, 0.3)" }}>
            ＋ 選択肢を編集する
          </button>
        </div>
      </div>
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255, 192, 203, 0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "35px", borderRadius: "25px", width: "90%", maxWidth: "350px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)", border: "2px solid #ffb6c1", textAlign: "center", position: "relative" }}>
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "1.5rem", color: "#ffb6c1", cursor: "pointer" }}>✕</button>
            <h3 style={{ color: "#ff1493", marginTop: 0, marginBottom: "20px", fontSize: "1.2rem" }}>選択肢の設定</h3>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ marginBottom: "15px" }}>
                <input type="text" placeholder={`選択肢 ${i + 1}`} value={tempChoices[i] || ""} onChange={(e) => {
                  const newTemp = [...tempChoices]; newTemp[i] = e.target.value; setTempChoices(newTemp);
                }} style={{ ...inputBaseStyle, textAlign: "center" }} />
              </div>
            ))}
            <button onClick={applyChoices} style={{ marginTop: "10px", padding: "10px 40px", background: "#333", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>設定を完了する</button>
          </div>
        </div>
      )}
    </div>
  );
}