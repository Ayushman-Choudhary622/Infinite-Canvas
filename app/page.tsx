"use client";

import { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import { Trash2, Plus, Image as ImageIcon, Video, FileText, LayoutDashboard } from "lucide-react";

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

  const [newBoardName, setNewBoardName] = useState("");
  const [inputContent, setInputContent] = useState("");
  const [inputType, setInputType] = useState<ElementType>("note");

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
      localStorage.setItem("visionBoards", JSON.stringify(boards));
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
      type: inputType,
      content: inputContent,
    };
    setBoards(boards.map(board => 
      board.id === activeBoardId 
        ? { ...board, elements: [...board.elements, newElement] }
        : board
    ));
    setInputContent("");
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
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full shadow-sm">
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6 text-indigo-600" />
          My Boards
        </h1>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="New board name..."
            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createBoard()}
          />
          <button onClick={createBoard} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {boards.map((board) => (
            <div 
              key={board.id} 
              className={`flex justify-between items-center p-3 rounded cursor-pointer transition-colors ${
                activeBoardId === board.id ? "bg-indigo-50 border-indigo-200 border" : "hover:bg-gray-100 border border-transparent"
              }`}
              onClick={() => setActiveBoardId(board.id)}
            >
              <span className="font-medium truncate">{board.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteBoard(board.id); }} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {boards.length === 0 && <p className="text-sm text-gray-500 italic mt-4">Create a board to start designing.</p>}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeBoard ? (
          <>
            <div className="bg-white border-b p-4 shadow-sm flex items-center gap-4 z-10">
              <h2 className="text-2xl font-bold mr-auto">{activeBoard.name}</h2>
              
              <div className="flex bg-gray-100 p-1 rounded">
                <button onClick={() => setInputType("note")} className={`p-2 rounded flex items-center gap-1 text-sm ${inputType === "note" ? "bg-white shadow" : "text-gray-600"}`}><FileText className="w-4 h-4"/> Note</button>
                <button onClick={() => setInputType("image")} className={`p-2 rounded flex items-center gap-1 text-sm ${inputType === "image" ? "bg-white shadow" : "text-gray-600"}`}><ImageIcon className="w-4 h-4"/> Image URL</button>
                <button onClick={() => setInputType("video")} className={`p-2 rounded flex items-center gap-1 text-sm ${inputType === "video" ? "bg-white shadow" : "text-gray-600"}`}><Video className="w-4 h-4"/> Video Link</button>
              </div>

              <input
                type="text"
                placeholder={inputType === "note" ? "Type your note..." : "Paste URL here..."}
                className="border rounded p-2 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addElement()}
              />
              <button onClick={addElement} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-medium">
                Add
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
                {activeBoard.elements.map((el) => (
                  <div key={el.id} className="relative group bg-white p-4 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <button 
                      onClick={() => deleteElement(el.id)} 
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {el.type === "note" && (
                      <div className="h-full min-h-[150px] flex items-center justify-center bg-yellow-50 rounded p-4 text-center text-lg text-gray-800 shadow-inner">
                        {el.content}
                      </div>
                    )}
                    
                    {el.type === "image" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={el.content} alt="Board reference" className="w-full h-auto rounded object-cover max-h-[400px]" onError={(e) => e.currentTarget.src = "https://via.placeholder.com/400?text=Invalid+Image+URL"} />
                    )}

                    {el.type === "video" && (
                      <div className="relative pt-[56.25%] rounded overflow-hidden bg-black">
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
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-xl">This board is empty.</p>
                  <p className="text-sm mt-2">Add notes, images, or video links from the top bar.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">
            Select or create a board to get started.
          </div>
        )}
      </div>
    </div>
  );
}
