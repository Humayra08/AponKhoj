import { Route, Routes } from 'react-router';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import './index.css';
import { Toaster } from 'react-hot-toast';

// AponKhoj App
function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path={'/'} element={<div></div>} />
          {/* Add your routes here */}
        </Routes>
      </main>
      <Footer />
      <Toaster
        position="top-center"
        toastOptions={{
          error: {
            duration: 5000,
          },
        }}
      />
    </div>
  );
}

export default App;
