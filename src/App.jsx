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
        // ⭐ ロードした作品のIDをセットして上書きできるようにする
        setCurrentProjectId(data.id);
      } else {
        setView("shared");
      }
    };

    loadWork();
  }, []);

  const createNewProject = () => {
    const name = prompt("作品名を入力してください", `新しい作品 ${projects.length + 1}`);
    if (!name) return;
    const newProject = {
      id: Date.now(), // ローカル一時ID
      publishedId: null, // ⭐ Supabase側のUUIDを保持する用
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
    
    // DBに存在するならDBからも消す
    if (project?.publishedId) {
      const { error } = await supabase
        .from("works")
        .delete()
        .eq("id", project.publishedId)
        .eq("edit_key", editKey);

      if (error) {
        alert("DBの削除に失敗しました（編集権限なし）");
      }
    }

    setProjects(projects.filter(p => p.id !== localId));
    setView("home");
  };

  // ⭐ 公開・更新ロジックを修正
  const publishProject = async () => {
    const projectIndex = projects.findIndex(p => p.id === currentProjectId);
    const projectData = projects[projectIndex];

    let result;

    if (projectData.publishedId) {
      // すでに公開済みなら「更新 (update)」
      result = await supabase
        .from("works")
        .update({
          title: projectData.name,
          content: slides,
        })
        .eq("id", projectData.publishedId)
        .eq("edit_key", projectData.editKey)
        .select()
        .single();
    } else {
      // 未公開なら「新規作成 (insert)」
      result = await supabase
        .from("works")
        .insert([
          {
            title: projectData.name,
            content: slides,
            edit_key: projectData.editKey,
            is_public: true,
          },
        ])
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      alert("保存失敗: " + error.message);
      return;
    }

    // ⭐ publishedId をプロジェクトデータに保存して次回から上書きにする
    const updatedProjects = [...projects];
    updatedProjects[projectIndex].publishedId = data.id;
    setProjects(updatedProjects);

    const workId = data.id;
    const shareUrl = `${window.location.origin}/work/${workId}`;
    const editUrl = `${window.location.origin}/work/${workId}?key=${projectData.editKey}`;

    setShareInfo({ id: workId, shareUrl, editUrl });
    alert(`保存完了！\n${projectData.publishedId ? "内容を更新しました。" : "新しく公開しました。"}\nURL: ${shareUrl}`);
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
    const nextSlide = { ...currentScene, text: "", choices: [] };
    setSlides([...slides, nextSlide]);
    setCurrentIndex(currentIndex + 1);
  };

  const goToPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const saveSlideAsImage = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { useCORS: true, scale: 2, backgroundColor: "#000" });
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `scene_${currentIndex + 1}.png`;
    link.click();
  };

  const shareOnX = () => {
    if (!shareInfo?.shareUrl) {
      alert("先に公開してください");
      return;
    }
    const text = encodeURIComponent("私の乙女ゲーム作品を読んでください💗");
    const url = encodeURIComponent(shareInfo.shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  if (view === "home") {
    return (
      <div style={homeBackgroundStyle}>
        <h1 style={{ color: "#ff1493", marginBottom: "30px", fontSize: "2.5rem" }}>🌸 Visual Novel Studio</h1>
        <div style={projectGridStyle}>
          <div onClick={createNewProject} style={newProjectCardStyle}>
            <span style={{ fontSize: "3rem" }}>＋</span>
            <p>新しく作る</p>
          </div>
          {projects.map(project => (
            <div key={project.id} onClick={() => openProject(project)} style={projectCardStyle}>
              <h3 style={{ color: "#d02090" }}>{project.name}</h3>
              <p style={{ fontSize: "0.8rem", color: "#999" }}>{project.slides.length} スライド</p>
              <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id, project.editKey); }} style={deleteButtonStyle}>削除</button>
            </div>
          ))}
        </div>
        <Routes>
          <Route path="/work/:id" element={<WorkPage setSlides={setSlides} setView={setView} setCurrentIndex={setCurrentIndex} setCurrentProjectId={setCurrentProjectId} />} />
        </Routes>
      </div>
    );
  }

  if (isPreview || view === "shared") {
    return (
      <div style={previewOverlayStyle}>
        {view !== "shared" && <button onClick={() => setIsPreview(false)} style={exitPreviewButtonStyle}>✕ 編集に戻る</button>}
        {view === "shared" && <button onClick={() => setView("home")} style={exitPreviewButtonStyle}>🏠 ホームへ</button>}
        <div style={{ transform: "scale(1.2)" }}>
          <GameCanvas scene={currentScene} />
        </div>
        <div style={previewNavStyle}>
          <button onClick={goToPrev} disabled={currentIndex === 0} style={arrowButtonStyle}>◀</button>
          <button onClick={goToNext} style={arrowButtonStyle}>▶</button>
        </div>
      </div>
    );
  }

  return (
    <div style={editorBackgroundStyle}>
      <div style={toolbarStyle}>
        <button onClick={() => setView("home")} style={toolbarButtonStyle}>🏠 ホーム</button>
        <div style={{ color: "#ff69b4", fontWeight: "bold" }}>{projects.find(p => p.id === currentProjectId)?.name}</div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={saveSlideAsImage} style={toolbarButtonStyle}>📸 画像保存</button>
          <button onClick={shareOnX} style={toolbarButtonStyle}>𝕏 共有</button>
          <button onClick={publishProject} style={toolbarButtonStyle}>🚀 公開・更新</button>
          <button onClick={() => setIsPreview(true)} style={saveButtonStyle}>📖 全画面再生</button>
        </div>
      </div>
      
      <div style={{ background: "#fff", padding: "5px 20px", borderRadius: "20px", border: "1px solid #ffdae9", color: "#ff69b4", fontWeight: "bold" }}>
        SCENE {currentIndex + 1} / {slides.length}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <button onClick={goToPrev} disabled={currentIndex === 0} style={{ ...arrowButtonStyle, opacity: currentIndex === 0 ? 0.3 : 1 }}>◀</button>
        <div ref={canvasRef} style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.15)", borderRadius: "15px", overflow: "hidden" }}>
          <GameCanvas scene={currentScene} />
        </div>
        <button onClick={goToNext} style={arrowButtonStyle}>▶</button>
      </div>

      <div style={{ marginTop: "10px" }}>
        <EditorPanel scene={currentScene} onUpdate={handleUpdate} />
      </div>
    </div>
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
      if (editKey && editKey === data.edit_key) { 
        setView("editor"); 
        setCurrentProjectId(data.id);
      } 
      else { setView("shared"); }
    };
    loadWork();
  }, [id]);
  return null;
}

const previewOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#111", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 2000 };
const exitPreviewButtonStyle = { position: "absolute", top: "20px", right: "20px", padding: "10px 20px", borderRadius: "30px", background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid white", cursor: "pointer" };
const previewNavStyle = { position: "absolute", bottom: "30px", display: "flex", gap: "100px" };
const homeBackgroundStyle = { minHeight: "100vh", background: "linear-gradient(135deg, #fff5f7 0%, #ffffff 100%)", padding: "50px", display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "sans-serif" };
const projectGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px", width: "100%", maxWidth: "900px" };
const projectCardStyle = { background: "#fff", padding: "20px", borderRadius: "15px", border: "2px solid #ffdae9", textAlign: "center", cursor: "pointer", position: "relative", boxShadow: "0 4px 10px rgba(255,182,193,0.2)" };
const newProjectCardStyle = { ...projectCardStyle, border: "2px dashed #ffb6c1", color: "#ffb6c1", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" };
const deleteButtonStyle = { marginTop: "10px", background: "none", border: "none", color: "#ffb6c1", cursor: "pointer", fontSize: "0.7rem" };
const editorBackgroundStyle = { display: "flex", flexDirection: "column", alignItems: "center", gap: "25px", padding: "20px", minHeight: "100vh", background: "linear-gradient(180deg, #fff5f7 0%, #ffffff 100%)", fontFamily: "sans-serif" };
const toolbarStyle = { width: "800px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", background: "#fff", borderRadius: "30px", border: "1px solid #ffdae9" };
const toolbarButtonStyle = { padding: "8px 15px", borderRadius: "20px", border: "1px solid #ffdae9", background: "none", color: "#ff69b4", cursor: "pointer" };
const saveButtonStyle = { ...toolbarButtonStyle, background: "#ff69b4", color: "#fff", border: "none", fontWeight: "bold" };
const arrowButtonStyle = { width: "50px", height: "50px", borderRadius: "50%", border: "2px solid #ffb6c1", background: "#fff", color: "#ff69b4", fontSize: "1.2rem", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", boxShadow: "0 4px 10px rgba(255,20,147,0.3)" };