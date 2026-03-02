import React, { useState } from "react";

export default function EditorPanel({ scene, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [tempChoices, setTempChoices] = useState(["", "", ""]);

  const handleChange = (field, value) => {
    onUpdate({ ...scene, [field]: value });
  };

  const handleFile = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      handleChange(field, URL.createObjectURL(file));
    }
  };

  const handleTempChoiceChange = (index, value) => {
    const newTemp = [...tempChoices];
    newTemp[index] = value;
    setTempChoices(newTemp);
  };

  const applyChoices = () => {
    onUpdate({ ...scene, choices: tempChoices });
    setShowModal(false);
  };

  const cancelChoices = () => {
    setShowModal(false);
  };

  const labelStyle = { display: "block", fontSize: "0.85rem", fontWeight: "bold", color: "#d02090", marginBottom: "5px", marginTop: "15px", letterSpacing: "0.05em" };
  const inputBaseStyle = { width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ffdae9", background: "#fff9fb", boxSizing: "border-box", fontSize: "1rem", outline: "none", color: "#444" };

  return (
    <div style={{ width: "800px", background: "linear-gradient(135deg, #fff 0%, #fff0f5 100%)", padding: "25px", borderRadius: "20px", boxShadow: "0 10px 25px rgba(255, 182, 193, 0.2)", border: "1px solid #ffe4ed" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <label style={labelStyle}>💖 キャラクター名</label>
          <input type="text" value={scene.name} onChange={(e) => handleChange("name", e.target.value)} style={inputBaseStyle} placeholder="名前を入力..." />
          <label style={labelStyle}>💬 セリフ</label>
          <textarea
            value={scene.text}
            onChange={(e) => handleChange("text", e.target.value)}
            style={{ ...inputBaseStyle, height: "100px", resize: "none" }}
            placeholder="（ここにセリフを入力）" 
          />
        </div>
        <div>
          <label style={labelStyle}>🖼️ キャラ画像</label>
          <input type="file" onChange={(e) => handleFile("charImg", e)} style={{ ...inputBaseStyle, fontSize: "0.8rem", border: "1px dashed #ffb6c1" }} />
          <label style={labelStyle}>🌄 背景画像</label>
          <input type="file" onChange={(e) => handleFile("bgImg", e)} style={{ ...inputBaseStyle, fontSize: "0.8rem", border: "1px dashed #ffb6c1" }} />
          <button 
            onClick={() => { 
              setTempChoices(scene.choices.length > 0 ? [...scene.choices] : ["", "", ""]);
              setShowModal(true); 
            }} 
            style={{ width: "100%", marginTop: "25px", padding: "12px", background: "linear-gradient(to right, #ff69b4, #ff1493)", color: "white", border: "none", borderRadius: "25px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(255, 20, 147, 0.3)" }}
          >
            ＋ 選択肢を編集する
          </button>
        </div>
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(255, 192, 203, 0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "35px", borderRadius: "25px", width: "350px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)", border: "2px solid #ffb6c1", textAlign: "center", position: "relative" }}>
            <button 
              onClick={cancelChoices}
              style={{ position: "absolute", top: "15px", right: "20px", background: "none", border: "none", fontSize: "1.5rem", color: "#ffb6c1", cursor: "pointer" }}
            >
              ✕
            </button>
            <h3 style={{ color: "#ff1493", marginTop: 0, marginBottom: "20px", fontSize: "1.2rem" }}>選択肢の設定</h3>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ marginBottom: "15px" }}>
                <input type="text" placeholder={`選択肢 ${i + 1}`} value={tempChoices[i] || ""} onChange={(e) => handleTempChoiceChange(i, e.target.value)} style={{ ...inputBaseStyle, textAlign: "center" }} />
              </div>
            ))}
            <button onClick={applyChoices} style={{ marginTop: "10px", padding: "10px 40px", background: "#333", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>設定を完了する</button>
          </div>
        </div>
      )}
    </div>
  );
}