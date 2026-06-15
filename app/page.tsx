"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Trash2, Plus, Image as ImageIcon, Video, FileText, LayoutDashboard, Menu, X, Upload } from "lucide-react";

// Fix for Next.js to ensure videos load correctly in the browser
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

type ElementType = "image" | "video" | "note";

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

  useEffect(() => {
    setIsMounted(true);
    const savedBoards = localStorage.getItem("visionBoards");
    if (savedBoards) {
      const parsed = JSON.parse(savedBoards);
      setBoards(parsed);
      if (parsed.length > 0) setActiveBoardId(parsed[0].id);
    }
  }, []);

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
              
              <div className="grid grid-cols-2 sm:flex bg-gray-100 p-1 rounded w-full xl:w-auto gap-1 shrink-0">
                <button onClick={() => setInputType("note")} className={`p-2 rounded flex justify-center items-center gap-1 text-xs sm:text-sm ${inputType === "note" ? "bg-white shadow" : "text-gray-600"}`}><FileText className="w-4 h-4"/> Note</button>
                <button onClick={() => setInputType("image")} className={`p-2 rounded flex justify-center items-center gap-1 text-xs sm:text-sm ${inputType === "image" ? "bg-white shadow" : "text-gray-600"}`}><ImageIcon className="w-4 h-4"/> Image URL</button>
                <button onClick={() => setInputType("upload")} className={`p-2 rounded flex justify-center items-center gap-1 text-xs sm:text-sm ${inputType === "upload" ? "bg-white shadow text-indigo-600 font-medium" : "text-gray-600"}`}><Upload className="w-4 h-4"/> Upload</button>
                <button onClick={() => setInputType("video")} className={`p-2 rounded flex justify-center items-center gap-1 text-xs sm:text-sm ${inputType === "video" ? "bg-white shadow" : "text-gray-600"}`}><Video className="w-4 h-4"/> Video</button>
              </div>

              <div className="flex w-full xl:w-auto gap-2">
                {inputType === "upload" ? (
                  <div className="flex-1 w-full xl:w-64">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-xs sm:text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder={inputType === "note" ? "Type note..." : "Paste URL..."}
                      className="border rounded p-2 flex-1 min-w-0 xl:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      value={inputContent}
                      onChange={(e) => setInputContent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addElement()}
                    />
                    <button onClick={addElement} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-medium whitespace-nowrap shrink-0">
                      Add
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Canvas Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 auto-rows-max">
                {activeBoard.elements.map((el) => (
                  <div key={el.id} className="relative group bg-white p-3 md:p-4 rounded-xl shadow-md border border-gray-100">
                    <button 
                      onClick={() => deleteElement(el.id)} 
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 shadow-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {el.type === "note" && (
                      <div className="h-full min-h-[120px] md:min-h-[150px] flex items-center justify-center bg-yellow-50 rounded-lg p-4 text-center text-base md:text-lg text-gray-800 shadow-inner break-words overflow-hidden">
                        {el.content}
                      </div>
                    )}
                    
                    {el.type === "image" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={el.content} alt="Board reference" className="w-full h-auto rounded-lg object-cover max-h-[300px] md:max-h-[400px]" onError={(e) => e.currentTarget.src = "https://via.placeholder.com/400?text=Invalid+Image"} />
                    )}

                    {el.type === "video" && (
                      <div className="relative pt-[56.25%] rounded-lg overflow-hidden bg-black">
                        <ReactPlayer 
                          url={el.content} 
                          className="absolute top-0 left-0" 
                          width="100%" 
                          height="100%" 
                          controls={true}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {activeBoard.elements.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <ImageIcon className="w-12 h-12 md:w-16 md:h-16 mb-4 text-gray-300" />
                  <p className="text-lg md:text-xl font-medium">This board is empty.</p>
                  <p className="text-sm mt-2 max-w-xs">Add notes, paste URLs, or upload images to build your vision.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <LayoutDashboard className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg md:text-xl font-medium">No board selected</p>
            <p className="text-sm mt-2 md:hidden">Tap the menu top right to select or create a board.</p>
            <p className="text-sm mt-2 hidden md:block">Select a board from the sidebar to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}
