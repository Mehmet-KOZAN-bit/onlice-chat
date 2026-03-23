import React from 'react';
import { useWebRTC } from './hooks/useWebRTC';
import { VideoPlayer } from './components/VideoPlayer';
import { Chat } from './components/Chat';
import { Video, MessagesSquare, Users, Loader2, Play, SkipForward, XSquare } from 'lucide-react';

function App() {
  const { localStream, remoteStream, status, messages, startMatch, stopMatch, nextMatch, sendMessage } = useWebRTC();

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Video className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            OmegleClone
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Anonymous
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Video Area */}
        <section className="flex-1 relative bg-black flex flex-col group min-h-[40vh]">
          
          {/* Main Remote Video */}
          <div className="flex-1 relative w-full h-full">
            {remoteStream ? (
              <VideoPlayer stream={remoteStream} isLocal={false} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                {status === 'Searching' ? (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <p className="text-lg animate-pulse">Finding a stranger...</p>
                  </>
                ) : (
                  <>
                    <Users className="w-16 h-16 opacity-50" />
                    <p className="text-lg">Press Start to find a partner</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Picture-in-Picture Local Video */}
          <div className="absolute top-6 right-6 w-32 md:w-48 aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl transition-transform hover:scale-105 z-20">
            {localStream ? (
              <VideoPlayer stream={localStream} isLocal={true} />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-xs text-slate-400">
                Loading Camera...
              </div>
            )}
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700/50 shadow-2xl z-20">
            {status === 'Idle' ? (
              <button 
                onClick={startMatch}
                disabled={!localStream}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Waitlist
              </button>
            ) : (
              <>
                <button 
                  onClick={stopMatch}
                  className="flex items-center gap-2 px-5 py-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-white rounded-full font-medium transition-all"
                >
                  <XSquare className="w-5 h-5" />
                  Stop
                </button>
                <button 
                  onClick={nextMatch}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-blue-500/20"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                  Next
                </button>
              </>
            )}
          </div>
        </section>

        {/* Chat Sidebar */}
        <section className="flex-1 md:flex-none h-[40vh] md:h-auto md:w-96 lg:w-[400px] flex flex-col z-10 shrink-0">
          <div className="px-4 py-3 bg-slate-900 border-b border-t md:border-t-0 border-slate-700/50 flex items-center gap-2 text-slate-300 font-medium">
            <MessagesSquare className="w-5 h-5" />
            Live Chat
          </div>
          <div className="flex-1 overflow-hidden bg-slate-900">
             <Chat 
               messages={messages} 
               sendMessage={sendMessage} 
               disabled={status !== 'Connected'} 
             />
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
