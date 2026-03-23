import React, { useState, useRef, useEffect } from 'react';

export const Chat = ({ messages, sendMessage, disabled }) => {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      sendMessage(text);
      setText('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'you' ? 'items-end' : 'items-start'}`}>
            <span className={`text-xs text-slate-400 mb-1 ${msg.type === 'system' ? 'text-center w-full block' : ''}`}>
              {msg.type === 'system' ? '' : msg.sender === 'you' ? 'You' : 'Stranger'}
            </span>
            <div className={`px-4 py-2 ${
              msg.type === 'system' ? 'rounded-md bg-slate-800 text-slate-300 w-full text-center text-xs' :
              msg.sender === 'you' ? 'rounded-2xl rounded-tr-sm bg-blue-600 text-white' : 'rounded-2xl rounded-tl-sm bg-slate-700 text-white'
            } max-w-[85%]`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="p-3 bg-slate-800 flex gap-2">
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "Connecting to chat..." : "Type a message..."}
          className="flex-1 bg-slate-900 text-white px-4 py-2 rounded-full border border-slate-700 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={disabled || !text.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};
