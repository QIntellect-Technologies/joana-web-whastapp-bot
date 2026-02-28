import React from 'react';
import { ChatInterface } from './components/ChatInterface';

function App() {
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      {/* Device Frame (Optional aesthetic wrapper) */}
      <ChatInterface />
    </div>
  );
}

export default App;
