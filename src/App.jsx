import { Routes, Route, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "./supabase";
import React, { useState, useEffect, useRef } from "react";
import GameCanvas from "./GameCanvas";
import EditorPanel from "./EditorPanel";
import html2canvas from "html2canvas";

const initialScene = {
  name: "鴻上大和",
  text: "",
  charImg: "",
  bgImg: "",
  choices: []
};

const generateEditKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function App() {
  const [view, setView] = useState("home");
  const [isPreview, setIsPreview] = useState(false);
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("vn-projects");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [slides, setSlides] = useState([initialScene]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shareInfo, setShareInfo] = useState(null);

  const canvasRef = useRef(null);

  useEffect(() => {
    if (currentProjectId && view === "editor") {
      const updatedProjects = projects.map(p => 
        p.id === currentProjectId ? { ...p, slides: slides } : p
      );
      setProjects(updatedProjects);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  useEffect(() => {
    localStorage.setItem("vn-projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    const loadWork = async () => {
      const params = new URLSearchParams(window.location.search);
      const workId = params.get("id");
      const editKey = params.get("key");

      if (!workId) return;

      const { data, error } = await supabase
        .from("works")
        .select("*")
        .eq("id", workId)
        .single();

      if (error) {
        alert("作品が見つかりません");
        return;
      }

      setSlides(data.content);
      setCurrentIndex(0);

      if (editKey && editKey === data.edit_key) {
        setView("editor");
        setCurrentProjectId(data.id);
      } else {
        setView("shared");
      }
    };

    loadWork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createNewProject = () => {
    const name = prompt("作品名を入力してください", `新しい作品 ${projects.length + 1}`);
    if (!name) return;
    const newProject = {
      id: Date.now(),
      publishedId: null,
      name: name,
      slides: [{ ...initialScene }],
      editKey: generateEditKey()
    };
    setProjects([...projects, newProject]);
    openProject(newProject);
  };

  const openProject = (project) => {
    setCurrentProjectId(project.id);
    setSlides(project.slides);
    setCurrentIndex(0);
    setView("editor");
  };

  const deleteProject = async (localId, editKey) => {
    if (!window.confirm("この作品を削除してもよろしいですか？")) return;
    const project = projects.find(p => p.id === localId);
    if (project?.publishedId) {
      const { error } = await supabase
        .from("works")
        .delete()
        .eq("id", project.publishedId)
        .eq("edit_key", editKey);
      if (error) alert("DBの削除に失敗しました");
    }
    setProjects(projects.filter(p => p.id !== localId));
    setView("home");
  };

  const publishProject = async () => {
    const projectIndex = projects.findIndex(p => p.id === currentProjectId);
    const projectData = projects[projectIndex];
    let result;
    if (projectData.publishedId) {
      result = await supabase.from("works").update({ title: projectData.name, content: slides }).eq("id", projectData.publishedId).eq("edit_key", projectData.editKey).select().single();
    } else {
      result = await supabase.from("works").insert([{ title: projectData.name, content: slides, edit_key: projectData.editKey, is_public: true }]).select().single();
    }
    const { data, error } = result;
    if (error) { alert("保存失敗: " + error.message); return; }
    const updatedProjects = [...projects];
    updatedProjects[projectIndex].publishedId = data.id;
    setProjects(updatedProjects);
    const workId = data.id;
    const shareUrl = `${window.location.origin}/work/${workId}`;
    setShareInfo({ id: workId, shareUrl });
    alert(`保存完了！\nURL: ${shareUrl}`);
  };

  const currentScene = slides[currentIndex];
  const handleUpdate = (newScene) => {
    const newSlides = [...slides];
    newSlides[currentIndex] = newScene;
    setSlides(newSlides);
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }
    setSlides([...slides, { ...currentScene, text: "", choices: [] }]);
    setCurrentIndex(currentIndex + 1);
  };

  const goToPrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const saveSlideAsImage = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { useCORS: true, scale: 2, backgroundColor: "#000" });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `scene_${currentIndex + 1}.png`;
    link.click();
  };

  const shareOnX = () => {
    if (!shareInfo?.shareUrl) { alert("先に公開してください"); return; }
    const text = encodeURIComponent("乙女ゲームメーカーで作りました！あなたも簡単に作れます✨");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareInfo.shareUrl)}`, "_blank");
  };

  // --- 表示ロジックの整理 ---
  return (
    <>
      {/* 1. URLを常に監視する唯一の Routes (画面には何も表示しない設定) */}
      <div style={{ display: "none" }}>
        <Routes>
          <Route path="/work/:id" element={<WorkPage setSlides={setSlides} setView={setView} setCurrentIndex={setCurrentIndex} setCurrentProjectId={setCurrentProjectId} />} />
        </Routes>
      </div>

      {/* 2. 条件分岐による実際の表示 */}
      {view === "home" ? (
        <div style={homeBackgroundStyle}>
          <div style={titleBoxStyle}>
            <span style={{ fontSize: "1.2rem" }}>🌸</span>
            <h1 style={titleStyle}>乙女ゲームメーカー</h1>
            <span style={{ fontSize: "1.2rem" }}>🌸</span>
          </div>
          <div style={projectGridStyle}>
            <div onClick={createNewProject} style={newProjectCardStyle}>
              <span style={{ fontSize: "2.5rem" }}>＋</span>
              <p style={{ margin: "5px 0 0" }}>新しく作る</p>
            </div>
            {projects.map(project => (
              <div key={project.id} onClick={() => openProject(project)} style={projectCardStyle}>
                <h3 style={{ color: "#ff69b4", fontSize: "1rem", margin: "0 0 5px" }}>{project.name}</h3>
                <p style={{ fontSize: "0.75rem", color: "#999", margin: 0 }}>{project.slides.length} スライド</p>
                <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id, project.editKey); }} style={deleteButtonStyle}>削除</button>
              </div>
            ))}
          </div>
        </div>
      ) : (isPreview || view === "shared") ? (
        <div style={previewOverlayStyle}>
          {view !== "shared" && <button onClick={() => setIsPreview(false)} style={exitPreviewButtonStyle}>✕ 編集に戻る</button>}
          {view === "shared" && <button onClick={() => setView("home")} style={exitPreviewButtonStyle}>🏠 ホームへ</button>}
          <div style={canvasWrapperStyle}>
            <GameCanvas scene={currentScene} />
          </div>
          <div style={previewNavStyle}>
            <button onClick={goToPrev} disabled={currentIndex === 0} style={arrowButtonStyle}>◀</button>
            <button onClick={goToNext} style={arrowButtonStyle}>▶</button>
          </div>
        </div>
      ) : (
        <div style={editorBackgroundStyle}>
          <div style={toolbarStyle}>
            <button onClick={() => setView("home")} style={toolbarButtonStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>home</span>
            </button>
            <div style={{ color: "#ff69b4", fontWeight: "bold", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "center", margin: "0 10px" }}>
              {projects.find(p => p.id === currentProjectId)?.name}
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              <button onClick={publishProject} style={toolbarButtonStyle}>🚀URL共有</button>
              <button onClick={() => setIsPreview(true)} style={saveButtonStyle}>📖 再生</button>
            </div>
          </div>
          
          <div style={{ background: "#fff", padding: "5px 15px", borderRadius: "20px", border: "1px solid #ffdae9", color: "#ff69b4", fontWeight: "bold", fontSize: "0.8rem" }}>
            SCENE {currentIndex + 1} / {slides.length}
          </div>

          <div style={mainEditorAreaStyle}>
            <button onClick={goToPrev} disabled={currentIndex === 0} style={{ ...arrowButtonStyle, opacity: currentIndex === 0 ? 0.3 : 1, display: window.innerWidth < 600 ? "none" : "flex" }}>◀</button>
            <div ref={canvasRef} style={canvasContainerStyle}>
              <GameCanvas scene={currentScene} />
            </div>
            <button onClick={goToNext} style={{ ...arrowButtonStyle, display: window.innerWidth < 600 ? "none" : "flex" }}>▶</button>
          </div>

          <div style={mobileNavStyle}>
            <button onClick={goToPrev} disabled={currentIndex === 0} style={arrowButtonStyle}>◀</button>
            <button onClick={goToNext} style={arrowButtonStyle}>▶</button>
          </div>

          <div style={panelWrapperStyle}>
            <EditorPanel scene={currentScene} onUpdate={handleUpdate} />
          </div>
          
          <div style={{ display: "flex", gap: "10px", width: "100%", maxWidth: "800px", justifyContent: "center", paddingBottom: "20px" }}>
              <button onClick={saveSlideAsImage} style={toolbarButtonStyle}>📸 画像保存</button>
              <button onClick={shareOnX} style={toolbarButtonStyle}>𝕏 共有</button>
          </div>
        </div>
      )}
    </>
  );
}

function WorkPage({ setSlides, setView, setCurrentIndex, setCurrentProjectId }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editKey = searchParams.get("key");
  useEffect(() => {
    const loadWork = async () => {
      const { data, error } = await supabase.from("works").select("*").eq("id", id).single();
      if (error) { alert("作品が見つかりません"); return; }
      setSlides(data.content);
      setCurrentIndex(0);
      if (editKey && editKey === data.edit_key) { setView("editor"); setCurrentProjectId(data.id); } 
      else { setView("shared"); }
    };
    loadWork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return null;
}

// スタイル定義（変更なし）
const homeBackgroundStyle = { minHeight: "100vh", background: "linear-gradient(135deg, #fff5f7 0%, #ffffff 100%)", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "sans-serif" };
const titleBoxStyle = { width: "90%", maxWidth: "500px", display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", padding: "10px 20px", background: "#fff", borderRadius: "50px", border: "1px solid #ffdae9", marginBottom: "30px", boxShadow: "0 10px 20px rgba(255, 182, 193, 0.1)" };
const titleStyle = { fontSize: "clamp(1.2rem, 5vw, 2rem)", fontWeight: "bold", color: "#ff69b4", margin: 0, letterSpacing: "0.05em" };
const projectGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "15px", width: "100%", maxWidth: "900px" };
const projectCardStyle = { background: "#fff", padding: "15px", borderRadius: "15px", border: "1px solid #ffdae9", textAlign: "center", cursor: "pointer", boxShadow: "0 4px 10px rgba(255,182,193,0.15)" };
const newProjectCardStyle = { ...projectCardStyle, border: "2px dashed #ffb6c1", color: "#ffb6c1" };
const deleteButtonStyle = { marginTop: "8px", background: "none", border: "none", color: "#ffb6c1", cursor: "pointer", fontSize: "0.65rem" };
const editorBackgroundStyle = { display: "flex", flexDirection: "column", alignItems: "center", gap: "15px", padding: "10px", minHeight: "100vh", background: "#fff5f7", fontFamily: "sans-serif" };
const toolbarStyle = { width: "100%", maxWidth: "800px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 15px", background: "#fff", borderRadius: "30px", border: "1px solid #ffdae9", boxSizing: "border-box" };
const toolbarButtonStyle = { padding: "8px 12px", borderRadius: "20px", border: "1px solid #ffdae9", background: "#fff", color: "#ff69b4", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" };
const saveButtonStyle = { ...toolbarButtonStyle, background: "#ff69b4", color: "#fff", border: "none" };
const mainEditorAreaStyle = { display: "flex", alignItems: "center", gap: "10px", width: "100%", justifyContent: "center" };
const canvasContainerStyle = { width: "100%", maxWidth: "800px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", borderRadius: "15px", overflow: "hidden" };
const panelWrapperStyle = { width: "100%", maxWidth: "800px" };
const mobileNavStyle = { display: window.innerWidth < 600 ? "flex" : "none", gap: "20px", marginTop: "5px" };
const arrowButtonStyle = { width: "45px", height: "45px", borderRadius: "50%", border: "2px solid #ffb6c1", background: "#fff", color: "#ff69b4", fontSize: "1rem", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", boxShadow: "0 4px 10px rgba(255,182,193,0.3)" };
const previewOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#111", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "10px" };
const canvasWrapperStyle = { width: "100%", maxWidth: "800px", transform: window.innerWidth > 800 ? "scale(1.1)" : "scale(1)" };
const exitPreviewButtonStyle = { position: "absolute", top: "15px", right: "15px", padding: "8px 15px", borderRadius: "30px", background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid white", cursor: "pointer", fontSize: "0.8rem", zIndex: 2100 };
const previewNavStyle = { position: "absolute", bottom: "30px", display: "flex", gap: "40px" };