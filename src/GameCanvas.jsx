export default function GameCanvas({ scene }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px", // ← 追加（PCで広がりすぎ防止）
        margin: "0 auto",  // ← 追加（中央寄せ）
        aspectRatio: "16 / 9",
        position: "relative",
        background: "#222",
        border: "6px solid #fff5f7",
        borderRadius: "15px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        boxSizing: "border-box"
      }}
    >
      {scene.bgImg && (
        <img
          src={scene.bgImg}
          alt=""
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />
      )}

      {scene.charImg && (
        <img
          src={scene.charImg}
          alt=""
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            height: "95%",
            filter: "drop-shadow(0 5px 15px rgba(0,0,0,0.3))",
            zIndex: 1
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          bottom: "15px",
          left: "3%",
          width: "94%",
          minHeight: "25%",
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,240,245,0.92))",
          padding: "15px 20px",
          borderRadius: "20px",
          border: "2px solid #ffb6c1",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          boxSizing: "border-box",
          zIndex: 2
        }}
      >
        <strong
          style={{
            position: "absolute",
            top: "-15px",
            left: "20px",
            background: "#ff69b4",
            color: "white",
            padding: "4px 20px",
            borderRadius: "20px",
            fontSize: "clamp(0.7rem, 3vw, 1rem)",
            letterSpacing: "0.1em",
            boxShadow: "2px 2px 5px rgba(0,0,0,0.1)"
          }}
        >
          {scene.name}
        </strong>

        <div
          style={{
            fontSize: "clamp(0.85rem, 4vw, 1.3rem)",
            color: "#444",
            lineHeight: "1.4",
            fontWeight: "500",
            fontFamily:
              "'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif"
          }}
        >
          {scene.text}
        </div>
      </div>

      {scene.choices.length > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            background: "rgba(0,0,0,0.4)",
            zIndex: 10,
            padding: "10px"
          }}
        >
          {scene.choices.map(
            (choice, index) =>
              choice && (
                <div
                  key={index}
                  style={{
                    background:
                      "linear-gradient(to right, #ff1493, #ff69b4)",
                    padding: "8px 20px",
                    borderRadius: "50px",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "clamp(0.7rem, 3.5vw, 1.1rem)",
                    border: "2px solid white",
                    boxShadow:
                      "0 4px 15px rgba(0,0,0,0.4)",
                    cursor: "pointer",
                    textAlign: "center",
                    minWidth: "60%",
                    textShadow:
                      "1px 1px 2px rgba(0,0,0,0.2)"
                  }}
                >
                  {choice}
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}