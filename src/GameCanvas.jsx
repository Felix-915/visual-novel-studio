export default function GameCanvas({ scene }) {
  return (
    <div style={{
      width: "800px",
      height: "450px",
      position: "relative",
      background: "#222",
      border: "6px solid #fff5f7", // ほんのりピンクがかった白枠
      borderRadius: "15px",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)" // 画面自体に立体感
    }}>
      {/* 背景 */}
      {scene.bgImg && (
        <img
          src={scene.bgImg}
          alt=""
          style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      {/* キャラ */}
      {scene.charImg && (
        <img
          src={scene.charImg}
          alt=""
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            height: "95%", // 少し大きくして臨場感を出す
            filter: "drop-shadow(0 5px 15px rgba(0,0,0,0.3))", // キャラに影
            zIndex: 1
          }}
        />
      )}

      {/* メッセージ */}
      <div style={{
        position: "absolute",
        bottom: "15px",
        left: "3%",
        width: "94%",
        minHeight: "110px",
        // 白から薄いピンクへのグラデーション
        background: "linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,240,245,0.92))",
        padding: "25px 30px",
        borderRadius: "20px",
        border: "2px solid #ffb6c1", // ライトピンクの縁取り
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        boxSizing: "border-box",
        zIndex: 2
      }}>
        {/* 名前ボックスを少し浮かせたデザインに */}
        <strong style={{
          position: "absolute",
          top: "-15px",
          left: "20px",
          background: "#ff69b4", // 濃いピンク
          color: "white",
          padding: "4px 20px",
          borderRadius: "20px",
          fontSize: "1rem",
          letterSpacing: "0.1em",
          boxShadow: "2px 2px 5px rgba(0,0,0,0.1)"
        }}>
          {scene.name}
        </strong>
        
        <div style={{ 
          fontSize: "1.3rem", 
          color: "#444", 
          lineHeight: "1.6",
          fontWeight: "500",
          fontFamily: "'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif"
        }}>
          {scene.text}
        </div>
      </div>

      {/* 選択肢表示 */}
      {scene.choices.length > 0 && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "15px",
          background: "rgba(0,0,0,0.4)", // 背景を暗くして選択肢を強調
          zIndex: 10
        }}>
          {scene.choices.map((choice, index) => (
            choice && (
              <div key={index} style={{
                // 濃いピンクから明るいピンクへのグラデーション
                background: "linear-gradient(to right, #ff1493, #ff69b4)",
                padding: "12px 60px",
                borderRadius: "50px", // 完全な丸み
                color: "white",
                fontWeight: "bold",
                fontSize: "1.1rem",
                border: "2px solid white",
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                cursor: "pointer",
                textAlign: "center",
                minWidth: "250px",
                textShadow: "1px 1px 2px rgba(0,0,0,0.2)"
              }}>
                {choice}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}