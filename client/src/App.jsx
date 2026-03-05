import { Route, Routes } from 'react-router';
import Navbar from './Components/Navbar';
import './index.css';
import { Toaster } from 'react-hot-toast';

// AponKhoj App
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path={'/'} element={<div>Home</div>} />
        {/* Add your routes here */}
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          error: {
            duration: 5000,
          },
        }}
      />
    </>
  );
}

export default App;
