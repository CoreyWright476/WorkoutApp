import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import LogWorkout from './pages/LogWorkout'
import Plans from './pages/Plans'
import Exercises from './pages/Exercises'
import ExerciseDetail from './pages/ExerciseDetail'
import { Navbar } from './components/Navbar';
import { WorkoutsContextProvider } from './context/WorkoutsContext'
import React from 'react';


function App() {
  return (
    <div className="App">
      <WorkoutsContextProvider>
        <BrowserRouter>
        <Navbar />
        <div className="pages">
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/log' element={<LogWorkout />} />
            <Route path='/plans' element={<Plans />} />
            <Route path='/exercises' element={<Exercises />} />
            <Route path='/exercises/:id' element={<ExerciseDetail />} />
          </Routes>
        </div>
        </BrowserRouter>
      </WorkoutsContextProvider>
    </div>
  );
}

export default App;
