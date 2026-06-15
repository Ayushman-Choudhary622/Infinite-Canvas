"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Trash2, Plus, Image as ImageIcon, Video, FileText, LayoutDashboard, Menu, X, Upload, Code } from "lucide-react";

// Fix for Next.js to ensure standard videos load correctly in the browser
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type ElementType = "image" | "video" | "note" | "embed";

interface BoardElement {
  id: string;
  type: ElementType;
  content: string; 
}

interface Board {
  id: string;
  name: string;
  elements: BoardElement[];
}

export default function VisionBoard() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const [newBoardName, setNewBoardName] = useState("");
  const [inputContent, setInputContent] = useState("");
  const [inputType, setInputType] = useState<ElementType | "upload">("note");

  // Load data from Local Storage
  useEffect(() => {
    setIsMounted(true);
    const savedBoards = localStorage.getItem("visionBoards");
    if (savedBoards) {
      const parsed = JSON.parse(savedBoards);
      setBoards(parsed);
      if (parsed.length > 0) setActiveBoardId(parsed[0].id);
    }
  }, []);

  // Save data to Local Storage
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem("visionBoards", JSON.stringify(boards));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          alert("⚠️ Storage Full! Browsers only allow ~5MB of local storage. Please delete some images to save new items.");
        }
      }
    }
  }, [boards, isMounted]);

  // Trigger Pinterest script whenever boards update
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      // @ts-ignore
      if (window.PinUtils && window.PinUtils.build) {
        // @ts-ignore
        window.PinUtils.build();
      }
    }
  }, [boards, isMounted]);

  const createBoard = () => {
    if (!newBoardName.trim()) return;
    const newBoard: Board = {
      id: crypto.randomUUID(),
      name: newBoardName,
      elements: [],
    };
    setBoards([...boards, newBoard]);
    setActiveBoardId(newBoard.id);
    setNewBoardName("");
    setIsSidebarOpen(false); 
  };

  const deleteBoard = (id: string) => {
    const updatedBoards = boards.filter((b) => b.id !== id);
    setBoards(updatedBoards);
    if (activeBoardId === id) {
      setActiveBoardId(updatedBoards.length > 0 ? updatedBoards[0].id : null);
    }
  };

  const addElement = () => {
    if (!inputContent.trim() || !activeBoardId) return;
    const newElement: BoardElement = {
      id: crypto.randomUUID(),
      type: inputType === "upload" ? "image" : inputType,
      content: inputContent,
    };
    setBoards(boards.map(board => 
      board.id === activeBoardId 
        ? { ...board, elements: [...board.elements, newElement] }
        : board
    ));
    setInputContent("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeBoardId) return;

    if (file.size > 2 * 1024 * 1024) {
       alert("This image is quite large. Keep an eye on your storage limit.");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const newElement: BoardElement = {
        id: crypto.randomUUID(),
        type: "image",
        content: base64String, 
      };
      setBoards(boards.map(board => 
        board.id === activeBoardId 
          ? { ...board, elements: [...board.elements, newElement] }
          : board
      ));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const deleteElement = (elementId: string) => {
    setBoards(boards.map(board => 
      board.id === activeBoardId 
        ? { ...board, elements: board.elements.filter(e => e.id !== elementId) }
        : board
    ));
  };

  if (!isMounted) return null; 

  const activeBoard = boards.find((b) => b.id === activeBoardId);

  return (
    <div className="flex h-[100dvh] w-full bg-gray-50 text-gray-900 font-sans overflow-hidden relative">
      
      {/* Mobile Dark Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Slide-out Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 md:w-72 bg-white border-r border-gray-200 p-4 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-none ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            My Boards
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-gray-500 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="New board name..."
            className="w-full min-w-0 border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createBoard()}
          />
          <button onClick={createBoard} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 shrink-0">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pb-4">
          {boards.map((board) => (
            <div 
              key={board.id} 
              className={`flex justify-between items-center p-3 rounded cursor-pointer transition-colors ${
                activeBoardId === board.id ? "bg-indigo-50 border-indigo-200 border" : "hover:bg-gray-100 border border-transparent"
              }`}
              onClick={() => {
                setActiveBoardId(board.id);
                setIsSidebarOpen(false); 
              }}
            >
              <span className="font-medium truncate pr-2">{board.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteBoard(board.id); }} className="text-gray-400 hover:text-red-500 shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {boards.length === 0 && <p className="text-sm text-gray-500 italic mt-4 text-center">Create a board to start.</p>}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        
        {/* Mobile Top Navigation */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm shrink-0">
          <h1 className="text-lg font-bold flex items-center gap-2 truncate">
            {activeBoard ? activeBoard.name : "Vision Board"}
          </h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 rounded text-gray-700 shrink-0">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {activeBoard ? (
          <>
            {/* Action Toolbar */}
            <div className="bg-white border-b p-3 md:p-4 shadow-sm flex flex-col xl:flex-row items-start xl:items-center gap-3 shrink-0 z-20">
              <h2 className="hidden md:block text-2xl font-bold w-full xl:w-auto xl:mr-auto truncate">{activeBoard.name}</h2>
              
              {/* Type Selectors */}
              <div className="flex flex-wrap bg-gray-100 p-1 rounded w-full xl:w-auto gap-1 shrink-0">
                <button onClick={() => setInputType("note")} className={`p-2 rounded flex-1 md:flex-none justify-center flex items-center gap-1 text-xs sm:text-sm ${inputType === "note" ? "bg-white shadow" : "text-gray-600"}`}><FileText className="w-4 h-4"/> Note</button>
                <button onClick={() => setInputType("image")} className={`p-2 rounded flex-1 md:flex-none justify-center flex items-center gap-1 text-xs sm:text-sm ${inputType === "image" ? "bg-white shadow" : "text-gray-600"}`}><ImageIcon className="w-4 h-4"/> Img URL</button>
                <button onClick={() => setInputType("upload")} className={`p-2 rounded flex-1 md:flex-none justify-center flex items-center gap-1 text-xs sm:text-sm ${inputType === "upload" ? "bg-white shadow text-indigo-600 font-medium" : "text-gray-600"}`}><Upload className="w-4 h-4"/> Upload</button>
                <button onClick={() => setInputType("video")} className={`p-2 rounded flex-1 md:flex-none justify-center flex items-center gap-1 text-xs sm:text-sm ${inputType === "video" ? "bg-white shadow" : "text-gray-600"}`}><Video className="w-4 h-4"/> URL</button>
                <button onClick={() => setInputType("embed")} className={`p-2 rounded flex-1 md:flex-none justify-center flex items-center gap-1 text-xs sm:text-sm ${inputType === "embed" ? "bg-white shadow text-green-600 font-medium" : "text-gray-600"}`}><Code className="w-4 h-4"/> Embed</button>
              </div>

              {/* Dynamic Input Area */}
              <div className="flex w-full xl:w-auto gap-2">
                {inputType === "upload" ? (
                  <div className="flex-1 w-full xl:w-64">
